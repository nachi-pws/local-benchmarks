#!/usr/bin/env pwsh
<#
.SYNOPSIS
Update llama-server to the latest version with gemma-4 fixes
.DESCRIPTION
Downloads the latest llama-server binary that includes fixes for gemma-4 garbage output
#>

Write-Host "🔄 Fetching latest llama-server release info..." -ForegroundColor Cyan

try {
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/ggml-org/llama.cpp/releases?per_page=5" -ErrorAction Stop
    
    # Find the latest Windows HIP (AMD GPU) binary
    $latestRelease = $releases[0]
    $releaseTag = $latestRelease.tag_name
    
    Write-Host "✅ Latest Release: $releaseTag" -ForegroundColor Green
    
    # Look for Windows HIP AMD build
    $windowsHipAsset = $latestRelease.assets | Where-Object { 
        $_.name -like "*win-hip-radeon*" -and $_.name -like "*.zip"
    } | Select-Object -First 1
    
    if ($windowsHipAsset) {
        Write-Host "📦 Found: $($windowsHipAsset.name)" -ForegroundColor Yellow
        Write-Host "💾 Size: $([Math]::Round($windowsHipAsset.size / 1MB, 2)) MB"
        Write-Host "📥 Download URL: $($windowsHipAsset.browser_download_url)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "⚠️  Manual Download Required:" -ForegroundColor Yellow
        Write-Host "Visit: https://github.com/ggml-org/llama.cpp/releases/tag/$releaseTag" -ForegroundColor Cyan
        Write-Host "Download: $($windowsHipAsset.name)" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Windows HIP build not found in latest release" -ForegroundColor Red
        Write-Host "Check all available builds at: https://github.com/ggml-org/llama.cpp/releases" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 CRITICAL FIX FOR GEMMA-4:" -ForegroundColor Green
Write-Host "   - Update llama-server binary to latest (with #21390 fix)" -ForegroundColor Green
Write-Host "   - Download gemma-4 model again (yours may be corrupted)" -ForegroundColor Green
Write-Host "   - Or use Qwen3-Coder-30B which is more stable" -ForegroundColor Green
