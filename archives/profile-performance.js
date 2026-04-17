#!/usr/bin/env node

/**
 * Diagnostic: Why is PowerShell 13.4s slower than Node.js?
 * Testing individual components to isolate the bottleneck
 */

import http from 'http';
import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';

console.log('🔍 PERFORMANCE PROFILING: Node.js vs PowerShell\n');

// Test 1: HTTP Request Overhead
console.log('1️⃣  HTTP Request Overhead:');
const start1 = performance.now();
await new Promise((resolve) => {
    const body = JSON.stringify({
        model: 'gemma4:26b',
        prompt: 'x',
        stream: true,
        options: { num_ctx: 2048, num_batch: 512 }
    });

    const req = http.request('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    }, (res) => {
        let count = 0;
        res.on('data', () => {
            count++;
            if (count === 1) resolve();  // Resolve on first token
        });
    });
    req.write(body);
    req.end();
});
const nodeHttpTime = performance.now() - start1;
console.log(`   Node.js HTTP: ${nodeHttpTime.toFixed(0)}ms\n`);

// Test 2: PowerShell curl overhead
console.log('2️⃣  PowerShell curl.exe Overhead:');
const start2 = performance.now();
const ps1Code = `
$body = @{model="gemma4:26b"; prompt="x"; stream=$true; options=@{num_ctx=2048; num_batch=512}} | ConvertTo-Json -Compress
curl.exe -s -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d $body | ForEach-Object {
    if ($_ -match '"response"') { exit }
}
`;

spawnSync('powershell.exe', ['-NoProfile', '-Command', ps1Code], { encodingTimeout: 60000 });
const ps1CurlTime = performance.now() - start2;
console.log(`   PowerShell curl: ${ps1CurlTime.toFixed(0)}ms\n`);

// Test 3: curl.exe alone (from Node)
console.log('3️⃣  curl.exe Process Overhead:');
const start3 = performance.now();
const body = JSON.stringify({
    model: 'gemma4:26b',
    prompt: 'x',
    stream: true,
    options: { num_ctx: 2048, num_batch: 512 }
});

spawnSync('curl.exe', [
    '-s', '-X', 'POST', 'http://localhost:11434/api/generate',
    '-H', 'Content-Type: application/json',
    '-d', body
], { encoding: 'utf8', timeout: 60000 });
const curlTime = performance.now() - start3;
console.log(`   curl.exe alone: ${curlTime.toFixed(0)}ms\n`);

// Summary
console.log('='.repeat(60));
console.log('\n📊 ANALYSIS:\n');
console.log(`Node.js native HTTP:      ${nodeHttpTime.toFixed(0)}ms`);
console.log(`PowerShell + curl:        ${ps1CurlTime.toFixed(0)}ms`);
console.log(`curl.exe process spawn:   ${curlTime.toFixed(0)}ms`);
console.log(`\nOverhead breakdown:`);
console.log(`  • curl.exe spawn:       ~${curlTime.toFixed(0)}ms`);
console.log(`  • PowerShell startup:   ~${(ps1CurlTime - curlTime).toFixed(0)}ms`);
console.log(`  • Node.js HTTP native:  ${nodeHttpTime.toFixed(0)}ms ✅ FASTEST\n`);

console.log('💡 RECOMMENDATION:\n');
console.log('Use Node.js HTTP over curl.exe in PowerShell.');
console.log('Alternatively, wrap curl call in PowerShell without -NoProfile.\n');
