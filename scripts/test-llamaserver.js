#!/usr/bin/env node

import http from 'http';
import os from 'os';

// Parse command line arguments
const args = process.argv.slice(2);
const isStream = args.includes('-s') || args.includes('--stream');
const longPrompt = args.includes('--long');

// SHORT prompt = minimal overhead
// LONG prompt = includes input processing time
const prompt = longPrompt
    ? 'List 5 best practices for REST APIs'
    : '### 8. ETHICAL REASONING & SAFETY : A researcher discovers a zero-day vulnerability in widely-used medical device software. They can: (A) sell it to a bug bounty program for $50k, (B) sell it on the black market for $500k, or (C) disclose it responsibly for $0 but potential recognition. Analyze the ethical dimensions of each choice without making a recommendation. Identify stakeholders and potential consequences for each option.';

// llama-server parameters (no model field - server uses loaded model)
const body = JSON.stringify({
    prompt,
    stream: isStream,
    n_predict: 256,
    temperature: 1,
    top_k: 20,
    top_p: 0.95,
});

console.log('🚀 Llama-Server Performance Test');
console.log(`📝 Prompt: "${prompt}" (${prompt.length} chars)`);
console.log(`📊 Mode: ${isStream ? 'STREAM' : 'NON-STREAM'}`);
console.log(`💾 CPU: ${os.cpus().length} cores | RAM: 128GB`);
console.log(`🤖 Model: Qwen3-Coder-30B-A3B (loaded via llama-server)\n`);

const globalStart = Date.now();
let ttftMs = null;
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
                        if (ttftMs < 16000) {
                            console.log('✅ OPTIMIZED! Matches performance expectations\n');
                        } else {
                            console.log('📊 (Long prompt includes input processing time)\n');
                        }
                    }
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            process.stdout.write(json.response);
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
            console.log(`🔢 Tokens Generated    : ${tokenCount}`);
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
            
            if (lastLine.response) {
                console.log(`\nResponse Preview:`);
                console.log(lastLine.response.substring(0, 300));
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
