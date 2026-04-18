#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { parse as parseJsonc } from 'jsonc-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const VERBOSE_SERVER_OUTPUT = true;  // Set to false to suppress server logs

// Parse command line arguments for starting combination
const args = process.argv.slice(2);
const startFromArg = args.find(arg => arg.startsWith('--start='));
const START_FROM_COMBINATION = startFromArg 
    ? parseInt(startFromArg.split('=')[1]) 
    : 1;

if (START_FROM_COMBINATION < 1) {
    console.error('❌ Error: --start must be >= 1');
    process.exit(1);
}

// ============================================================================
// CONFIGURATION LOADER - JSONC Support
// ============================================================================

function loadJsonc(filepath) {
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        const parsed = parseJsonc(data);
        if (parsed === undefined) {
            throw new Error('Failed to parse JSONC file');
        }
        return parsed;
    } catch (err) {
        console.error(`❌ Error parsing ${path.basename(filepath)}:`, err.message);
        throw err;
    }
}

let launchConfig = {};
let promptConfig = {};

try {
    launchConfig = loadJsonc(path.join(__dirname, 'launchConfig.json'));
    promptConfig = loadJsonc(path.join(__dirname, 'promptConfig.json'));
} catch (e) {
    console.error('❌ Failed to load configuration files:', e.message);
    process.exit(1);
}

// ============================================================================
// PROMPT SELECTION UI
// ============================================================================

function displayPrompts() {
    console.log('\n' + '═'.repeat(80));
    console.log('📝 AVAILABLE PROMPTS');
    console.log('═'.repeat(80) + '\n');
    
    promptConfig.prompts.forEach(p => {
        const preview = p.prompt.length > 60 
            ? p.prompt.substring(0, 60) + '...' 
            : p.prompt;
        console.log(`  [${p.id}] ${p.name}`);
        console.log(`      Category: ${p.category} | Length: ${p.length}`);
        console.log(`      Preview: "${preview}"`);
        console.log('');
    });
}

async function selectPrompt() {
    displayPrompts();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('Select prompt ID (1-' + promptConfig.prompts.length + '): ', (answer) => {
            rl.close();
            const promptId = parseInt(answer);
            const selectedPrompt = promptConfig.prompts.find(p => p.id === promptId);
            
            if (!selectedPrompt) {
                console.error('❌ Invalid prompt ID');
                process.exit(1);
            }
            
            resolve(selectedPrompt);
        });
    });
}

// ============================================================================
// LLAMA-SERVER LIFECYCLE MANAGEMENT
// ============================================================================

class LlamaServerManager {
    constructor() {
        this.process = null;
        this.port = launchConfig.server?.port || 8000;
        this.host = launchConfig.server?.host || '127.0.0.1';
        this.startupDelay = launchConfig.server?.startup_delay_ms || 30000;
        this.healthEndpoint = launchConfig.server?.health_check_endpoint || '/health';
        this.healthTimeout = launchConfig.server?.health_check_timeout_ms || 3000;
        this.modelLoadTimeMs = 0;
    }
    
    async launch(model, serverVersion) {
        const serverInfo = launchConfig.llamaServerVersions.available[serverVersion];
        if (!serverInfo) {
            throw new Error(`Server version ${serverVersion} not found in config`);
        }
        
        const serverPath = serverInfo.path;
        const params = model.parameters;
        
        // Build command line arguments
        const args = [
            '--model', model.path,
            '--port', this.port.toString(),
            '--host', this.host,
            '--ctx-size', params.ctx_size?.toString() || '32768',
            '--n-gpu-layers', params.n_gpu_layers?.toString() || '99',
            '--threads', params.n_threads?.toString() || '8',
        ];
        
        // Optional parameters
        if (params.flash_attn) {
            args.push('--flash-attn', 'on');
        }
        if (params.jinja) {
            args.push('--jinja');
        }
        if (params.no_context_shift) {
            args.push('--no-context-shift');
        }
        if (params.cache_type_k) {
            args.push('--cache-type-k', params.cache_type_k);
        }
        if (params.cache_type_v) {
            args.push('--cache-type-v', params.cache_type_v);
        }
        
        // Check chat_template_file existence
        if (params.chat_template_file && params.chat_template_file !== '') {
            if (fs.existsSync(params.chat_template_file)) {
                args.push('--chat-template', params.chat_template_file);
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`✅ Chat template found: ${params.chat_template_file}`);
                }
            } else {
                console.log(`⚠️  Chat template not found: ${params.chat_template_file}`);
                console.log(`   Model will use built-in template (if available)`);
            }
        }
        
        // Check mmproj existence
        if (params.mmproj && params.mmproj !== '') {
            if (fs.existsSync(params.mmproj)) {
                args.push('--mmproj', params.mmproj);
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`✅ Multimodal projection found: ${params.mmproj}`);
                }
            } else {
                console.log(`⚠️  Multimodal projection file not found: ${params.mmproj}`);
                console.log(`   Vision capabilities may not work correctly`);
            }
        }
        
        console.log(`🚀 Launching llama-server...`);
        console.log(`   Server: ${serverVersion}`);
        console.log(`   Model: ${model.name}`);
        console.log(`   Port: ${this.port}`);
        
        if (VERBOSE_SERVER_OUTPUT) {
            console.log(`\n📋 Command: ${serverPath}`);
            console.log(`   Args: ${args.join(' ')}\n`);
        }
        
        // Estimate loading time based on model size
        const modelSizeNote = model.name.includes('30B') || model.name.includes('31B') || model.name.includes('27B')
            ? '⏰ Large model - initial load may take 30-60 seconds...'
            : model.name.includes('9B') || model.name.includes('500M')
            ? '⏰ Model loading typically takes 10-20 seconds...'
            : '⏰ Model loading may take 30-90 seconds...';
        
        console.log(`   ${modelSizeNote}\n`);
        
        // Spawn the server process
        this.process = spawn(serverPath, args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Log server output for debugging
        this.process.stdout.on('data', (data) => {
            if (VERBOSE_SERVER_OUTPUT) {
                console.log('[SERVER STDOUT]', data.toString().trim());
            }
        });
        
        this.process.stderr.on('data', (data) => {
            const output = data.toString();
            if (VERBOSE_SERVER_OUTPUT) {
                console.log('[SERVER STDERR]', output.trim());
            }
            // Check for ready signal
            if (output.includes('HTTP server listening')) {
                // Server is ready
            }
        });
        
        this.process.on('error', (err) => {
            console.error('❌ Server process error:', err.message);
        });
        
        this.process.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                console.error(`❌ Server exited with code ${code}`);
            }
            if (signal) {
                console.log(`⚠️  Server killed with signal ${signal}`);
            }
        });
        
        // Track spawn time for model load measurement
        const spawnTime = Date.now();
        
        // Wait for server to be ready
        await this.waitForReady(spawnTime);
        
        // Return the actual model load time
        return this.modelLoadTimeMs;
    }
    
    async waitForReady(spawnTime) {
        const maxAttempts = launchConfig.server?.max_wait_attempts || 60;
        const interval = launchConfig.server?.attempt_interval_ms || 2000;
        
        console.log(`⏳ Waiting for server to be ready (max ${maxAttempts * interval / 1000}s)...`);
        if (VERBOSE_SERVER_OUTPUT) {
            console.log(`   Health endpoint: ${this.healthEndpoint}`);
            console.log(`   Checking every ${interval}ms, max ${maxAttempts} attempts\n`);
        }
        
        for (let i = 0; i < maxAttempts; i++) {
            if (VERBOSE_SERVER_OUTPUT && i % 5 === 0) {
                process.stdout.write(`   Attempt ${i + 1}/${maxAttempts}... `);
            }
            
            try {
                const isReady = await this.healthCheck();
                if (isReady) {
                    if (VERBOSE_SERVER_OUTPUT) {
                        console.log('ready! ✓');
                    }
                    // Capture model load time: from spawn to slots available
                    this.modelLoadTimeMs = Date.now() - spawnTime;
                    console.log(`✅ Server is ready (attempt ${i + 1})!`);
                    console.log(`   📊 Model load time (spawn → slots): ${(this.modelLoadTimeMs / 1000).toFixed(3)}s`);
                    // Additional startup delay for model loading
                    if (VERBOSE_SERVER_OUTPUT) {
                        console.log(`   Waiting additional ${this.startupDelay}ms for model loading...`);
                    }
                    await this.sleep(this.startupDelay);
                    return;
                }
                if (VERBOSE_SERVER_OUTPUT && i % 5 === 0) {
                    console.log('not ready');
                }
            } catch (e) {
                // Server not ready yet
                if (VERBOSE_SERVER_OUTPUT && i % 5 === 0) {
                    console.log(`error: ${e.message}`);
                }
            }
            await this.sleep(interval);
        }
        
        throw new Error('Server failed to start within timeout period');
    }
    
    async healthCheck() {
        return new Promise((resolve) => {
            const url = `http://${this.host}:${this.port}${this.healthEndpoint}`;
            
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const success = res.statusCode === 200;
                    if (VERBOSE_SERVER_OUTPUT && success) {
                        console.log(`   Health check response (${res.statusCode}):`, data.substring(0, 200));
                    }
                    resolve(success);
                });
            });
            
            req.on('error', (err) => {
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`   Health check error: ${err.code || err.message}`);
                }
                resolve(false);
            });
            
            req.setTimeout(this.healthTimeout, () => {
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`   Health check timeout after ${this.healthTimeout}ms`);
                }
                req.destroy();
                resolve(false);
            });
        });
    }
    
    async shutdown() {
        if (!this.process) return;
        
        console.log('🛑 Shutting down llama-server...');
        
        return new Promise((resolve) => {
            let exited = false;
            
            this.process.on('exit', () => {
                if (!exited) {
                    exited = true;
                    this.process = null;
                    console.log('✅ Server stopped');
                    resolve();
                }
            });
            
            // Try graceful shutdown first
            this.process.kill('SIGTERM');
            
            // Force kill after 30 seconds if still running (large models need time)
            setTimeout(() => {
                if (this.process && !exited) {
                    console.log('⚠️  Force killing server (timeout after 30s)...');
                    this.process.kill('SIGKILL');
                    this.process = null;
                    exited = true;
                    resolve();
                }
            }, 30000);  // Increased from 5000 to 30000
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// MODEL TESTING ENGINE
// ============================================================================

class ModelTester {
    constructor(port, host) {
        this.port = port;
        this.host = host;
    }
    
    async testModel(model, prompt, useStreaming = true, modelLoadTimeMs = 0) {
        const params = model.parameters;
        
        // Determine streaming mode: prompt config takes precedence, then parameter, then default
        const streamingMode = prompt.streaming !== undefined ? prompt.streaming : useStreaming;
        
        // Build request body with OpenAI-compatible format
        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: prompt.prompt
                }
            ],
            stream: streamingMode,  // Use prompt-configured streaming mode
            max_tokens: params.n_predict || -1,  // Send -1 explicitly like Postman
            temperature: params.temperature || 0.7,
            top_k: params.top_k || 40,
            top_p: params.top_p || 0.9,
            min_p: params.min_p || 0.0,
            repeat_penalty: params.repeat_penalty || 1.0,
            // CRITICAL: Always include enable_thinking, defaulting to false
            chat_template_kwargs: {
                enable_thinking: prompt.enable_thinking !== undefined ? prompt.enable_thinking : false
            }
        };
        
        const body = JSON.stringify(requestBody);
        
        console.log(`\n🧪 Testing: ${model.name}`);
        console.log(`   Prompt: "${prompt.name}" (${prompt.prompt.length} chars)`);
        
        const result = {
            modelId: model.id,
            modelName: model.name,
            filename: model.filename,
            promptId: prompt.id,
            promptName: prompt.name,
            promptLength: prompt.prompt.length,
            ttftMs: null,
            totalMs: null,
            modelLoadTimeMs: modelLoadTimeMs,
            responseLength: 0,
            tokenCount: 0,
            success: false,
            error: null,
            response: ''
        };
        
        const globalStart = Date.now();
        
        try {
            // Determine whether to use streaming or one-shot mode
            const useStreaming = requestBody.stream === true;
            
            await new Promise((resolve, reject) => {
                const req = http.request(`http://${this.host}:${this.port}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body),
                        'Connection': 'keep-alive'
                    },
                    timeout: 300000  // 5 minute timeout
                }, (res) => {
                    // ========== STREAMING MODE HANDLER ==========
                    if (useStreaming) {
                        return this._handleStreamingResponse(res, req, result, params, globalStart, resolve, reject);
                    }
                    
                    // ========== ONE-SHOT MODE HANDLER ==========
                    return this._handleOneShotResponse(res, req, result, globalStart, resolve, reject);
                });
                
                req.on('error', (err) => {
                    result.error = err.message;
                    reject(err);
                });
                
                req.write(body);
                req.end();
            });
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
            result.error = err.message;
        }
        
        return result;
    }
    
    // ========================================================================
    // STREAMING RESPONSE HANDLER
    // ========================================================================
    _handleStreamingResponse(res, req, result, params, globalStart, resolve, reject) {
        let buffer = '';
        let streamEnded = false;
        let streamTimeout = null;
        
        // Reset stream timeout on data activity
        const resetStreamTimeout = () => {
            if (streamTimeout) clearTimeout(streamTimeout);
            streamTimeout = setTimeout(() => {
                if (streamEnded) return;
                streamEnded = true;
                console.log('\n   ⚠️  Stream stalled for 60s, assuming completion');
                result.totalMs = Date.now() - globalStart;
                result.responseLength = result.response.length;
                result.success = result.tokenCount > 0;
                result.error = result.tokenCount === 0 ? 'Stream stalled with no tokens' : null;
                console.log(`   ${result.success ? '✅' : '⚠️'} Completed: ${(result.totalMs / 1000).toFixed(3)}s | ${result.responseLength} chars | ${result.tokenCount} tokens`);
                req.destroy();
                resolve();
            }, 60000);  // 60 second stall timeout
        };
        
        resetStreamTimeout();
        
        res.on('data', (chunk) => {
            if (streamEnded) {
                req.destroy();  // Kill request if already done
                return;
            }
            
            resetStreamTimeout();
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();  // Keep incomplete line in buffer
            
            // Safety: cap incomplete line buffer at 10KB to prevent memory bloat
            if (buffer.length > 10240) {
                buffer = buffer.substring(buffer.length - 10240);
            }
            
            // Process complete lines
            for (let i = 0; i < lines.length; i++) {
                if (streamEnded) break;  // Stop processing if complete
                
                const trimmed = lines[i].trim();
                if (!trimmed) continue;
                
                // Capture TTFT on first chunk with content
                if (result.ttftMs === null) {
                    result.ttftMs = Date.now() - globalStart;
                    process.stdout.write(`   ⏱️  TTFT: ${(result.ttftMs / 1000).toFixed(3)}s | Streaming: `);
                }
                
                try {
                    // Parse SSE format: "data: {...}"
                    let jsonStr = trimmed;
                    if (trimmed.startsWith('data: ')) {
                        jsonStr = trimmed.substring(6);
                    }
                    
                    // Check for completion sentinel
                    if (!jsonStr || jsonStr === '[DONE]') {
                        if (jsonStr === '[DONE]') {
                            if (VERBOSE_SERVER_OUTPUT) {
                                console.log(`\n   [DEBUG] ✅ Received [DONE] sentinel`);
                            }
                            this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
                        }
                        continue;
                    }
                    
                    const json = JSON.parse(jsonStr);
                    const choice = json.choices?.[0];
                    const delta = choice?.delta;
                    const finishReason = choice?.finish_reason;
                    const text = delta?.content || '';
                    
                    // Process tokens
                    if (text && text.length > 0) {
                        result.response += text;
                        result.tokenCount++;
                        process.stdout.write(text);
                        if (result.tokenCount % 50 === 0) {
                            process.stdout.write(`[${result.tokenCount}]`);
                        }
                    }
                    
                    // Hard limit: cap response at 65536 characters to prevent endless loops
                    if (result.response.length >= 65536) {
                        if (VERBOSE_SERVER_OUTPUT) {
                            console.log(`\n   [DEBUG] Response reached max character limit (65536 chars), stopping stream`);
                        }
                        this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
                        break;
                    }
                    
                    // DEBUG: Log finish reason changes
                    if (VERBOSE_SERVER_OUTPUT && finishReason) {
                        console.log(`\n   [DEBUG] finish_reason="${finishReason}" at token ${result.tokenCount}`);
                    }
                    
                    // Check for stop signals (finish_reason is set)
                    const isComplete = finishReason !== null && finishReason !== undefined;
                    if (isComplete) {
                        if (VERBOSE_SERVER_OUTPUT) {
                            console.log(`\n   [DEBUG] Server completed (finish_reason=${finishReason})`);
                        }
                        this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
                        break;
                    }
                    
                    // Check token limits
                    const nPredict = params.n_predict || -1;
                    const ABSOLUTE_MAX_TOKENS = 8192;
                    
                    if (nPredict > 0 && result.tokenCount >= nPredict) {
                        if (VERBOSE_SERVER_OUTPUT) {
                            console.log(`\n   [DEBUG] Reached n_predict limit (${nPredict})`);
                        }
                        this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
                        break;
                    }
                    
                    if (result.tokenCount >= ABSOLUTE_MAX_TOKENS) {
                        if (VERBOSE_SERVER_OUTPUT) {
                            console.log(`\n   [DEBUG] Reached absolute limit (${ABSOLUTE_MAX_TOKENS})`);
                        }
                        this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
                        break;
                    }
                    
                } catch (e) {
                    if (VERBOSE_SERVER_OUTPUT && trimmed.length < 200) {
                        console.log(`\n   [DEBUG] Parse error: ${e.message}`);
                    }
                }
            }
        });
        
        res.on('end', () => {
            if (streamEnded) return;
            this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
        });
        
        res.on('error', (err) => {
            if (streamEnded) return;
            if (result.tokenCount > 0) {
                // Partial success if we got tokens
                this._completeStreaming(streamTimeout, result, globalStart, req, resolve);
            } else {
                streamEnded = true;
                if (streamTimeout) clearTimeout(streamTimeout);
                result.error = err.message;
                console.log(`   ❌ Error: ${err.message}`);
                resolve();
            }
        });
    }
    
    // Helper to cleanly complete streaming
    _completeStreaming(streamTimeout, result, globalStart, req, resolve) {
        if (streamTimeout) clearTimeout(streamTimeout);
        result.totalMs = Date.now() - globalStart;
        result.responseLength = result.response.length;
        result.success = true;
        console.log('');
        console.log(`   ✅ Total: ${(result.totalMs / 1000).toFixed(3)}s | ${result.responseLength} chars | ${result.tokenCount} tokens`);
        req.destroy();
        resolve();
    }
    
    // ========================================================================
    // ONE-SHOT (NON-STREAMING) RESPONSE HANDLER
    // ========================================================================
    _handleOneShotResponse(res, req, result, globalStart, resolve, reject) {
        let buffer = '';
        let responseTimeout = null;
        let responseCompleted = false;
        
        // Set timeout for complete response
        responseTimeout = setTimeout(() => {
            if (responseCompleted) return;
            responseCompleted = true;
            console.log('\n   ⚠️  Response timeout after 60s');
            result.totalMs = Date.now() - globalStart;
            result.success = false;
            result.error = 'Response timeout';
            req.destroy();
            resolve();
        }, 60000);
        
        res.on('data', (chunk) => {
            if (responseCompleted) {
                req.destroy();
                return;
            }
            buffer += chunk.toString();
            
            // Hard limit: cap buffer at 256KB to prevent OOM from runaway responses
            if (buffer.length > 262144) {
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`\n   [DEBUG] Response buffer exceeded 256KB, truncating`);
                }
                buffer = buffer.substring(0, 262144);
            }
        });
        
        res.on('end', () => {
            if (responseCompleted) return;
            responseCompleted = true;
            if (responseTimeout) clearTimeout(responseTimeout);
            
            try {
                if (!buffer) {
                    result.error = 'Empty response';
                    result.success = false;
                    console.log('   ❌ Empty response received');
                    resolve();
                    return;
                }
                
                // Record TTFT (no streaming, so TTFT = total)
                result.ttftMs = Date.now() - globalStart;
                result.totalMs = result.ttftMs;
                
                // Parse response
                const json = JSON.parse(buffer);
                const choice = json.choices?.[0];
                const message = choice?.message;
                const text = message?.content || '';
                
                if (!text) {
                    result.error = 'No content in response';
                    result.success = false;
                    console.log('   ❌ No content in response');
                    resolve();
                    return;
                }
                
                // Extract response
                result.response = text;
                result.responseLength = text.length;
                
                // Hard limit: cap response at 65536 characters
                if (result.response.length > 65536) {
                    if (VERBOSE_SERVER_OUTPUT) {
                        console.log(`\n   [DEBUG] Response exceeded max character limit (65536 chars), truncating`);
                    }
                    result.response = result.response.substring(0, 65536);
                    result.responseLength = 65536;
                    console.log(`   ⚠️  Response truncated to 65536 characters`);
                }
                
                // Estimate tokens (rough: ~4 chars per token)
                result.tokenCount = Math.ceil(result.response.length / 4);
                
                result.success = true;
                console.log(`   ⏱️  TTFT: ${(result.ttftMs / 1000).toFixed(3)}s (one-shot mode)`);
                console.log(`   ✅ Total: ${(result.totalMs / 1000).toFixed(3)}s | ${result.responseLength} chars | ~${result.tokenCount} tokens (estimated)`);
                
                resolve();
                
            } catch (e) {
                if (VERBOSE_SERVER_OUTPUT) {
                    console.log(`\n   [DEBUG] Response parse error: ${e.message}`);
                    console.log(`   [DEBUG] Buffer (first 200 chars): ${buffer.substring(0, 200)}`);
                }
                result.error = e.message;
                result.success = false;
                resolve();
            }
        });
        
        res.on('error', (err) => {
            if (responseCompleted) return;
            responseCompleted = true;
            if (responseTimeout) clearTimeout(responseTimeout);
            result.error = err.message;
            result.success = false;
            console.log(`   ❌ Error: ${err.message}`);
            resolve();
        });
    }
}

// ============================================================================
// RESULTS REPORTER
// ============================================================================

class ResultsReporter {
    constructor(results, selectedPrompt) {
        this.results = results;
        this.selectedPrompt = selectedPrompt;
    }
    
    generateReport() {
        console.log('\n\n' + '═'.repeat(100));
        console.log('📊 COMPREHENSIVE BENCHMARK REPORT');
        console.log('═'.repeat(100));
        
        console.log(`\n📝 Tested Prompt: ${this.selectedPrompt.name}`);
        console.log(`   ID: ${this.selectedPrompt.id} | Category: ${this.selectedPrompt.category} | Length: ${this.selectedPrompt.length}`);
        console.log(`   Prompt: "${this.selectedPrompt.prompt}"`);
        console.log(`   Prompt Character Count: ${this.selectedPrompt.prompt.length}`);
        
        // Group results by server version
        const byVersion = {};
        this.results.forEach(r => {
            if (!byVersion[r.serverVersion]) {
                byVersion[r.serverVersion] = [];
            }
            byVersion[r.serverVersion].push(r);
        });
        
        // Report by server version
        Object.keys(byVersion).forEach(version => {
            console.log('\n' + '─'.repeat(100));
            console.log(`🖥️  SERVER VERSION: ${version}`);
            console.log('─'.repeat(100));
            
            const versionResults = byVersion[version];
            
            // Sort by TTFT for this version
            const sortedByTTFT = [...versionResults].sort((a, b) => {
                if (!a.ttftMs) return 1;
                if (!b.ttftMs) return -1;
                return a.ttftMs - b.ttftMs;
            });
            
            console.log('\n🏆 Ranking by Time to First Token (TTFT):');
            sortedByTTFT.forEach((r, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                const ttft = r.ttftMs ? `${(r.ttftMs / 1000).toFixed(3)}s` : 'N/A';
                const total = r.totalMs ? `${(r.totalMs / 1000).toFixed(3)}s` : 'N/A';
                const status = r.success ? '✅' : '❌';
                console.log(`   ${medal} ${r.modelName.padEnd(35)} | TTFT: ${ttft.padStart(8)} | Total: ${total.padStart(8)} | ${r.responseLength} chars ${status}`);
            });
            
            // Sort by total time
            const sortedByTotal = [...versionResults].sort((a, b) => {
                if (!a.totalMs) return 1;
                if (!b.totalMs) return -1;
                return a.totalMs - b.totalMs;
            });
            
            console.log('\n⚡ Ranking by Total Response Time:');
            sortedByTotal.forEach((r, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                const total = r.totalMs ? `${(r.totalMs / 1000).toFixed(3)}s` : 'N/A';
                const ttft = r.ttftMs ? `${(r.ttftMs / 1000).toFixed(3)}s` : 'N/A';
                const status = r.success ? '✅' : '❌';
                console.log(`   ${medal} ${r.modelName.padEnd(35)} | Total: ${total.padStart(8)} | TTFT: ${ttft.padStart(8)} | ${r.responseLength} chars ${status}`);
            });
            
            // Statistics for this version
            const successful = versionResults.filter(r => r.success);
            if (successful.length > 0) {
                const avgTTFT = successful.reduce((sum, r) => sum + r.ttftMs, 0) / successful.length;
                const avgTotal = successful.reduce((sum, r) => sum + r.totalMs, 0) / successful.length;
                const avgChars = successful.reduce((sum, r) => sum + r.responseLength, 0) / successful.length;
                
                console.log('\n📈 Statistics for this version:');
                console.log(`   Average TTFT: ${(avgTTFT / 1000).toFixed(3)}s`);
                console.log(`   Average Total Time: ${(avgTotal / 1000).toFixed(3)}s`);
                console.log(`   Average Response Length: ${avgChars.toFixed(0)} characters`);
                console.log(`   Success Rate: ${successful.length}/${versionResults.length} (${(successful.length / versionResults.length * 100).toFixed(1)}%)`);
            }
        });
        
        // Cross-version comparison for each model
        console.log('\n' + '═'.repeat(100));
        console.log('🔄 MODEL PERFORMANCE ACROSS SERVER VERSIONS');
        console.log('═'.repeat(100));
        
        const byModel = {};
        this.results.forEach(r => {
            if (!byModel[r.modelName]) {
                byModel[r.modelName] = [];
            }
            byModel[r.modelName].push(r);
        });
        
        Object.keys(byModel).forEach(modelName => {
            console.log(`\n📦 ${modelName}:`);
            const modelResults = byModel[modelName];
            modelResults.forEach(r => {
                const ttft = r.ttftMs ? `${(r.ttftMs / 1000).toFixed(3)}s` : 'N/A';
                const total = r.totalMs ? `${(r.totalMs / 1000).toFixed(3)}s` : 'N/A';
                const status = r.success ? '✅' : '❌';
                console.log(`   ${r.serverVersion.padEnd(20)} | TTFT: ${ttft.padStart(8)} | Total: ${total.padStart(8)} | ${r.responseLength} chars ${status}`);
            });
        });
        
        // Overall best performers
        console.log('\n' + '═'.repeat(100));
        console.log('🏆 OVERALL CHAMPIONS');
        console.log('═'.repeat(100));
        
        const allSuccessful = this.results.filter(r => r.success);
        
        if (allSuccessful.length > 0) {
            const fastestTTFT = [...allSuccessful].sort((a, b) => a.ttftMs - b.ttftMs)[0];
            const fastestTotal = [...allSuccessful].sort((a, b) => a.totalMs - b.totalMs)[0];
            const mostChars = [...allSuccessful].sort((a, b) => b.responseLength - a.responseLength)[0];
            
            console.log(`\n🥇 Fastest Time to First Token:`);
            console.log(`   ${fastestTTFT.modelName} (${fastestTTFT.serverVersion})`);
            console.log(`   TTFT: ${(fastestTTFT.ttftMs / 1000).toFixed(3)}s`);
            
            console.log(`\n🥇 Fastest Total Response:`);
            console.log(`   ${fastestTotal.modelName} (${fastestTotal.serverVersion})`);
            console.log(`   Total Time: ${(fastestTotal.totalMs / 1000).toFixed(3)}s`);
            
            console.log(`\n🥇 Most Comprehensive Response:`);
            console.log(`   ${mostChars.modelName} (${mostChars.serverVersion})`);
            console.log(`   Response Length: ${mostChars.responseLength} characters`);
        }
        
        // Failures summary
        const failures = this.results.filter(r => !r.success);
        if (failures.length > 0) {
            console.log('\n' + '═'.repeat(100));
            console.log('❌ FAILURES');
            console.log('═'.repeat(100));
            failures.forEach(r => {
                console.log(`\n   Model: ${r.modelName}`);
                console.log(`   Server: ${r.serverVersion}`);
                console.log(`   Error: ${r.error}`);
            });
        }
        
        console.log('\n' + '═'.repeat(100));
        console.log('📊 REPORT COMPLETE');
        console.log('═'.repeat(100) + '\n');
    }
    
    saveToFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `benchmark-report-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        const reportData = {
            timestamp: new Date().toISOString(),
            prompt: this.selectedPrompt,
            results: this.results,
            summary: this.generateSummary()
        };
        
        fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
        console.log(`💾 Detailed results saved to: ${filename}\n`);
    }
    
    generateSummary() {
        const successful = this.results.filter(r => r.success);
        return {
            totalTests: this.results.length,
            successful: successful.length,
            failed: this.results.length - successful.length,
            avgTTFT: successful.length > 0 
                ? successful.reduce((sum, r) => sum + r.ttftMs, 0) / successful.length 
                : null,
            avgTotalTime: successful.length > 0
                ? successful.reduce((sum, r) => sum + r.totalMs, 0) / successful.length
                : null,
            avgResponseLength: successful.length > 0
                ? successful.reduce((sum, r) => sum + r.responseLength, 0) / successful.length
                : null
        };
    }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    COMPREHENSIVE MODEL BENCHMARK SUITE                        ║');
    console.log('║                  Multi-Model × Multi-Version Performance Analysis              ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    
    if (START_FROM_COMBINATION > 1) {
        console.log(`\n🔄 Resuming from combination #${START_FROM_COMBINATION}\n`);
    }
    
    // Step 1: Select prompt
    const selectedPrompt = await selectPrompt();
    console.log(`\n✅ Selected: ${selectedPrompt.name}\n`);
    
    // Step 2: Get server versions to test
    const serverVersions = Object.keys(launchConfig.llamaServerVersions.available);
    const modelCount = launchConfig.models.length;
    console.log('🖥️  Server versions to test:', serverVersions.join(', '));
    console.log(`   (Combinations are numbered sequentially: each server × each model)`);
    if (serverVersions.length > 1) {
        console.log(`   With ${serverVersions.length} servers and ${modelCount} models:`);
        console.log(`   - Combinations 1-${modelCount} = Server 1 (${serverVersions[0]})`);
        for (let s = 1; s < serverVersions.length; s++) {
            const start = s * modelCount + 1;
            const end = (s + 1) * modelCount;
            console.log(`   - Combinations ${start}-${end} = Server ${s + 1} (${serverVersions[s]})`);
        }
    }
    
    // Step 3: Get models to test
    const models = launchConfig.models;
    console.log(`📦 Models to test: ${models.length} models`);
    
    const totalTests = models.length * serverVersions.length;
    console.log(`\n⚡ Total combinations: ${models.length} models × ${serverVersions.length} versions = ${totalTests} tests`);
    
    if (START_FROM_COMBINATION > 1) {
        console.log(`   Starting from combination ${START_FROM_COMBINATION}, will run ${totalTests - START_FROM_COMBINATION + 1} tests`);
    }
    console.log('');
    
    // Confirm before starting
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    await new Promise((resolve) => {
        rl.question('Press ENTER to start benchmark (or Ctrl+C to cancel)... ', () => {
            rl.close();
            resolve();
        });
    });
    
    // Step 4: Run all tests
    const serverManager = new LlamaServerManager();
    const tester = new ModelTester(serverManager.port, serverManager.host);
    const allResults = [];
    
    let combinationNumber = 0;
    
    console.log('\n' + '═'.repeat(100));
    console.log('🚀 STARTING BENCHMARK');
    console.log('═'.repeat(100) + '\n');
    
    for (const serverVersion of serverVersions) {
        console.log('\n' + '█'.repeat(100));
        console.log(`🖥️  TESTING WITH SERVER VERSION: ${serverVersion}`);
        console.log('█'.repeat(100));
        
        for (const model of models) {
            combinationNumber++;
            
            // Skip combinations before the starting point
            if (combinationNumber < START_FROM_COMBINATION) {
                console.log(`\n⏭️  Skipping combination #${combinationNumber}: ${model.id}. ${model.name} × ${serverVersion}`);
                continue;
            }
            
            console.log(`\n[Combination #${combinationNumber}/${totalTests}] ════════════════════════════════════════════════════════════════`);
            console.log(`   Model ID: ${model.id} | Name: ${model.name}`);
            console.log(`   Server: ${serverVersion}`);
            
            // Check if vision model has required mmproj file
            const isVisionModel = model.name.includes('VL') || model.name.includes('Vision') || model.name.includes('GLM') || model.name.includes('SmolVLM');
            const hasMmproj = model.parameters?.mmproj && model.parameters.mmproj !== '';
            
            if (isVisionModel && !hasMmproj) {
                console.log(`   ⚠️  WARNING: Vision model configured without mmproj file`);
                console.log(`   ℹ️  Proceeding anyway - vision features will not work correctly`);
            }
            
            try {
                // Launch server with this model and version
                const modelLoadTimeMs = await serverManager.launch(model, serverVersion);
                
                // Run test
                const result = await tester.testModel(model, selectedPrompt, true, modelLoadTimeMs);
                result.serverVersion = serverVersion;
                result.combinationNumber = combinationNumber;
                allResults.push(result);
                
                // Shutdown server
                await serverManager.shutdown();
                
                // Brief pause between tests
                await serverManager.sleep(3000);
                
            } catch (err) {
                console.error(`❌ Test failed: ${err.message}`);
                allResults.push({
                    modelId: model.id,
                    modelName: model.name,
                    filename: model.filename,
                    promptId: selectedPrompt.id,
                    promptName: selectedPrompt.name,
                    promptLength: selectedPrompt.prompt.length,
                    modelLoadTimeMs: 0,
                    serverVersion: serverVersion,
                    combinationNumber: combinationNumber,
                    ttftMs: null,
                    totalMs: null,
                    responseLength: 0,
                    tokenCount: 0,
                    success: false,
                    error: err.message,
                    response: ''
                });
                
                // Ensure server is stopped even on error
                try {
                    await serverManager.shutdown();
                } catch (e) {
                    // Ignore shutdown errors
                }
                
                await serverManager.sleep(3000);
            }
        }
    }
    
    // Step 5: Generate and display report
    const reporter = new ResultsReporter(allResults, selectedPrompt);
    reporter.generateReport();
    reporter.saveToFile();
    
    console.log('✨ Benchmark complete!\n');
    console.log('💡 To resume from a specific combination, use: node compare-all-models-next.js --start=N\n');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║              COMPREHENSIVE MODEL BENCHMARK SUITE - Help                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Usage: node compare-all-models-next.js [options]

Options:
  --start=N         Start from combination number N (default: 1)
  --help, -h        Show this help message

Examples:
  node compare-all-models-next.js
      Run all combinations from the beginning

  node compare-all-models-next.js --start=10
      Resume from combination #10 (useful after interruption)

Notes:
  - Combination numbers are displayed during execution as [Combination #N/Total]
  - If interrupted, note the last completed combination and resume from next
  - Results are saved incrementally to JSON file after completion
`);
    process.exit(0);
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    console.error('\n💡 You can resume from a specific combination using: node compare-all-models-next.js --start=N');
    process.exit(1);
});
