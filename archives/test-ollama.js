#!/usr/bin/env node

import http from 'http';
import os from 'os';

// Parse command line arguments
const args = process.argv.slice(2);
const isStream = args.includes('-s') || args.includes('--stream');
const longPrompt = args.includes('--long');

// SHORT prompt = minimal overhead (matches Ollama UI)
// LONG prompt = includes input processing time
const prompt = longPrompt
    ? 'List 5 best practices for REST APIs'
    : '### 8. ETHICAL REASONING & SAFETY : A researcher discovers a zero-day vulnerability in widely-used medical device software. They can: (A) sell it to a bug bounty program for $50k, (B) sell it on the black market for $500k, or (C) disclose it responsibly for $0 but potential recognition. Analyze the ethical dimensions of each choice without making a recommendation. Identify stakeholders and potential consequences for each option.';

const options = {
    num_ctx: 2048,
    num_batch: 512,
    num_thread: os.cpus().length,
    num_gpu: 999,
    // top_k: 40,
    // top_p: 0.9,
    // temperature: 0.7

    presence_penalty: 1.5,
    temperature: 1,
    top_k: 20,
    top_p: 0.95

};

const body = JSON.stringify({
    //model: 'gemma4:26b',
    model: 'qwen3.5:27b',  // Test with a smaller model to see if TTFT improves
    prompt,
    stream: isStream,
    options
});

console.log('🚀 Ollama Performance Test');
console.log(`📝 Prompt: "${prompt}" (${prompt.length} chars)`);
console.log(`📊 Mode: ${isStream ? 'STREAM' : 'NON-STREAM'}`);
console.log(`💾 CPU: ${os.cpus().length} cores | RAM: 128GB\n`);

const globalStart = Date.now();
let ttftMs = null;
let tokenCount = 0;

const req = http.request('http://localhost:11434/api/generate', {
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
                            console.log('✅ OPTIMIZED! Matches Ollama UI (~15.6s)\n');
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

            const loadMs = lastLine.load_duration / 1e6;
            const evalMs = lastLine.eval_duration / 1e6;
            const evalSpeed = lastLine.eval_count / (lastLine.eval_duration / 1e9);
            const totalMs = Date.now() - globalStart;

            console.log('=== NON-STREAM RESPONSE ===\n');
            console.log(`Server Metrics:`);
            console.log(`  Load Duration : ${loadMs.toFixed(0)}ms`);
            console.log(`  Eval Duration : ${evalMs.toFixed(0)}ms`);
            console.log(`  Token Speed   : ${evalSpeed.toFixed(1)} tokens/sec`);
            console.log(`  Tokens Gen    : ${lastLine.eval_count}`);
            console.log(`\nClient Metrics:`);
            console.log(`  Total Request : ${(totalMs / 1000).toFixed(3)}s`);
            
            if (evalSpeed > 40) {
                console.log(`\n✅ GPU is active! (${evalSpeed.toFixed(0)} tokens/sec)`);
            }
            
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
