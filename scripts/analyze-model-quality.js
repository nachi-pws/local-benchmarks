#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadLaunchConfig } from './config-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📊 Model Quality Analysis & Recommendations\n');

// Load launch config
let launchConfig = {};
try {
    launchConfig = loadLaunchConfig();
} catch (e) {
    console.error('Failed to load launchConfig.json:', e.message);
    process.exit(1);
}

// Get current loaded model
const request = http.get('http://localhost:8000/props', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const props = JSON.parse(data);
            const modelAlias = props.model_alias;
            
            // Find matching config
            const foundModel = launchConfig.models.find(m => 
                modelAlias.includes(m.filename.replace('.gguf', ''))
            );
            
            if (!foundModel) {
                console.error('Model not found in launchConfig');
                process.exit(1);
            }
            
            console.log(`📦 Current Model: ${foundModel.name}`);
            console.log(`📄 File: ${foundModel.filename}`);
            console.log(`📋 Description: ${foundModel.description}\n`);
            
            // Extract quantization level
            const quantMatch = foundModel.filename.match(/(Q[0-9]_[0-9]|Q[0-9])/);
            const quant = quantMatch ? quantMatch[1] : 'Unknown';
            
            // Analyze parameters
            const params = foundModel.parameters;
            console.log('⚙️  Current Parameters:');
            console.log(`   Temperature: ${params.temperature}`);
            console.log(`   Top-P: ${params.top_p}`);
            console.log(`   Top-K: ${params.top_k}`);
            console.log(`   Repeat Penalty: ${params.repeat_penalty}`);
            console.log(`   Max Tokens: ${params.n_predict}`);
            console.log(`   Quantization: ${quant}\n`);
            
            // Quality assessment
            console.log('🎯 Quality Assessment:');
            
            const issues = [];
            const recommendations = [];
            
            // Check for problematic combinations
            if (quant === 'Q4_0' || quant === 'Q4_1') {
                issues.push(`${quant} quantization may cause token corruption`);
                recommendations.push('Switch to Q6_K or higher quality quantization if available');
            }
            
            if (params.repeat_penalty <= 1.0) {
                issues.push('Repeat penalty ≤ 1.0 allows repetition loops');
                recommendations.push(`Increase to 1.2-1.3 for ${foundModel.name}`);
            }
            
            if (params.temperature >= 0.9 && quant.startsWith('Q4')) {
                issues.push('High temperature + low quantization = hallucinations');
                recommendations.push(`Reduce temperature to 0.5-0.7 for stability`);
            }
            
            // Model-specific issues
            if (foundModel.name.includes('LFM')) {
                issues.push('LFM2 is prone to token artifacts in Q4');
                recommendations.push('Use Qwen3-Coder instead (more stable with Q4)');
            }
            
            if (foundModel.name.includes('GLM')) {
                issues.push('GLM may need specific chat format');
                recommendations.push('Consider using /v1/chat/completions endpoint if available');
            }
            
            if (issues.length === 0) {
                console.log('✅ No obvious issues detected\n');
            } else {
                console.log('⚠️  Potential Issues:');
                issues.forEach(issue => console.log(`  • ${issue}`));
                console.log('');
            }
            
            if (recommendations.length > 0) {
                console.log('💡 Recommendations:');
                recommendations.forEach(rec => console.log(`  ✓ ${rec}`));
                console.log('');
            }
            
            // Model ranking
            console.log('📈 Model Stability Ranking (Best → Worst):');
            console.log('  1. Qwen3-Coder-Q4_K_M ✅ (Native llama, ~4.3 tok/s)');
            console.log('  2. Qwen3-VL-Q2_K ✅ (Lower quant, ~8-10 tok/s)');
            console.log('  3. Gemma-4-Q4_K_M ⚠️  (May need temp↓ to 0.5)');
            console.log('  4. GLM-4.6V-Q8_0 ⚠️  (Q8 = better, check endpoint)');
            console.log('  5. LFM2-Q4_0 ❌ (Lowest quality, high corruption)\n');
            
            console.log('🚀 Quick Fix for Current Model:');
            if (foundModel.name.includes('LFM')) {
                console.log('  node test-gguf-models.js [ID] --conservative');
                console.log('  (Forces: temp=0.1, repeat_penalty=1.25)\n');
            } else if (foundModel.name.includes('Gemma')) {
                console.log('  • Reduce temperature from 1.0 to 0.5');
                console.log('  • Increase repeat_penalty to 1.15+');
                console.log('  • Use: node test-gguf-models.js [ID] --conservative\n');
            }
            
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
});

request.on('error', (err) => {
    console.error('❌ Cannot connect to llama-server');
    console.error('');
    console.error('llama-server is not running on http://localhost:8000');
    console.error('');
    console.error('💡 Start llama-server with a model loaded:');
    console.error('   D:\\Llama-Server-Exes\\llama-b8672-bin-win-vulkan-x64\\llama-server.exe \\');
    console.error('     --model "D:\\Large-Lang-Models\\Models\\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf" \\');
    console.error('     --port 8000 \\');
    console.error('     --n-gpu-layers 99');
    console.error('');
    process.exit(1);
});
