#!/usr/bin/env node

/**
 * OLLAMA OPTIMIZATION FOR GMLTEC EVO X2
 * Goal: Achieve 15-16s TTFT (matching Ollama UI)
 */

import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTest(name, options) {
    return new Promise((resolve) => {
        const body = JSON.stringify({
            model: 'gemma4:26b',
            prompt: 'x',  // Single char to minimize prompt processing
            stream: true,
            options
        });

        const start = Date.now();
        let ttft = null;
        let tokens = 0;

        const req = http.request('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Connection': 'keep-alive'
            }
        }, (res) => {
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                lines.forEach(line => {
                    if (line.trim()) {
                        tokens++;
                        if (ttft === null) {
                            ttft = Date.now() - start;
                        }
                    }
                });
            });
            res.on('end', () => {
                resolve({
                    name,
                    ttft: ttft / 1000,
                    total: (Date.now() - start) / 1000
                });
            });
        });
        req.on('error', () => resolve({ name, ttft: null, total: null }));
        req.write(body);
        req.end();
    });
}

async function optimize() {
    console.log('🔧 OLLAMA GPU OPTIMIZATION TESTS\n');
    console.log('Testing different configurations (single-char prompt)...\n');

    const configs = [
        {
            name: 'Default (current)',
            options: { num_ctx: 2048, num_batch: 256 }
        },
        {
            name: 'Low context (faster)',
            options: { num_ctx: 1024, num_batch: 512 }
        },
        {
            name: 'Ultra-low context',
            options: { num_ctx: 512, num_batch: 1024 }
        },
        {
            name: 'High batch size',
            options: { num_ctx: 1024, num_batch: 2048 }
        }
    ];

    const results = [];
    for (const config of configs) {
        const result = await runTest(config.name, config.options);
        results.push(result);
        console.log(`✓ ${result.name}: ${result.ttft?.toFixed(3)}s TTFT`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS SUMMARY\n');

    const fastest = results.reduce((a, b) => (a.ttft || 999) < (b.ttft || 999) ? a : b);
    
    results.forEach(r => {
        const isOptimal = r.name === fastest.name;
        const marker = isOptimal ? '🏆' : '  ';
        console.log(`${marker} ${r.name.padEnd(25)} : ${r.ttft?.toFixed(3)}s`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:\n');

    if ((fastest.ttft || 999) <= 16) {
        console.log('✅ EXCELLENT! Your setup is optimized.');
        console.log(`💡 Use these settings: ${JSON.stringify(configs[results.indexOf(fastest)].options)}`);
    } else {
        console.log('⚠️  GPU may NOT be fully utilized. Try:\n');
        console.log('1. Check GPU offloading:');
        console.log('   Run: ollama show gemma4:26b\n');
        console.log('2. Force GPU layers (Windows):');
        console.log('   • Open Ollama settings');
        console.log('   • Set OLLAMA_GPU_LAYERS=999\n');
        console.log('3. Alternative - restart Ollama:');
        console.log('   • Quit Ollama completely');
        console.log('   • Run in terminal: OLLAMA_GPU_LAYERS=999 ollama serve\n');
        console.log('4. Check if using CPU-optimized build:');
        console.log('   • ollama --version');
        console.log('   • May need CUDA/ROCM drivers for GPU\n');
    }

    console.log('📈 Expected Performance:');
    console.log('   • GPU: 15-20s TTFT');
    console.log('   • CPU: 60-120s TTFT\n');
}

optimize().catch(console.error);
