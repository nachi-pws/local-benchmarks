#!/usr/bin/env pwsh
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$LLAMA_SERVER_PATH = "D:\Llama-Server-Exes\llama-b8662-bin-win-hip-radeon-x64\llama-server.exe"
$GGUF_MODEL_PATH = "D:\Projects\LAILAI\dist-offline\win-unpacked\resources\backend\models\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
$SERVER_HOST = "127.0.0.1"
$SERVER_PORT = 8000
$API_HEALTH_URL = "http://$SERVER_HOST:8000/health"

function Test-ServerRunning {
    try {
        $response = Invoke-WebRequest -Uri $API_HEALTH_URL -Method GET -TimeoutSec 2 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Display-Parameters {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  LLAMA-SERVER LAUNCH CONFIGURATION" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Server: $LLAMA_SERVER_PATH" -ForegroundColor Yellow
    Write-Host "Model:  $GGUF_MODEL_PATH" -ForegroundColor Yellow
    Write-Host ""
}

function Start-LlamaServer {
    Write-Host "Starting llama-server..." -ForegroundColor Green
    
    $arguments = @(
        "-m", $GGUF_MODEL_PATH,
        "--host", $SERVER_HOST,
        "--port", $SERVER_PORT,
        "-c", 2048,
        "-n", 256,
        "-t", 16,
        "-ngl", 99
    )
    
    $process = Start-Process -FilePath $LLAMA_SERVER_PATH -ArgumentList $arguments -NoNewWindow -PassThru
    Write-Host "Started successfully (PID: $($process.Id))" -ForegroundColor Green
    return $process
}

function Wait-ServerReady {
    $attempt = 0
    while ($attempt -lt 30) {
        try {
            $response = Invoke-WebRequest -Uri $API_HEALTH_URL -Method GET -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "Server is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # waiting
        }
        $attempt++
        Write-Host "  Attempt $attempt/30..." -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    Write-Host "Server failed to start" -ForegroundColor Red
    return $false
}

function Main {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "     QWEN3 CODER LLAMA-SERVER LAUNCHER" -ForegroundColor Magenta
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "Checking if llama-server is running..." -ForegroundColor Cyan
    
    if (Test-ServerRunning) {
        Write-Host "Server is already running on port $SERVER_PORT" -ForegroundColor Green
        return
    }
    
    Write-Host "No instance found. Verifying paths..." -ForegroundColor Yellow
    
    if (-not (Test-Path $LLAMA_SERVER_PATH)) {
        Write-Host "ERROR: llama-server.exe not found" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path $GGUF_MODEL_PATH)) {
        Write-Host "ERROR: GGUF model not found" -ForegroundColor Red
        return
    }
    
    Write-Host "Paths verified. Starting server..." -ForegroundColor Green
    Write-Host ""
    
    Display-Parameters
    
    $process = Start-LlamaServer
    
    if (-not (Wait-ServerReady)) {
        Stop-Process -Id $process.Id -Force
        return
    }
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "     SERVER RUNNING SUCCESSFULLY" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "Process ID: $($process.Id)" -ForegroundColor Green
    Write-Host "API: http://$SERVER_HOST:8000/api/generate" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
    Write-Host ""
    
    $process.WaitForExit()
}

Main
