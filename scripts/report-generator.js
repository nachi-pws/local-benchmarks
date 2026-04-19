#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseJsonc } from 'jsonc-parser';
import { getReportsDir, loadLaunchConfig, loadPromptConfig } from './config-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const folderPath = args[0] || getReportsDir();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatSeconds(ms) {
    if (ms === null || ms === undefined || ms < 0) return 'N/A';
    return (ms / 1000).toFixed(3) + 's';
}

function formatNumber(n) {
    if (!n && n !== 0) return 'N/A';
    return Math.round(n).toLocaleString();
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function findBenchmarkReports(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Directory not found: ${dir}`);
        return [];
    }

    try {
        const files = fs.readdirSync(dir)
            .filter(f => f.startsWith('benchmark-report-') && f.endsWith('.json'))
            .map(f => path.join(dir, f))
            .sort()
            .reverse();  // Most recent first

        return files;
    } catch (err) {
        console.error(`❌ Error reading directory: ${err.message}`);
        return [];
    }
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processReports(reportFiles) {
    const promptData = {};
    const consolidatedData = {};

    console.log(`\n📊 Reading ${reportFiles.length} report file(s)...\n`);

    reportFiles.forEach((filepath, index) => {
        const filename = path.basename(filepath);
        process.stdout.write(`   [${index + 1}/${reportFiles.length}] ${filename.substring(0, 45).padEnd(45)} `);

        try {
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            
            if (!data.results || !data.prompt) {
                console.log('❌ Invalid format');
                return;
            }

            const promptName = data.prompt.name;
            if (!promptData[promptName]) {
                promptData[promptName] = {
                    prompt: data.prompt,
                    results: [],
                };
            }

            promptData[promptName].results.push(...data.results);

            // Build consolidated data
            data.results.forEach(r => {
                if (!r.success) return;

                const key = `${r.serverVersion}|${r.modelName}`;

                if (!consolidatedData[key]) {
                    consolidatedData[key] = {
                        serverVersion: r.serverVersion,
                        modelName: r.modelName,
                        results: [],
                    };
                }

                // Use actual measured model load time from benchmark data
                consolidatedData[key].results.push({
                    prompt: promptName,
                    ttft: r.ttftMs,
                    totalTime: r.totalMs,
                    responseLength: r.responseLength,
                    tokenCount: r.tokenCount,
                    modelLoadTime: r.modelLoadTimeMs || 0,
                });
            });

            console.log(`✅ (${data.results.filter(r => r.success).length}/${data.results.length})`);
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }
    });

    return { promptData, consolidatedData };
}

// ============================================================================
// TABLE FORMATTING
// ============================================================================

function formatTable(headers, rows) {
    if (rows.length === 0) {
        return '_No data_\n';
    }

    const headerLine = '| ' + headers.join(' | ') + ' |';
    const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const rowLines = rows.map(row => '| ' + row.join(' | ') + ' |');

    return [headerLine, separator, ...rowLines].join('\n') + '\n';
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generatePerPromptTables(promptData) {
    let markdown = `## 📋 Per-Prompt Analysis\n\n`;

    Object.entries(promptData).forEach(([promptName, {prompt, results}]) => {
        markdown += `### ${promptName}\n`;
        markdown += `- **Category:** ${prompt.category} | **Length:** ${prompt.length}\n`;
        markdown += `- **Streaming:** ${prompt.streaming ? '✅' : '❌'}\n\n`;

        const successful = results.filter(r => r.success);
        if (successful.length === 0) {
            markdown += '_No successful results_\n\n';
            return;
        }

        // Group by server version
        const byServer = {};
        successful.forEach(r => {
            if (!byServer[r.serverVersion]) byServer[r.serverVersion] = [];
            byServer[r.serverVersion].push(r);
        });

        Object.entries(byServer).forEach(([server, serverResults]) => {
            markdown += `#### ${server}\n\n`;

            const headers = ['Model', 'Model Load*', 'TTFT', 'Total', 'Chars', 'Tokens'];
            const rows = serverResults
                .sort((a, b) => a.modelName.localeCompare(b.modelName))
                .map(r => [
                    r.modelName,
                    formatSeconds(r.modelLoadTimeMs || 0),
                    formatSeconds(r.ttftMs),
                    formatSeconds(r.totalMs),
                    formatNumber(r.responseLength),
                    formatNumber(r.tokenCount),
                ]);

            markdown += formatTable(headers, rows);
            markdown += '_*Model Load is measured at first spawn; cached on subsequent prompts_\n';
            markdown += '\n';
        });
    });

    return markdown;
}

function generateConsolidatedReport(consolidatedData) {
    let markdown = `## 🏆 Consolidated Analysis\n\n`;
    markdown += `_Averages and aggregates across all prompts_\n\n`;

    const sorted = Object.values(consolidatedData).sort((a, b) =>
        a.serverVersion.localeCompare(b.serverVersion) || a.modelName.localeCompare(b.modelName)
    );

    // Group by server
    const byServer = {};
    sorted.forEach(item => {
        if (!byServer[item.serverVersion]) byServer[item.serverVersion] = [];
        byServer[item.serverVersion].push(item);
    });

    Object.entries(byServer).forEach(([server, items]) => {
        markdown += `### ${server}\n\n`;

        const headers = ['Model', 'Load Time', 'Avg TTFT', 'Avg Total', 'Avg Chars', 'Avg Tokens', 'Tests'];
        const rows = items.map(item => {
            // All results for a server×model combo share the same modelLoadTime (measured once at startup)
            const loadTime = item.results[0]?.modelLoadTime || 0;
            
            const avgTtft = item.results.reduce((s, r) => s + (r.ttft || 0), 0) / item.results.length;
            const avgTotal = item.results.reduce((s, r) => s + (r.totalTime || 0), 0) / item.results.length;
            const avgChars = item.results.reduce((s, r) => s + (r.responseLength || 0), 0) / item.results.length;
            const avgTokens = item.results.reduce((s, r) => s + (r.tokenCount || 0), 0) / item.results.length;

            return [
                item.modelName,
                formatSeconds(loadTime),
                formatSeconds(avgTtft),
                formatSeconds(avgTotal),
                formatNumber(avgChars),
                formatNumber(avgTokens),
                item.results.length.toString(),
            ];
        });

        markdown += formatTable(headers, rows);
        markdown += '_Load Time: measured from llama-server spawn to first response (0 = already cached)\n';
        markdown += '\n';
    });

    return markdown;
}

function generatePerModelComparison(consolidatedData) {
    let markdown = `## 📊 Model Performance Across Servers\n\n`;

    const byModel = {};
    Object.values(consolidatedData).forEach(item => {
        if (!byModel[item.modelName]) byModel[item.modelName] = [];
        byModel[item.modelName].push(item);
    });

    Object.entries(byModel).forEach(([modelName, items]) => {
        markdown += `### ${modelName}\n\n`;

        const headers = ['Server', 'Load Time', 'Avg TTFT', 'Avg Total', 'Avg Chars', 'Avg Tokens'];
        const rows = items.map(item => {
            // All results for a server×model combo share the same modelLoadTime (measured once at startup)
            const loadTime = item.results[0]?.modelLoadTime || 0;
            
            const avgTtft = item.results.reduce((s, r) => s + (r.ttft || 0), 0) / item.results.length;
            const avgTotal = item.results.reduce((s, r) => s + (r.totalTime || 0), 0) / item.results.length;
            const avgChars = item.results.reduce((s, r) => s + (r.responseLength || 0), 0) / item.results.length;
            const avgTokens = item.results.reduce((s, r) => s + (r.tokenCount || 0), 0) / item.results.length;

            return [
                item.serverVersion,
                formatSeconds(loadTime),
                formatSeconds(avgTtft),
                formatSeconds(avgTotal),
                formatNumber(avgChars),
                formatNumber(avgTokens),
            ];
        });

        markdown += formatTable(headers, rows);
        markdown += '\n';
    });

    return markdown;
}

function generateSummaryStats(consolidatedData, promptData) {
    let markdown = `## 📈 Key Metrics\n\n`;

    const allItems = Object.values(consolidatedData);
    const allResults = allItems.flatMap(item => item.results);
    
    // Collect all unique server×model load times (each combo loads model once)
    const loadTimes = allItems.map(item => item.results[0]?.modelLoadTime || 0).filter(t => t > 0);

    if (allResults.length === 0) {
        return markdown + '_No data available_\n';
    }

    const fastestLoad = loadTimes.length > 0 ? Math.min(...loadTimes) : 0;
    const slowestLoad = loadTimes.length > 0 ? Math.max(...loadTimes) : 0;
    const avgLoad = loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;

    const fastestTTFT = Math.min(...allResults.map(r => r.ttft || Infinity));
    const slowestTTFT = Math.max(...allResults.map(r => r.ttft || 0));
    const avgTTFT = allResults.reduce((s, r) => s + (r.ttft || 0), 0) / allResults.length;

    const fastestTotal = Math.min(...allResults.map(r => r.totalTime || Infinity));
    const slowestTotal = Math.max(...allResults.map(r => r.totalTime || 0));
    const avgTotal = allResults.reduce((s, r) => s + (r.totalTime || 0), 0) / allResults.length;

    const totalChars = allResults.reduce((s, r) => s + (r.responseLength || 0), 0);
    const avgChars = totalChars / allResults.length;

    const totalTokens = allResults.reduce((s, r) => s + (r.tokenCount || 0), 0);
    const avgTokens = totalTokens / allResults.length;

    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| **Total Test Results** | ${allResults.length} |\n`;
    markdown += `| **Model × Server Combos** | ${allItems.length} |\n`;
    markdown += `| **Unique Model Loads** | ${loadTimes.length} |\n`;
    markdown += `| **Prompts Tested** | ${Object.keys(promptData).length} |\n`;
    markdown += `| **Fastest Model Load** | ${formatSeconds(fastestLoad)} |\n`;
    markdown += `| **Slowest Model Load** | ${formatSeconds(slowestLoad)} |\n`;
    markdown += `| **Average Model Load** | ${formatSeconds(avgLoad)} |\n`;
    markdown += `| **Fastest TTFT** | ${formatSeconds(fastestTTFT)} |\n`;
    markdown += `| **Slowest TTFT** | ${formatSeconds(slowestTTFT)} |\n`;
    markdown += `| **Average TTFT** | ${formatSeconds(avgTTFT)} |\n`;
    markdown += `| **Fastest Total Time** | ${formatSeconds(fastestTotal)} |\n`;
    markdown += `| **Slowest Total Time** | ${formatSeconds(slowestTotal)} |\n`;
    markdown += `| **Average Total Time** | ${formatSeconds(avgTotal)} |\n`;
    markdown += `| **Total Chars Generated** | ${formatNumber(totalChars)} |\n`;
    markdown += `| **Average Chars/Test** | ${formatNumber(avgChars)} |\n`;
    markdown += `| **Total Tokens Generated** | ${formatNumber(totalTokens)} |\n`;
    markdown += `| **Average Tokens/Test** | ${formatNumber(avgTokens)} |\n`;
    markdown += '\n';

    return markdown;
}

function generateRankings(consolidatedData) {
    let markdown = `## 🏅 Performance Rankings\n\n`;

    const items = Object.values(consolidatedData)
        .map(item => {
            // All results for a server×model combo share the same measured modelLoadTime
            const loadTime = item.results[0]?.modelLoadTime || 0;
            const avgTtft = item.results.reduce((s, r) => s + (r.ttft || 0), 0) / item.results.length;
            const avgTotal = item.results.reduce((s, r) => s + (r.totalTime || 0), 0) / item.results.length;
            const avgChars = item.results.reduce((s, r) => s + (r.responseLength || 0), 0) / item.results.length;
            const avgTokens = item.results.reduce((s, r) => s + (r.tokenCount || 0), 0) / item.results.length;

            return {
                modelName: item.modelName,
                serverVersion: item.serverVersion,
                loadTime,
                avgTtft,
                avgTotal,
                avgChars,
                avgTokens,
            };
        });

    // Fastest Model Load (first spawn)
    markdown += `### 🚀 Fastest Model Load Time (Server Spawn)\n\n`;
    items
        .filter(item => item.loadTime > 0)
        .sort((a, b) => a.loadTime - b.loadTime)
        .slice(0, 5)
        .forEach((item, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`;
            markdown += `${medal} **${item.modelName}** (${item.serverVersion}): ${formatSeconds(item.loadTime)}\n`;
        });
    markdown += '\n';

    // Fastest TTFT
    markdown += `### ⚡ Fastest Time to First Token\n\n`;
    items
        .sort((a, b) => a.avgTtft - b.avgTtft)
        .slice(0, 5)
        .forEach((item, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`;
            markdown += `${medal} **${item.modelName}** (${item.serverVersion}): ${formatSeconds(item.avgTtft)}\n`;
        });
    markdown += '\n';

    // Fastest Total
    markdown += `### ⚙️ Fastest Total Response Time\n\n`;
    items
        .sort((a, b) => a.avgTotal - b.avgTotal)
        .slice(0, 5)
        .forEach((item, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`;
            markdown += `${medal} **${item.modelName}** (${item.serverVersion}): ${formatSeconds(item.avgTotal)}\n`;
        });
    markdown += '\n';

    // Most verbose
    markdown += `### 📝 Most Output (Verbosity)\n\n`;
    items
        .sort((a, b) => b.avgTokens - a.avgTokens)
        .slice(0, 5)
        .forEach((item, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`;
            markdown += `${medal} **${item.modelName}** (${item.serverVersion}): ${formatNumber(item.avgTokens)} tokens\n`;
        });
    markdown += '\n';

    return markdown;
}

function generateTestingOverview(promptData, launchConfig, promptConfig) {
    let markdown = `## 🧪 Testing Configuration Overview\n\n`;

    // Prompts tested
    markdown += `### 📝 Prompts Tested (${promptConfig.prompts.length})\n\n`;
    promptConfig.prompts.forEach(p => {
        const thinkingLabel = p.enable_thinking ? ' 🧠' : '';
        markdown += `- **${p.name}** ${thinkingLabel}\n`;
        markdown += `  - Category: ${p.category} | Length: ${p.length}\n`;
        markdown += `  - **Prompt:** ${p.prompt}\n`;
    });
    markdown += '\n';

    // Server versions/drivers
    markdown += `### 🖥️ Llama-Server Versions\n\n`;
    Object.entries(launchConfig.llamaServerVersions.available).forEach(([key, config]) => {
        markdown += `- **${key}**\n`;
        markdown += `  - ${config.label}\n`;
    });
    markdown += '\n';

    // Models with parameter info
    markdown += `### 🤖 Models Tested (${launchConfig.models.length})\n\n`;
    launchConfig.models.forEach(model => {
        markdown += `- **${model.name}**\n`;
        markdown += `  - ${model.description}\n`;
    });
    markdown += '\n';

    return markdown;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                   BENCHMARK REPORT CONSOLIDATOR                               ║');
    console.log('║                  Multi-Prompt Analysis & Aggregation                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

    console.log(`📁 Searching folder: ${folderPath}\n`);

    const reportFiles = findBenchmarkReports(folderPath);

    if (reportFiles.length === 0) {
        console.error('❌ No benchmark report files found!');
        console.error(`   Expected: benchmark-report-*.json files\n`);
        process.exit(1);
    }

    console.log(`✅ Found ${reportFiles.length} report file(s)\n`);

    const { promptData, consolidatedData } = processReports(reportFiles);

    if (Object.keys(consolidatedData).length === 0) {
        console.error('❌ No successful results in reports!');
        process.exit(1);
    }

    console.log(`\n📝 Generating consolidated report...\n`);

    // Load configuration files
    let launchConfig = {};
    let promptConfig = {};
    try {
        launchConfig = loadLaunchConfig();
        promptConfig = loadPromptConfig();
    } catch (err) {
        console.warn(`⚠️  Warning: Could not load config files (${err.message}). Overview section will be skipped.\n`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportFilename = `consolidated-report-${timestamp}.md`;
    const reportPath = path.join(getReportsDir(), reportFilename);

    let markdown = `# 📊 Comprehensive Benchmark Consolidation Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Analysis Date:** ${new Date().toDateString()}\n\n`;

    markdown += `## 📑 Report Summary\n`;
    markdown += `- **Reports Analyzed:** ${reportFiles.length}\n`;
    markdown += `- **Unique Prompts:** ${Object.keys(promptData).length}\n`;
    markdown += `- **Model × Server Combos:** ${Object.keys(consolidatedData).length}\n`;
    markdown += `- **Total Test Results:** ${Object.values(consolidatedData).reduce((s, item) => s + item.results.length, 0)}\n\n`;

    markdown += `---\n\n`;

    // Add testing overview if configs are available
    if (launchConfig.models && promptConfig.prompts) {
        markdown += generateTestingOverview(promptData, launchConfig, promptConfig);
        markdown += `---\n\n`;
    }
    markdown += generateSummaryStats(consolidatedData, promptData);
    markdown += `---\n\n`;
    markdown += generateRankings(consolidatedData);
    markdown += `---\n\n`;
    markdown += generatePerPromptTables(promptData);
    markdown += `---\n\n`;
    markdown += generateConsolidatedReport(consolidatedData);
    markdown += `---\n\n`;
    markdown += generatePerModelComparison(consolidatedData);
    markdown += `---\n\n`;

    markdown += `## 📌 Report Files Analyzed\n\n`;
    reportFiles.forEach(f => {
        markdown += `- ${path.basename(f)}\n`;
    });
    markdown += '\n';

    markdown += `_Report generated on ${new Date().toLocaleString()}_\n`;

    fs.writeFileSync(reportPath, markdown);

    console.log(`✅ Consolidated report saved!\n`);
    console.log(`📄 File: ${reportFilename}\n`);
    console.log(`📖 Report contains:\n`);
    console.log(`   • Testing Configuration Overview\n`);
    console.log(`   • Key Metrics Summary\n`);
    console.log(`   • Performance Rankings (TTFT, Total Time, Verbosity)\n`);
    console.log(`   • Per-Prompt Analysis (${Object.keys(promptData).length} prompts)\n`);
    console.log(`   • Consolidated Metrics\n`);
    console.log(`   • Model Comparison Across Servers\n\n`);

    console.log(`💡 Open ${reportFilename} to view the complete analysis.\n`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
