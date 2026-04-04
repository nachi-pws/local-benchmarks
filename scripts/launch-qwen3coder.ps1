#!/usr/bin/env pwsh
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$LLAMA_SERVER_PATH = "D:\Llama-Server-Exes\llama-b8662-bin-win-hip-radeon-x64\llama-server.exe"
$GGUF_MODEL_PATH = "D:\Projects\LAILAI\dist-offline\win-unpacked\resources\backend\models\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
#$GGUF_MODEL_PATH = "D:\Projects\LAILAI\dist-offline\win-unpacked\resources\backend\models\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
$SERVER_HOST = "127.0.0.1"
$SERVER_PORT = 8000
$API_HEALTH_URL = "http://$SERVER_HOST:8000/health"

function Test-ServerRunning {
    try {
        # Use /slots endpoint which is more reliable than /health
        $response = Invoke-WebRequest -Uri "http://${SERVER_HOST}:${SERVER_PORT}/slots" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
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
    Write-Host "[START] llama-server..." -ForegroundColor Green
    Write-Host "This will load the large model file - please wait..." -ForegroundColor Yellow
    
    $arguments = @(
        "-m", $GGUF_MODEL_PATH,
        "--host", $SERVER_HOST,
        "--port", $SERVER_PORT,
        "-c", 2048,
        "-n", 256,
        "-t", 16,
        "-ngl", 99
    )
    
    $process = Start-Process -FilePath $LLAMA_SERVER_PATH -ArgumentList $arguments -NoNewWindow -PassThru -ErrorAction Stop
    Write-Host "[OK] Process started (PID: $($process.Id))" -ForegroundColor Green
    
    Start-Sleep -Milliseconds 500
    if ($process.HasExited) {
        Write-Host "[ERROR] Process exited immediately (crashed)" -ForegroundColor Red
        return $null
    }
    
    Write-Host "[WAIT] Loading model into memory (this can take 3-5+ minutes)..." -ForegroundColor Cyan
    return $process
}

function Wait-ServerReady {
    $attempt = 0
    $maxAttempts = 180  # Increased from 60 to 180 (6 minutes total instead of 2 minutes)
    $slotsUrl = "http://${SERVER_HOST}:${SERVER_PORT}/slots"
    
    Write-Host "  Waiting 30 seconds for server initialization..." -ForegroundColor Gray
    Write-Host "  (Loading large 30B model - this takes time)" -ForegroundColor Gray
    Start-Sleep -Seconds 30
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $slotsUrl -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "[READY] Server is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # waiting
        }
        $attempt++
        $elapsedSeconds = 30 + ($attempt * 2)
        Write-Host "  Attempt $attempt/$maxAttempts (elapsed: ${elapsedSeconds}s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    Write-Host "[FAIL] Server did not respond after $($30 + ($maxAttempts * 2)) seconds" -ForegroundColor Red
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
        Write-Host "[OK] Server already running on port $SERVER_PORT" -ForegroundColor Green
        return
    }
    
    Write-Host "[INFO] No existing instance found" -ForegroundColor Yellow
    
    Write-Host "Verifying paths..." -ForegroundColor Cyan
    
    if (-not (Test-Path $LLAMA_SERVER_PATH)) {
        Write-Host "[ERROR] llama-server.exe not found" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path $GGUF_MODEL_PATH)) {
        Write-Host "[ERROR] GGUF model not found" -ForegroundColor Red
        return
    }
    
    Write-Host "[OK] Paths verified" -ForegroundColor Green
    Write-Host ""
    
    Display-Parameters
    
    $process = Start-LlamaServer
    
    if ($null -eq $process) {
        Write-Host "[FAIL] Could not start llama-server process" -ForegroundColor Red
        return
    }
    
    if (-not (Wait-ServerReady)) {
        Write-Host "[STOP] Terminating failed server process..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
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
