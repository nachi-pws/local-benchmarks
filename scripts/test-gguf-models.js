#!/usr/bin/env node

import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const isStream = args.includes('-s') || args.includes('--stream');
const promptId = args[0] ? parseInt(args[0]) : null;
const presetName = args.includes('--conservative') ? 'conservative' 
                 : args.includes('--creative') ? 'creative' 
                 : args.includes('--balanced') ? 'balanced'
                 : null;

// Load configurations
let prompts = [];
let config = {};
let launchConfig = {};
try {
    const configPath = path.join(__dirname, 'promptConfig.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    prompts = config.prompts || [];
    
    const launchPath = path.join(__dirname, 'launchConfig.json');
    const launchData = fs.readFileSync(launchPath, 'utf8');
    launchConfig = JSON.parse(launchData);
} catch (e) {
    console.error('❌ Failed to load configuration:', e.message);
    process.exit(1);
}

// Display available models from /props endpoint and match with launchConfig
function getLoadedModels() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:8000/props', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const modelAlias = json.model_alias || json.model_path || 'GGUF Model (Loaded)';
                    
                    // Find matching model in launchConfig to get recommended parameters
                    let modelParams = null;
                    let modelName = null;
                    
                    if (launchConfig.models) {
                        const foundModel = launchConfig.models.find(m => 
                            modelAlias.includes(m.filename.replace('.gguf', '')) ||
                            modelAlias.includes(m.id?.toString())
                        );
                        if (foundModel) {
                            modelParams = foundModel.parameters;
                            modelName = foundModel.name;
                        }
                    }
                    
                    const model = {
                        alias: modelAlias,
                        name: modelName || modelAlias,
                        path: json.model_path,
                        params: modelParams,
                        status: 'loaded'
                    };
                    resolve([model]);
                } catch (e) {
                    resolve([{ alias: 'GGUF Model (Loaded)', name: 'Unknown', status: 'unknown' }]);
                }
            });
        }).on('error', reject);
    });
}

// Display prompts with numbering
function displayPrompts() {
    console.log('\n📋 Available Prompts:');
    console.log('─'.repeat(60));
    prompts.forEach(p => {
        console.log(`  [${p.id}] ${p.name} (${p.category} - ${p.length})`);
        console.log(`      "${p.prompt.substring(0, 50)}${p.prompt.length > 50 ? '...' : ''}"`);
    });
    console.log('─'.repeat(60));
}

// Get prompt selection from user or args
function getPromptSelection() {
    return new Promise((resolve, reject) => {
        if (promptId && prompts.some(p => p.id === promptId)) {
            resolve(prompts.find(p => p.id === promptId));
            return;
        }

        displayPrompts();
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        rl.question('\n🔢 Select prompt ID (1-5): ', (answer) => {
            rl.close();
            const id = parseInt(answer);
            const selected = prompts.find(p => p.id === id);
            
            if (selected) {
                resolve(selected);
            } else {
                console.error('❌ Invalid prompt ID');
                reject(new Error('Invalid prompt selection'));
            }
        });
    });
}

// Validate model is loaded
function validateModel(models) {
    return models && models.length > 0;
}

// Main execution
async function main() {
    try {
        // Fetch available models
        const models = await getLoadedModels();
        
        if (models.length === 0) {
            console.error('❌ No loaded models found. Start llama-server first.');
            process.exit(1);
        }

        const primaryModel = models[0];
        const modelName = primaryModel.name || primaryModel.alias;

        // Validate model is loaded
        if (!validateModel(models)) {
            console.error('❌ No valid models found');
            process.exit(1);
        }

        // Get prompt selection
        const selectedPrompt = await getPromptSelection();

        // Load generation parameters: launchConfig > preset > defaults
        let params = { ...config.defaultParameters };
        
        // Use model-specific parameters from launchConfig as base
        if (primaryModel.params) {
            params = {
                ...params,
                temperature: primaryModel.params.temperature,
                top_k: primaryModel.params.top_k,
                top_p: primaryModel.params.top_p,
                repeat_penalty: primaryModel.params.repeat_penalty || 1.0
            };
            params.preset_source = 'launchConfig';
        }
        
        // Override with test preset if specified
        let presetUsed = params.preset_source || 'launchConfig-default';
        if (presetName && config.presets && config.presets[presetName]) {
            params = { ...params, ...config.presets[presetName] };
            presetUsed = presetName + ' (override)';
        }

        // Build request body using chat completions API
        const requestBody = JSON.stringify({
            model: modelName,
            messages: [
                { role: "user", content: selectedPrompt.prompt }
            ],
            stream: isStream,
            max_tokens: params.n_predict || 512,
            temperature: params.temperature !== undefined ? params.temperature : 0.3,
            top_k: params.top_k || 40,
            top_p: params.top_p || 0.9
        });

        // Display test info
        console.clear();
        console.log('🚀 GGUF Models Performance Test');
        console.log('═'.repeat(70));
        console.log(`🤖 Model        : ${modelName}`);
        console.log(`📝 Prompt ID    : ${selectedPrompt.id} - ${selectedPrompt.name}`);
        console.log(`📄 Prompt       : "${selectedPrompt.prompt.substring(0, 50)}${selectedPrompt.prompt.length > 50 ? '...' : ''}"`);
        console.log(`📊 Mode         : ${isStream ? 'STREAM' : 'NON-STREAM'}`);
        console.log(`🎯 Parameters   : ${presetUsed}`);
        console.log(`   🌡️  Temperature : ${params.temperature?.toFixed(2)}`);
        console.log(`   🔄 Repeat Penalty : ${params.repeat_penalty?.toFixed(2)}`);
        console.log(`   📊 Top-K     : ${params.top_k} | Top-P: ${params.top_p?.toFixed(2)}`);
        console.log(`💾 System       : ${os.cpus().length} cores | ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB RAM`);
        console.log('═'.repeat(70));
        console.log('═'.repeat(60));
        console.log('');

        // Execute test
        runTest(requestBody);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

function runTest(body) {
    const globalStart = Date.now();
    let ttftMs = null;
    let fullResponse = '';
    let tokenCount = 0;

    const req = http.request('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Connection': 'keep-alive'
        }
    }, (res) => {
        if (isStream) {
            console.log('=== LIVE STREAMING ===\n');

            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                lines.forEach(line => {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        
                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta;
                            const content = delta?.content;
                            
                            if (content) {
                                tokenCount++;
                                if (ttftMs === null) {
                                    ttftMs = Date.now() - globalStart;
                                    console.log(`⏱️  TTFT: ${(ttftMs / 1000).toFixed(3)}s`);
                                    if (ttftMs < 1000) {
                                        console.log('✅ OPTIMIZED! Fast response detected\n');
                                    }
                                }
                                process.stdout.write(content);
                                fullResponse += content;
                            }
                        } catch (e) {}
                    }
                });
            });

            res.on('end', () => {
                const totalMs = Date.now() - globalStart;
                console.log('\n\n' + '='.repeat(70));
                console.log(`⏱️  Time to First Token : ${(ttftMs / 1000).toFixed(3)}s`);
                console.log(`📊 Total Duration      : ${(totalMs / 1000).toFixed(3)}s`);
                console.log(`🔢 Total Output Length : ${fullResponse.length} characters`);
                console.log(`📈 Tokens Generated    : ${tokenCount}`);
                console.log('='.repeat(70));
            });
        } else {
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
            });

            res.on('end', () => {
                const totalMs = Date.now() - globalStart;

                try {
                    const response = JSON.parse(buffer);
                    const message = response.choices?.[0]?.message;
                    const responseText = message?.content || '';
                    const usage = response.usage || {};

                    console.log('=== NON-STREAM RESPONSE ===\n');
                    console.log(`Server Metrics:`);
                    
                    if (usage.completion_tokens && usage.prompt_tokens) {
                        console.log(`  Prompt Tokens   : ${usage.prompt_tokens}`);
                        console.log(`  Completion Tokens : ${usage.completion_tokens}`);
                        if (totalMs > 0) {
                            const tokensPerSec = (usage.completion_tokens / (totalMs / 1000));
                            console.log(`  Token Speed     : ${tokensPerSec.toFixed(1)} tokens/sec`);
                            
                            if (tokensPerSec > 40) {
                                console.log(`\n✅ GPU is active! (${tokensPerSec.toFixed(0)} tokens/sec)`);
                            }
                        }
                    }
                    
                    console.log(`\nClient Metrics:`);
                    console.log(`  Total Request : ${(totalMs / 1000).toFixed(3)}s`);
                    
                    if (responseText) {
                        console.log(`\n📄 Full Response (${responseText.length} chars):`);
                        console.log('─'.repeat(70));
                        console.log(responseText);
                        console.log('─'.repeat(70));
                    }
                        
                    console.log('\n' + '='.repeat(70));
                } catch (e) {
                    console.error('❌ Failed to parse response:', e.message);
                    console.log('Raw response:', buffer);
                }
            });
        }
    });

    req.on('error', (e) => {
        console.error(`❌ Error: ${e.message}`);
        process.exit(1);
    });

    req.write(body);
    req.end();
}

// Start the test
main();
