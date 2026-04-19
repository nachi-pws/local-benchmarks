#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseJsonc } from 'jsonc-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// LOGGING SETUP
// ============================================================================

// Create log file with datetime format
function getLogFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `run-all-benchmarks-${year}-${month}-${day}T${hours}-${minutes}-${seconds}.log`;
}

const logFilePath = path.join(__dirname, getLogFilename());
let logFileStream = null;

// Initialize log file stream
try {
    logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
} catch (err) {
    console.error(`❌ Error creating log file: ${err.message}`);
}

// Logging function that writes to both console and file
function logToFile(message = '') {
    if (logFileStream) {
        logFileStream.write(message + '\n');
    }
}

// Override console methods to log to both stdout and file
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    originalLog(...args);
    logToFile(message);
};

console.error = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    originalError(...args);
    logToFile(message);
};

console.warn = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    originalLog(...args);
    logToFile(message);
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const scriptDir = __dirname;
const promptConfigPath = path.join(scriptDir, 'promptConfig.json');

// Parse command line arguments
const args = process.argv.slice(2);
const startPromptArg = args.find(arg => arg.startsWith('--start-prompt='));
const startCombinationArg = args.find(arg => arg.startsWith('--start-combination='));

const START_PROMPT = startPromptArg 
    ? parseInt(startPromptArg.split('=')[1]) 
    : 1;

const START_COMBINATION = startCombinationArg 
    ? parseInt(startCombinationArg.split('=')[1]) 
    : 1;

// Load prompt config
function loadJsonc(filepath) {
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        return parseJsonc(data);
    } catch (err) {
        console.error(`❌ Error parsing ${path.basename(filepath)}:`, err.message);
        throw err;
    }
}

let promptConfig = {};

try {
    promptConfig = loadJsonc(promptConfigPath);
} catch (e) {
    console.error('❌ Failed to load configuration:', e.message);
    process.exit(1);
}

const promptCount = promptConfig.prompts?.length || 0;

if (promptCount === 0) {
    console.error('❌ No prompts found in promptConfig.json');
    process.exit(1);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function runCommand(command, cmdArgs, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, cmdArgs, {
            stdio: 'inherit',
            shell: true,
            cwd: scriptDir,
            ...options
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    RUNNING ALL BENCHMARK PROMPTS                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Configuration:');
    console.log(`   - Total prompts: ${promptCount}`);
    console.log(`   - Starting prompt: ${START_PROMPT}`);
    if (START_COMBINATION > 1) {
        console.log(`   - Resume from combination: ${START_COMBINATION}`);
    }
    console.log('');

    const benchmarkStartTime = Date.now();

    // Run benchmarks for each prompt
    for (let promptId = START_PROMPT; promptId <= promptCount; promptId++) {
        const prompt = promptConfig.prompts[promptId - 1];
        const promptName = prompt.name;
        const promptStartTime = Date.now();

        console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
        console.log(`║ Prompt ${promptId}/${promptCount}: ${promptName}`);
        console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

        // Build command arguments
        const cmdArgs = ['compare-all-models-next.js', `--prompt=${promptId}`, '--no-wait'];

        // Add start combination for first prompt
        if (promptId === START_PROMPT && START_COMBINATION > 1) {
            cmdArgs.push(`--start=${START_COMBINATION}`);
        }

        console.log(`▶️  Running: node ${cmdArgs.join(' ')}\n`);

        try {
            await runCommand('node', cmdArgs);
        } catch (err) {
            console.error(`\n❌ Prompt ${promptId} failed:`, err.message);
            process.exit(1);
        }

        const promptDuration = Date.now() - promptStartTime;
        console.log(`\n✅ Prompt ${promptId} completed in ${formatTime(promptDuration)}\n`);
    }

    // Calculate total benchmark time
    const totalDuration = Date.now() - benchmarkStartTime;

    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║ ALL PROMPTS COMPLETED');
    console.log(`║ Total time: ${formatTime(totalDuration)}`);
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

    // Generate consolidated report
    console.log('▶️  Generating consolidated report...\n');

    try {
        await runCommand('node', ['report-generator.js']);
    } catch (err) {
        console.error('\n❌ Report generation failed:', err.message);
        process.exit(1);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║ ✅ BENCHMARK SUITE COMPLETE');
    console.log('║ All prompts tested and report generated successfully!');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(`📝 Log file saved: ${logFilePath}\n`);
    
    // Close log file stream
    if (logFileStream) {
        logFileStream.end();
    }
}

main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    
    // Close log file stream on error
    if (logFileStream) {
        logFileStream.end();
    }
    
    process.exit(1);
});
