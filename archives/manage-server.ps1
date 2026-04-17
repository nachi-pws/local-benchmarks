#!/usr/bin/env pwsh
# Llama-Server Management Utility
# Provides simple commands to start, stop, and check llama-server status

param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'start', 'stop', 'restart', 'config')]
    [string]$Command = 'status',
    
    [Parameter()]
    [string]$Model = 'qwen'
)

$ScriptDir = $PSScriptRoot
$LaunchConfigPath = Join-Path $ScriptDir "launchConfig.json"
$LaunchScriptQwen = Join-Path $ScriptDir "launch-qwen3coder.ps1"
$LaunchScriptGeneric = Join-Path $ScriptDir "launch-gguf.ps1"

# Helper function to check server status
function Test-LlamaServer {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/props" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Get server info
function Get-ServerInfo {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/props" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        return $data
    }
    catch {
        return $null
    }
}

# Display status
function Show-Status {
    Write-Host "`n" -NoNewline
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "          LLAMA-SERVER STATUS" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $isRunning = Test-LlamaServer
    
    if ($isRunning) {
        Write-Host "✅ Status          : RUNNING" -ForegroundColor Green
        
        $info = Get-ServerInfo
        if ($info) {
            $modelName = $info.model_alias ?? $info.model_path ?? "Unknown"
            Write-Host "📦 Loaded Model    : $modelName" -ForegroundColor White
            if ($info.built_with_cuda) {
                Write-Host "🎮 GPU Backend     : CUDA" -ForegroundColor Cyan
            }
            elseif ($info.built_with_vulkan) {
                Write-Host "🎮 GPU Backend     : Vulkan" -ForegroundColor Cyan
            }
            else {
                Write-Host "🎮 GPU Backend     : CPU only" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "❌ Status          : NOT RUNNING" -ForegroundColor Red
        Write-Host "`n💡 To start:       pwsh $LaunchScriptQwen" -ForegroundColor Yellow
    }
    
    Write-Host "🔗 Server URL      : http://localhost:8000" -ForegroundColor Gray
    Write-Host "💾 Config File     : $LaunchConfigPath" -ForegroundColor Gray
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# Start server
function Start-Server {
    param([string]$LaunchScript)
    
    if (Test-LlamaServer) {
        Write-Host "✅ Server is already running!" -ForegroundColor Green
        return
    }
    
    if (-not (Test-Path $LaunchScript)) {
        Write-Host "❌ Launch script not found: $LaunchScript" -ForegroundColor Red
        return
    }
    
    Write-Host "🚀 Starting llama-server..." -ForegroundColor Yellow
    & $LaunchScript
}

# Stop server (kill process)
function Stop-Server {
    Write-Host "⏹️  Stopping llama-server..." -ForegroundColor Yellow
    
    $processes = Get-Process -Name "llama-server" -ErrorAction SilentlyContinue
    if ($processes) {
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        
        if (Test-LlamaServer) {
            Write-Host "⚠️  Server still running, trying harder..." -ForegroundColor Yellow
            Get-Process -Name "llama-server" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ Server stopped" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  No llama-server processes found" -ForegroundColor Gray
    }
}

# Show configuration
function Show-Config {
    Write-Host "`n" -NoNewline
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "          CONFIGURATION" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (-not (Test-Path $LaunchConfigPath)) {
        Write-Host "❌ Config not found: $LaunchConfigPath" -ForegroundColor Red
        return
    }
    
    $config = Get-Content $LaunchConfigPath -Raw | ConvertFrom-Json
    
    Write-Host "`n📋 Available Models:" -ForegroundColor Green
    $config.models | ForEach-Object {
        Write-Host "  [$($_.id)] $($_.name)" -ForegroundColor White
        Write-Host "     Path: $($_.path)" -ForegroundColor Gray
        Write-Host "     Params: temp=$($_.parameters.temperature), top_k=$($_.parameters.top_k)" -ForegroundColor Gray
    }
    
    Write-Host "`n📦 Available Versions:" -ForegroundColor Green
    $config.llamaServerVersions.available.PSObject.Properties | ForEach-Object {
        $isDefault = if ($_.Name -eq $config.llamaServerVersions.default) { " (DEFAULT)" } else { "" }
        Write-Host "  $($_.Name)$isDefault" -ForegroundColor White
        Write-Host "     Path: $($_.Value.path)" -ForegroundColor Gray
    }
    
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution
switch ($Command) {
    'status' {
        Show-Status
    }
    'start' {
        if ($Model -eq 'qwen') {
            Start-Server $LaunchScriptQwen
        }
        else {
            Start-Server $LaunchScriptGeneric
        }
    }
    'stop' {
        Stop-Server
    }
    'restart' {
        Write-Host "🔄 Restarting llama-server..." -ForegroundColor Yellow
        Stop-Server
        Start-Sleep -Seconds 2
        if ($Model -eq 'qwen') {
            Start-Server $LaunchScriptQwen
        }
        else {
            Start-Server $LaunchScriptGeneric
        }
    }
    'config' {
        Show-Config
    }
}

Write-Host ""
