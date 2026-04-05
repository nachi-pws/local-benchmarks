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

// Load prompt configuration
let prompts = [];
try {
    const configPath = path.join(__dirname, 'promptConfig.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    prompts = config.prompts || [];
} catch (e) {
    console.error('❌ Failed to load promptConfig.json:', e.message);
    process.exit(1);
}

// Display available models from /props endpoint
function getLoadedModels() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:8000/props', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // Extract model info from props response
                    const modelName = json.model_alias || json.model_path || 'GGUF Model (Loaded)';
                    const model = {
                        name: modelName,
                        path: json.model_path,
                        status: 'loaded'
                    };
                    resolve([model]);
                } catch (e) {
                    // Fallback: server is running but we can't parse model info
                    resolve([{ name: 'GGUF Model (Loaded)', status: 'unknown' }]);
                }
            });
        }).on('error', (err) => {
            // Server not responding - fail gracefully
            reject(err);
        });
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
        const modelName = primaryModel.name || 'GGUF Model';

        // Validate model is loaded
        if (!validateModel(models)) {
            console.error('❌ No valid models found');
            process.exit(1);
        }

        // Get prompt selection
        const selectedPrompt = await getPromptSelection();

        // Build request body (no model field - uses server's loaded model)
        const requestBody = JSON.stringify({
            prompt: selectedPrompt.prompt,
            stream: isStream,
            n_predict: 256,
            temperature: 0.7,
            top_k: 20,
            top_p: 0.95
        });

        // Display test info
        console.clear();
        console.log('🚀 GGUF Models Performance Test');
        console.log('═'.repeat(60));
        console.log(`🤖 Model        : ${modelName}`);
        console.log(`📝 Prompt ID    : ${selectedPrompt.id} - ${selectedPrompt.name}`);
        console.log(`📄 Prompt Text  : "${selectedPrompt.prompt.substring(0, 60)}${selectedPrompt.prompt.length > 60 ? '...' : ''}"`);
        console.log(`📊 Mode         : ${isStream ? 'STREAM' : 'NON-STREAM'}`);
        console.log(`💾 System       : ${os.cpus().length} cores | ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB RAM`);
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

    const req = http.request('http://localhost:8000/completion', {
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
                    if (line.trim()) {
                        tokenCount++;
                        if (ttftMs === null) {
                            ttftMs = Date.now() - globalStart;
                            console.log(`⏱️  TTFT: ${(ttftMs / 1000).toFixed(3)}s`);
                            if (ttftMs < 1000) {
                                console.log('✅ OPTIMIZED! Fast response detected\n');
                            }
                        }
                        try {
                            const json = JSON.parse(line);
                            const text = json.response || json.content;
                            if (text) {
                                process.stdout.write(text);
                                fullResponse += text;
                            }
                        } catch (e) {}
                    }
                });
            });

            res.on('end', () => {
                const totalMs = Date.now() - globalStart;
                console.log('\n\n' + '='.repeat(60));
                console.log(`⏱️  Time to First Token : ${(ttftMs / 1000).toFixed(3)}s`);
                console.log(`📊 Total Duration      : ${(totalMs / 1000).toFixed(3)}s`);
                console.log(`🔢 Total Output Length : ${fullResponse.length} characters`);
                console.log(`📈 Tokens Generated    : ${tokenCount}`);
                console.log('='.repeat(60));
            });
        } else {
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
            });

            res.on('end', () => {
                const lines = buffer.trim().split('\n');
                const lastLine = JSON.parse(lines[lines.length - 1]);

                const totalMs = Date.now() - globalStart;

                console.log('=== NON-STREAM RESPONSE ===\n');
                console.log(`Server Metrics:`);
                
                if (lastLine.timings) {
                    const loadMs = lastLine.timings.prompt_ms || 0;
                    const evalMs = lastLine.timings.predicted_ms || 0;
                    const predictedTokens = lastLine.tokens_predicted || 0;
                    
                    if (predictedTokens > 0 && evalMs > 0) {
                        const evalSpeed = (predictedTokens / (evalMs / 1000));
                        console.log(`  Prompt Process  : ${loadMs.toFixed(0)}ms`);
                        console.log(`  Prediction Time : ${evalMs.toFixed(0)}ms`);
                        console.log(`  Token Speed     : ${evalSpeed.toFixed(1)} tokens/sec`);
                        console.log(`  Tokens Gen      : ${predictedTokens}`);
                        
                        if (evalSpeed > 40) {
                            console.log(`\n✅ GPU is active! (${evalSpeed.toFixed(0)} tokens/sec)`);
                        }
                    }
                }
                
                console.log(`\nClient Metrics:`);
                console.log(`  Total Request : ${(totalMs / 1000).toFixed(3)}s`);
                
                const responseText = lastLine.response || lastLine.content;
                if (responseText) {
                    console.log(`\n📄 Full Response (${responseText.length} chars):`);
                    console.log('─'.repeat(60));
                    console.log(responseText);
                    console.log('─'.repeat(60));
                }
                    
                console.log('\n' + '='.repeat(60));
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
