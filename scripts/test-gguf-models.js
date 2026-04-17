#!/usr/bin/env node

import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global state for graceful shutdown
let activeRequest = null;
let isShuttingDown = false;

// Handle graceful shutdown
function setupGracefulShutdown() {
    const handleShutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n\n⚠️  ${signal} received - shutting down gracefully...`);
        
        // Abort active request if one exists
        if (activeRequest) {
            try {
                activeRequest.destroy();
                console.log('✋ Request cancelled');
            } catch (e) {
                // Silently fail if request already closed
            }
        }

        // Close any open readline interfaces
        if (global.openReadlines) {
            global.openReadlines.forEach(rl => {
                try {
                    rl.close();
                } catch (e) {}
            });
            global.openReadlines = [];
        }

        console.log('👋 Goodbye!\n');
        process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGINT', () => handleShutdown('SIGINT (Ctrl+C)'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGHUP', () => handleShutdown('SIGHUP'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('\n❌ Uncaught Exception:', err.message);
        activeRequest?.destroy();
        process.exit(1);
    });

    // Handle unhandled Promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('\n❌ Unhandled Rejection:', reason);
        activeRequest?.destroy();
        process.exit(1);
    });
}

// Initialize global readline tracker
global.openReadlines = [];

// Parse command line arguments
const args = process.argv.slice(2);
const isStream = args.includes('-s') || args.includes('--stream');
const isDebug = args.includes('--debug') || args.includes('-d');
const showReasoning = args.includes('--reasoning') || args.includes('-r');
const promptId = args[0] ? parseInt(args[0]) : null;
const presetName = args.includes('--conservative') ? 'conservative' 
                 : args.includes('--creative') ? 'creative' 
                 : args.includes('--balanced') ? 'balanced'
                 : null;

// Debug logging utility
function debug(...args) {
    if (isDebug) {
        console.log(`\n🔍 [DEBUG]`, ...args);
    }
}

// Load configurations
let prompts = [];
let config = {};
let launchConfig = {};
try {
    const configPath = path.join(__dirname, 'promptConfig.json');
    debug(`Loading config from: ${configPath}`);
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    prompts = config.prompts || [];
    debug(`Loaded ${prompts.length} prompts`);
    debug(`Default parameters:`, config.defaultParameters);
    
    const launchPath = path.join(__dirname, 'launchConfig.json');
    debug(`Loading launch config from: ${launchPath}`);
    const launchData = fs.readFileSync(launchPath, 'utf8');
    launchConfig = JSON.parse(launchData);
} catch (e) {
    console.error('❌ Failed to load configuration:', e.message);
    process.exit(1);
}

// Display available models from /props endpoint and match with launchConfig
function getLoadedModels() {
    return new Promise((resolve, reject) => {
        debug(`Fetching models from http://localhost:8000/props`);
        http.get('http://localhost:8000/props', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    debug(`Received model data:`, json);
                    const modelAlias = json.model_alias || json.model_path || 'GGUF Model (Loaded)';
                    
                    debug(`Model alias/path for matching: "${modelAlias}"`);
                    
                    // Find matching model in launchConfig to get recommended parameters
                    let modelParams = null;
                    let modelName = null;
                    
                    if (launchConfig.models) {
                        debug(`Available models in launchConfig:`, launchConfig.models.map(m => ({
                            id: m.id,
                            name: m.name,
                            filename: m.filename
                        })));
                        
                        // First try exact filename match
                        let foundModel = launchConfig.models.find(m => 
                            m.filename === modelAlias
                        );
                        
                        if (foundModel) {
                            debug(`✅ Exact filename match found for: "${foundModel.name}"`);
                        } else {
                            // Try case-insensitive filename match
                            foundModel = launchConfig.models.find(m => 
                                m.filename.toLowerCase() === modelAlias.toLowerCase()
                            );
                            if (foundModel) {
                                debug(`✅ Case-insensitive filename match found for: "${foundModel.name}"`);
                            }
                        } 
                        
                        if (foundModel) {
                            modelParams = foundModel.parameters;
                            modelName = foundModel.name;
                            debug(`✅ Found matching model in launchConfig:`, foundModel.name);
                            debug(`Model parameters:`, modelParams);
                        } else {
                            debug(`❌ No matching model found in launchConfig for: "${modelAlias}"`);
                            debug(`Loaded model filename doesn't match any in launchConfig`);
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
                    debug(`Error parsing model data:`, e.message);
                    resolve([{ alias: 'GGUF Model (Loaded)', name: 'Unknown', status: 'unknown' }]);
                }
            });
        }).on('error', (err) => {
            debug(`Error fetching models:`, err.message);
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

        // Track readline interface for cleanup
        global.openReadlines.push(rl);

        // Handle readline closure
        rl.on('close', () => {
            const idx = global.openReadlines.indexOf(rl);
            if (idx > -1) global.openReadlines.splice(idx, 1);
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

// Ask if user wants to include parameters in request
function askIncludeParams() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        // Track readline interface for cleanup
        global.openReadlines.push(rl);

        // Handle readline closure
        rl.on('close', () => {
            const idx = global.openReadlines.indexOf(rl);
            if (idx > -1) global.openReadlines.splice(idx, 1);
        });

        rl.question('\n📋 Include parameters in request body? (yes/no) [default: no]: ', (answer) => {
            rl.close();
            const response = answer.trim().toLowerCase();
            resolve(response === 'yes' || response === 'y');
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
        // Show debug status
        if (isDebug) {
            console.log('\n🔍 DEBUG MODE ENABLED - Verbose logging active');
            if (showReasoning) {
                console.log('🧠 REASONING MODE - Thinking content will be displayed\n');
            } else {
                console.log('(Use --reasoning flag to show model thinking)\n');
            }
        }

        // Setup graceful shutdown handlers first
        setupGracefulShutdown();

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
        debug(`Selected prompt:`, selectedPrompt);

        // Ask if user wants to include parameters
        const includeParams = await askIncludeParams();
        debug(`Include parameters in request:`, includeParams);

        // Load generation parameters: launchConfig > preset > defaults
        let params = { ...config.defaultParameters };
        debug(`Initial params from config:`, params);
        
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
            debug(`Updated params from model config:`, params);
        }
        
        // Override with test preset if specified
        let presetUsed = params.preset_source || 'launchConfig-default';
        if (presetName && config.presets && config.presets[presetName]) {
            params = { ...params, ...config.presets[presetName] };
            presetUsed = presetName + ' (override)';
            debug(`Applied preset override (${presetName}):`, params);
        }

        // Build request body using chat completions API
        const requestBodyObj = {
            model: modelName,
            messages: [
                { role: "user", content: selectedPrompt.prompt }
            ],
            stream: isStream
        };

        // Add parameters only if user opted in
        if (includeParams) {
            requestBodyObj.max_tokens = params.n_predict || 512;
            requestBodyObj.temperature = params.temperature !== undefined ? params.temperature : 0.3;
            requestBodyObj.top_k = params.top_k || 40;
            requestBodyObj.top_p = params.top_p || 0.9;
            if (params.repeat_penalty !== undefined) {
                requestBodyObj.repeat_penalty = params.repeat_penalty;
            }
            if (params.min_p !== undefined) {
                requestBodyObj.min_p = params.min_p;
            }
            if (params.frequency_penalty !== undefined) {
                requestBodyObj.frequency_penalty = params.frequency_penalty;
            }
            debug(`Added parameters to request body`);
        } else {
            debug(`Request body WITHOUT parameters (minimal)`);
        }

        const requestBody = JSON.stringify(requestBodyObj);
        debug(`Final request body:`, requestBodyObj);

        // Display test info
        console.clear();
        console.log('🚀 GGUF Models Performance Test');
        console.log('═'.repeat(70));
        console.log(`🤖 Model        : ${modelName}`);
        console.log(`📝 Prompt ID    : ${selectedPrompt.id} - ${selectedPrompt.name}`);
        console.log(`📄 Prompt       : "${selectedPrompt.prompt.substring(0, 50)}${selectedPrompt.prompt.length > 50 ? '...' : ''}"`);
        console.log(`📊 Mode         : ${isStream ? 'STREAM' : 'NON-STREAM'}`);
        console.log(`🎯 Parameters   : ${includeParams ? presetUsed : 'NOT INCLUDED'}`);
        if (includeParams) {
            console.log(`   🌡️  Temperature : ${params.temperature?.toFixed(2)}`);
            console.log(`   🔄 Repeat Penalty : ${params.repeat_penalty?.toFixed(2)}`);
            console.log(`   📊 Top-K     : ${params.top_k} | Top-P: ${params.top_p?.toFixed(2)}`);
            if (params.min_p !== undefined) {
                console.log(`   📏 Min-P     : ${params.min_p?.toFixed(3)}`);
            }
        }
        console.log(`💾 System       : ${os.cpus().length} cores | ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB RAM`);
        console.log('═'.repeat(70));
        console.log('⌨️  Press Ctrl+C to cancel');
        console.log('═'.repeat(70));
        console.log('\n📤 REQUEST BODY:');
        console.log('─'.repeat(70));
        console.log(JSON.stringify(JSON.parse(requestBody), null, 2));
        console.log('─'.repeat(70));
        console.log('');

        // Execute test
        runTest(requestBody);

    } catch (err) {
        if (err.message !== 'Invalid prompt selection' && !isShuttingDown) {
            debug(`Unhandled error in main:`, err);
            console.error('❌ Error:', err.message);
        }
        process.exit(1);
    }
}

function runTest(body) {
    const globalStart = Date.now();
    let ttftMs = null;
    let fullResponse = '';
    let tokenCount = 0;
    let isCompleted = false;

    debug(`Making HTTP request to http://localhost:8000/v1/chat/completions`);
    debug(`Headers:`, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Connection': 'keep-alive'
    });
    debug(`Request method: POST`);
    debug(`Stream mode: ${isStream}`);
    if (isDebug) {
        debug(`Sending request body (${Buffer.byteLength(body)} bytes)`);
    }

    const req = http.request('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Connection': 'keep-alive'
        },
        timeout: 900000 // 15 minute timeout
    }, (res) => {
        if (isShuttingDown) {
            res.destroy();
            return;
        }

        debug(`Response Status: ${res.statusCode}`);
        debug(`Response Headers:`, res.headers);

        if (isStream) {
            console.log('=== LIVE STREAMING ===\n');

            let buffer = '';
            let chunkCount = 0;
            res.on('data', (chunk) => {
                if (isShuttingDown) {
                    res.destroy();
                    return;
                }

                chunkCount++;
                if (isDebug) {
                    debug(`Received chunk #${chunkCount} (${chunk.length} bytes)`);
                }

                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                lines.forEach(line => {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            debug(`Stream completion signal received`);
                            return;
                        }
                        
                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta;
                            
                            // Check for both content and reasoning_content
                            const content = delta?.content;
                            const reasoningContent = delta?.reasoning_content;
                            
                            if (content) {
                                tokenCount++;
                                if (isDebug) {
                                    debug(`Token #${tokenCount}:`, JSON.stringify(content));
                                }
                                if (ttftMs === null) {
                                    ttftMs = Date.now() - globalStart;
                                    console.log(`⏱️  TTFT: ${(ttftMs / 1000).toFixed(3)}s`);
                                    if (ttftMs < 1000) {
                                        console.log('✅ OPTIMIZED! Fast response detected\n');
                                    }
                                }
                                process.stdout.write(content);
                                fullResponse += content;
                            } else if (reasoningContent) {
                                // Display reasoning content if flag enabled
                                if (showReasoning) {
                                    process.stdout.write(`[THINKING: ${reasoningContent}]`);
                                }
                                if (isDebug) {
                                    debug(`Reasoning:`, JSON.stringify(reasoningContent));
                                }
                            }
                        } catch (e) {
                            debug(`Error parsing stream data:`, e.message);
                            // Silently ignore JSON parse errors
                        }
                    }
                });
            });

            res.on('end', () => {
                if (isCompleted || isShuttingDown) return;
                isCompleted = true;
                debug(`Stream ended`);

                const totalMs = Date.now() - globalStart;
                console.log('\n\n' + '='.repeat(70));
                console.log(`⏱️  Time to First Token : ${(ttftMs / 1000).toFixed(3)}s`);
                console.log(`📊 Total Duration      : ${(totalMs / 1000).toFixed(3)}s`);
                console.log(`🔢 Total Output Length : ${fullResponse.length} characters`);
                console.log(`📈 Tokens Generated    : ${tokenCount}`);
                console.log('='.repeat(70));
                console.log('✅ Test completed successfully\n');
                process.exit(0);
            });

            res.on('error', (err) => {
                if (!isShuttingDown && !isCompleted) {
                    console.error('\n❌ Response error:', err.message);
                }
            });
        } else {
            let buffer = '';
            let chunkCount = 0;
            let firstDataTime = null;
            res.on('data', (chunk) => {
                if (isShuttingDown) {
                    res.destroy();
                    return;
                }
                chunkCount++;
                if (firstDataTime === null) {
                    firstDataTime = Date.now() - globalStart;
                    debug(`First data chunk received after ${(firstDataTime / 1000).toFixed(3)}s`);
                }
                if (isDebug) {
                    debug(`Received chunk #${chunkCount} (${chunk.length} bytes)`);
                }
                buffer += chunk.toString();
            });

            res.on('end', () => {
                if (isCompleted || isShuttingDown) return;
                isCompleted = true;
                debug(`Response complete, total size: ${buffer.length} bytes`);

                const totalMs = Date.now() - globalStart;

                try {
                    const response = JSON.parse(buffer);
                    debug(`Parsed response:`, response);
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
                    console.log('✅ Test completed successfully\n');
                    process.exit(0);
                } catch (e) {
                    if (!isShuttingDown) {
                        debug(`Failed to parse response:`, e);
                        console.error('❌ Failed to parse response:', e.message);
                        console.log('Raw response:', buffer.substring(0, 500));
                    }
                    process.exit(1);
                }
            });

            res.on('error', (err) => {
                if (!isShuttingDown && !isCompleted) {
                    console.error('\n❌ Response error:', err.message);
                }
            });
        }
    });

    // Store reference to active request for cleanup
    activeRequest = req;

    req.on('error', (e) => {
        if (!isShuttingDown && !isCompleted) {
            debug(`Request error:`, e);
            console.error(`\n❌ Request error: ${e.message}`);
            process.exit(1);
        }
    });

    req.on('timeout', () => {
        if (!isShuttingDown && !isCompleted) {
            debug(`Request timeout after 15 minutes`);
            console.error('\n❌ Request timeout (15 minutes exceeded)');
            req.destroy();
            process.exit(1);
        }
    });

    try {
        req.write(body);
        req.end();
    } catch (e) {
        if (!isShuttingDown) {
            debug(`Error sending request:`, e);
            console.error('❌ Failed to send request:', e.message);
            process.exit(1);
        }
    }
}

// Start the test
main();
