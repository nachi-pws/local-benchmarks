#!/usr/bin/env node

import http from 'http';
import os from 'os';

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(`http://localhost:11434${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(body && { 'Content-Length': Buffer.byteLength(body) })
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function diagnose() {
    console.log('🔍 OLLAMA DIAGNOSTICS\n');
    
    try {
        // 1. Check server status
        console.log('1️⃣  Server Status:');
        const tags = await makeRequest('/api/tags');
        console.log(`   ✓ Ollama is running`);
        console.log(`   Models: ${tags.models?.map(m => m.name).join(', ') || 'None'}`);
        
        // 2. Check gemma4:26b details
        console.log('\n2️⃣  Model Status (gemma4:26b):');
        const show = await makeRequest('/api/show', 'POST', JSON.stringify({ name: 'gemma4:26b' }));
        console.log(`   Model: ${show.name}`);
        console.log(`   Size: ${(show.details?.parameter_size / 1e9).toFixed(1)}B`);
        console.log(`   Quantization: ${show.details?.quantization_level || 'Unknown'}`);
        
        // 3. Test small prompt to see baseline
        console.log('\n3️⃣  Testing with SHORT prompt (baseline):');
        const shortStart = Date.now();
        const shortPrompt = JSON.stringify({
            model: 'gemma4:26b',
            prompt: 'hi',
            stream: true,
            options: { num_ctx: 1024, num_batch: 512 }
        });
        
        let shortTtft = null;
        let shortTokens = 0;
        
        await new Promise((resolve) => {
            const req = http.request('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(shortPrompt)
                }
            }, (res) => {
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    lines.forEach(line => {
                        if (line.trim()) {
                            shortTokens++;
                            if (shortTtft === null) {
                                shortTtft = Date.now() - shortStart;
                            }
                            try {
                                const j = JSON.parse(line);
                                if (j.response) process.stdout.write('.');
                            } catch (e) {}
                        }
                    });
                });
                res.on('end', resolve);
            });
            req.write(shortPrompt);
            req.end();
        });
        
        console.log(`\n   TTFT: ${(shortTtft / 1000).toFixed(3)}s | Total: ${((Date.now() - shortStart) / 1000).toFixed(3)}s`);
        
        // 4. Test if GPU is being used
        console.log('\n4️⃣  GPU Offloading:');
        const gpuTest = await makeRequest('/api/generate', 'POST', JSON.stringify({
            model: 'gemma4:26b',
            prompt: 'test',
            stream: false,
            options: { num_ctx: 1024 }
        }));
        
        const loadMs = gpuTest.load_duration / 1e6;
        const evalMs = gpuTest.eval_duration / 1e6;
        const evalSpeed = gpuTest.eval_count / (gpuTest.eval_duration / 1e9);
        
        console.log(`   Load time: ${loadMs.toFixed(0)}ms`);
        console.log(`   Eval speed: ${evalSpeed.toFixed(0)} tokens/sec`);
        
        if (evalSpeed < 5) {
            console.log(`   ⚠️  SLOW - Model may be running on CPU, not GPU!`);
            console.log(`   💡 Try: OLLAMA_GPU_LAYERS=999 ollama serve`);
        } else if (evalSpeed > 50) {
            console.log(`   ✓ FAST - Likely GPU-accelerated`);
        } else {
            console.log(`   ~ MEDIUM - Check GPU load`);
        }
        
        // 5. Recommendations
        console.log('\n5️⃣  Optimization Recommendations:\n');
        
        if (evalSpeed < 10) {
            console.log(`   🔴 Current TTFT ~15-27s is SLOW for your hardware`);
            console.log(`   ✅ Solutions:`);
            console.log(`      • Ensure GPU offloading: export OLLAMA_GPU_LAYERS=999 (before starting Ollama)`);
            console.log(`      • Check if gemma4:26b is quantized properly`);
            console.log(`      • Try: ollama pull gemma4:7b (faster version)`);
            console.log(`      • Reduce num_ctx in requests (currently 4096)`);
        } else {
            console.log(`   ✓ Your TTFT is reasonable for this model`);
            console.log(`   The 27s in script vs 15.6s in UI might be:`);
            console.log(`      • Different prompt lengths`);
            console.log(`      • UI caching/warming overhead differently`);
            console.log(`      • Model already preloaded in UI`);
        }
        
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        console.error('Make sure Ollama is running: ollama serve');
    }
}

diagnose();
