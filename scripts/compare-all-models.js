#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load launch config
let launchConfig = {};
try {
    const data = fs.readFileSync(path.join(__dirname, 'launchConfig.json'), 'utf8');
    launchConfig = JSON.parse(data);
} catch (e) {
    console.error('Failed to load launchConfig.json');
    process.exit(1);
}

// Simple test prompt
const testPrompt = "What is artificial intelligence?";
const maxChars = 200; // Limit output for readability

async function testModel(modelId) {
    return new Promise((resolve) => {
        const model = launchConfig.models.find(m => m.id === modelId);
        if (!model) {
            resolve({ id: modelId, error: 'Model not found' });
            return;
        }

        const params = model.parameters;
        const body = JSON.stringify({
            prompt: testPrompt,
            stream: false,
            temperature: params.temperature,
            top_k: params.top_k,
            top_p: params.top_p,
            repeat_penalty: params.repeat_penalty,
            n_predict: 150
        });

        const req = http.request('http://localhost:8000/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const lines = data.trim().split('\n');
                    const lastLine = JSON.parse(lines[lines.length - 1]);
                    const response = lastLine.response || lastLine.content || '';
                    
                    // Check for quality issues
                    const issues = [];
                    if (response.match(/(.)\1{5,}/)) issues.push('Repetition');
                    if (response.match(/[a-z]for[a-z]/gi)) issues.push('Corruption');
                    if (response.length < 20) issues.push('Too Short');
                    
                    resolve({
                        id: modelId,
                        name: model.name,
                        filename: model.filename,
                        quantization: model.filename.match(/(Q[0-9]_[0-9]|FP[0-9]+)/)?.[1] || 'Unknown',
                        temperature: params.temperature,
                        repeat_penalty: params.repeat_penalty,
                        response: response.substring(0, maxChars) + (response.length > maxChars ? '...' : ''),
                        length: response.length,
                        quality: issues.length === 0 ? '✅ GOOD' : `⚠️ ${issues.join(', ')}`,
                        issues: issues
                    });
                } catch (e) {
                    resolve({
                        id: modelId,
                        name: model.name,
                        error: e.message
                    });
                }
            });
        });

        req.on('error', (err) => {
            resolve({
                id: modelId,
                name: model.name,
                error: err.message
            });
        });

        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('🔄 Model Comparison Test\n');
    console.log(`Testing with prompt: "${testPrompt}"\n`);
    console.log('═'.repeat(85));

    // Test all models
    const results = [];
    for (const model of launchConfig.models) {
        process.stdout.write(`Testing ${model.name}... `);
        const result = await testModel(model.id);
        results.push(result);
        console.log('✓');
    }

    console.log('═'.repeat(85) + '\n');

    // Display results
    for (const result of results) {
        console.log(`📦 ${result.name}`);
        console.log(`   File: ${result.filename}`);
        
        if (result.error) {
            console.log(`   ❌ Error: ${result.error}`);
        } else {
            console.log(`   Quantization: ${result.quantization}`);
            console.log(`   Temperature: ${result.temperature}, Repeat Penalty: ${result.repeat_penalty}`);
            console.log(`   Quality: ${result.quality}`);
            console.log(`   Output: "${result.response}"`);
            console.log(`   Length: ${result.length} chars`);
        }
        console.log('');
    }

    // Summary
    console.log('═'.repeat(85));
    console.log('\n📊 Summary:');
    const good = results.filter(r => r.quality && r.quality.includes('✅'));
    const bad = results.filter(r => r.quality && r.quality.includes('⚠️'));
    const errors = results.filter(r => r.error);

    if (good.length > 0) {
        console.log(`✅ Good Models (${good.length}): ${good.map(r => r.name).join(', ')}`);
    }
    if (bad.length > 0) {
        console.log(`⚠️  Problematic Models (${bad.length}): ${bad.map(r => r.name).join(', ')}`);
    }
    if (errors.length > 0) {
        console.log(`❌ Errors (${errors.length}): ${errors.map(r => r.name).join(', ')}`);
    }

    console.log('\n💡 Recommendation:');
    const bestModel = good[0] || results[0];
    console.log(`Use: ${bestModel.name} (${bestModel.quantization})`);
    console.log('');
}

main();
