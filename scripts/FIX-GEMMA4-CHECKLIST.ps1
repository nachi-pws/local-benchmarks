#!/usr/bin/env pwsh
<#
.SYNOPSIS
Step-by-step gemma-4 garbage output fix
.DESCRIPTION
Provides a checklist to resolve the "la la la" output issue
#>

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         GEMMA-4 GARBAGE OUTPUT - FIX CHECKLIST                ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Your version: b8662 ❌  Latest: b8664+ ✅                     ║" -ForegroundColor Cyan
Write-Host "║  Missing critical fixes from last 48 hours                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 STEP-BY-STEP FIX:" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Download Latest llama-server (b8664+)" -ForegroundColor Yellow
Write-Host "  URL: https://github.com/ggml-org/llama.cpp/releases" -ForegroundColor Gray
Write-Host "  File: llama-b8664-bin-win-hip-radeon-x64.zip (or similar)" -ForegroundColor Gray
Write-Host "  Size: ~200-300 MB" -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL DOWNLOAD REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 2: Stop Current Server" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C in the llama-server terminal" -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL STEP REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 3: Backup Old Binary" -ForegroundColor Yellow
Write-Host "  Source: D:\Llama-Server-Exes\llama-b8662-bin-win-hip-radeon-x64\" -ForegroundColor Gray
Write-Host '  Run: Rename-Item -Path ".\llama-server.exe" -NewName "llama-server.exe.backup"' -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL STEP REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 4: Extract Latest Binary" -ForegroundColor Yellow
Write-Host "  Extract b8664 ZIP to: D:\Llama-Server-Exes\llama-b8664-bin-win-hip-radeon-x64\" -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL STEP REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 5: Update Launcher Script" -ForegroundColor Yellow
Write-Host "  File: scripts\launch-qwen3coder.ps1" -ForegroundColor Gray
Write-Host "  Change: Line 4 from b8662 to b8664" -ForegroundColor Gray
Write-Host "  From: D:\Llama-Server-Exes\llama-b8662-..." -ForegroundColor Gray
Write-Host "  To:   D:\Llama-Server-Exes\llama-b8664-..." -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL EDIT REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 6: Re-download gemma-4 Model (Optional but Recommended)" -ForegroundColor Yellow
Write-Host "  Delete: D:\Projects\LAILAI\dist-offline\...\gemma-4-31B-it-Q4_K_M.gguf" -ForegroundColor Gray
Write-Host "  Reason: File may be corrupted - force fresh download" -ForegroundColor Gray
Write-Host "  Status: ⏳ OPTIONAL STEP" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 7: Restart Server" -ForegroundColor Yellow
Write-Host "  PowerShell: .\scripts\launch-qwen3coder.ps1" -ForegroundColor Gray
Write-Host "  Expected: Server starts with b8664, loads gemma-4" -ForegroundColor Gray
Write-Host "  Status: ⏳ MANUAL STEP REQUIRED" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 8: Test Output" -ForegroundColor Yellow
Write-Host "  Terminal: cd scripts && node test-llamaserver.js" -ForegroundColor Gray
Write-Host "  Expected: Coherent text (NOT 'la la la' or 'L//')" -ForegroundColor Gray
Write-Host "  Status: ⏳ RUN AFTER RESTART" -ForegroundColor Yellow
Write-Host ""

Write-Host "═" * 64 -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WHY THIS FIXES IT:" -ForegroundColor Magenta
Write-Host "   • PR #21390: final_logit_softcapping support (4 hrs ago)" -ForegroundColor Gray
Write-Host "   • PR #21343: Tokenizer vocab fixes (yesterday)" -ForegroundColor Gray
Write-Host "   • PR #21326: Chat template fixes (2 days ago)" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 ALTERNATIVE: Switch to Qwen3-Coder (more stable)" -ForegroundColor Green
Write-Host "   Instead of fixing gemma-4, use the working Qwen3 model:" -ForegroundColor Gray
Write-Host "   Edit: scripts\launch-qwen3coder.ps1 line 6" -ForegroundColor Gray
Write-Host "   Uncomment the Qwen3 line" -ForegroundColor Gray
Write-Host ""

Write-Host "❓ STILL BROKEN?" -ForegroundColor Yellow
Write-Host "   1. Check if model file exists and is > 15GB" -ForegroundColor Gray
Write-Host "   2. Verify HIP/AMD GPU is being used (check startup logs)" -ForegroundColor Gray
Write-Host "   3. Check https://github.com/ggml-org/llama.cpp/issues for gemma-4 tag" -ForegroundColor Gray
Write-Host "   4. Use Qwen3 or Llama as fallback" -ForegroundColor Gray
Write-Host ""
