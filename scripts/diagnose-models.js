#!/usr/bin/env node

import http from 'http';

// Test each model with minimal overhead
const tests = [
    {
        name: "Simple Echo",
        prompt: "Say 'hello'",
        params: { temperature: 0.1, top_k: 5, top_p: 0.5, repeat_penalty: 1.5, n_predict: 10 }
    },
    {
        name: "Basic Q&A",
        prompt: "What is 2+2?",
        params: { temperature: 0.1, top_k: 10, top_p: 0.7, repeat_penalty: 1.3, n_predict: 20 }
    },
    {
        name: "Word Completion (no penalty)",
        prompt: "The capital of France is",
        params: { temperature: 0.0, top_k: 1, top_p: 1.0, repeat_penalty: 1.0, n_predict: 5 }
    }
];

async function runTest(testName, prompt, params) {
    return new Promise((resolve) => {
        const body = JSON.stringify({ prompt, stream: false, ...params });
        
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
                    resolve({
                        test: testName,
                        prompt: prompt,
                        response: response.substring(0, 100),
                        length: response.length,
                        tokens: lastLine.tokens_predicted || 0
                    });
                } catch (e) {
                    resolve({
                        test: testName,
                        error: e.message
                    });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ test: testName, error: err.message });
        });

        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('🔍 Model Diagnostics - Testing llama-server endpoint\n');
    
    // Get current model
    http.get('http://localhost:8000/props', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
            try {
                const props = JSON.parse(data);
                const modelName = props.model_alias;
                console.log(`📊 Current Model: ${modelName}\n`);
                console.log('Running diagnostic tests...\n');
                
                for (const test of tests) {
                    const result = await runTest(test.name, test.prompt, test.params);
                    console.log(`Test: ${result.test}`);
                    console.log(`  Prompt: "${result.prompt}"`);
                    if (result.error) {
                        console.log(`  ❌ Error: ${result.error}`);
                    } else {
                        console.log(`  Response: "${result.response}${result.length > 100 ? '...' : ''}"`);
                        console.log(`  Stats: ${result.length} chars, ${result.tokens} tokens`);
                        
                        // Detect hallucination patterns
                        if (result.response.match(/(.)\1{5,}/)) {
                            console.log(`  ⚠️  REPETITION DETECTED!`);
                        }
                        if (result.response.match(/^[a-z]for/i)) {
                            console.log(`  ⚠️  HALLUCINATION PATTERN DETECTED!`);
                        }
                    }
                    console.log('');
                }
                
                console.log('\n📋 Analysis:');
                console.log('- Qwen3-Coder: Usually works (native llama-arch)');
                console.log('- Gemma-4: May have tokenizer/format issues');
                console.log('- LFM2/GLM: Might need chat format instead of completion');
                
            } catch (e) {
                console.error('Failed to get model info:', e.message);
            }
        });
    });
}

main();
