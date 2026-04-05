#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Launch GGUF models with llama-server with interactive model and version selection.
.DESCRIPTION
    This script reads launchConfig.json to load model configurations and server settings.
    Allows interactive selection of models and llama-server versions with graceful shutdown.
.EXAMPLE
    .\launch-gguf.ps1
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration
$ConfigPath = Join-Path $PSScriptRoot "launchConfig.json"
$GlobalServerStatus = @{
    ProcessId = $null
    ProcessObject = $null
    Running = $false
}

# ============================================================================
# CONFIGURATION LOADING
# ============================================================================

function Load-Configuration {
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "[ERROR] launchConfig.json not found at $ConfigPath" -ForegroundColor Red
        exit 1
    }
    
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        Write-Host "[OK] Configuration loaded" -ForegroundColor Green
        return $config
    }
    catch {
        Write-Host "[ERROR] Failed to parse launchConfig.json: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# USER INTERACTION & SELECTION
# ============================================================================

function Show-ModelSelection {
    param([object]$Config)
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                     SELECT MODEL                           ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($model in $Config.models) {
        $status = ""
        if ($model.description -match "(RECOMMENDED)") {
            $status = " ⭐ RECOMMENDED"
        }
        Write-Host "  [$($model.id)] $($model.name)$status" -ForegroundColor Yellow
        Write-Host "      └─ $($model.description)" -ForegroundColor Gray
    }
    
    Write-Host ""
    $selection = Read-Host "Enter model number (1-$($Config.models.Count))"
    
    if ([int]::TryParse($selection, [ref]$null) -and $selection -ge 1 -and $selection -le $Config.models.Count) {
        return $Config.models[$selection - 1]
    }
    else {
        Write-Host "[ERROR] Invalid selection" -ForegroundColor Red
        return $null
    }
}

function Show-VersionSelection {
    param([object]$Config)
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                SELECT LLAMA-SERVER VERSION                 ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $versions = $Config.llamaServerVersions.available
    $versionList = @()
    $index = 1
    
    foreach ($key in $versions.Keys) {
        $version = $versions[$key]
        $isDefault = if ($key -eq $Config.llamaServerVersions.default) { " (DEFAULT)" } else { "" }
        Write-Host "  [$index] $($version.label)$isDefault" -ForegroundColor Yellow
        $versionList += $key
        $index++
    }
    
    Write-Host ""
    $selection = Read-Host "Enter version number (1-$($versionList.Count)) or press Enter for default"
    
    if ([string]::IsNullOrWhiteSpace($selection)) {
        return $Config.llamaServerVersions.default
    }
    
    if ([int]::TryParse($selection, [ref]$null) -and $selection -ge 1 -and $selection -le $versionList.Count) {
        return $versionList[$selection - 1]
    }
    else {
        Write-Host "[WARNING] Invalid selection, using default" -ForegroundColor Yellow
        return $Config.llamaServerVersions.default
    }
}

# ============================================================================
# SERVER VALIDATION
# ============================================================================

function Test-ServerRunning {
    param(
        [string]$ServerHost,
        [int]$ServerPort,
        [string]$HealthEndpoint,
        [int]$TimeoutMs
    )
    
    try {
        $TimeoutSec = [math]::Max(1, [math]::Ceiling($TimeoutMs / 1000))
        $response = Invoke-WebRequest -Uri "http://${ServerHost}:${ServerPort}${HealthEndpoint}" `
            -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Test-PathsExist {
    param(
        [string]$LlamaServerPath,
        [string]$ModelPath
    )
    
    $errors = @()
    
    if (-not (Test-Path $LlamaServerPath)) {
        $errors += "llama-server.exe not found: $LlamaServerPath"
    }
    
    if (-not (Test-Path $ModelPath)) {
        $errors += "GGUF model not found: $ModelPath"
    }
    
    return $errors
}

# ============================================================================
# PARAMETER DISPLAY
# ============================================================================

function Display-ModelParameters {
    param(
        [object]$Model,
        [string]$LlamaServerVersion,
        [string]$LlamaServerPath
    )
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║            STARTUP CONFIGURATION SUMMARY                   ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "MODEL INFORMATION:" -ForegroundColor Green
    Write-Host "  Name:        $($Model.name)" -ForegroundColor White
    Write-Host "  Description: $($Model.description)" -ForegroundColor Gray
    Write-Host "  File:        $($Model.filename)" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "SERVER CONFIGURATION:" -ForegroundColor Green
    Write-Host "  Version:     Build $LlamaServerVersion" -ForegroundColor White
    Write-Host "  Path:        $LlamaServerPath" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "INFERENCE PARAMETERS:" -ForegroundColor Green
    Write-Host "  Temperature:    $($Model.parameters.temperature)" -ForegroundColor White
    Write-Host "  Top-P:          $($Model.parameters.top_p)" -ForegroundColor White
    Write-Host "  Min-P:          $($Model.parameters.min_p)" -ForegroundColor White
    Write-Host "  Repeat Penalty: $($Model.parameters.repeat_penalty)" -ForegroundColor White
    Write-Host "  Top-K:          $($Model.parameters.top_k)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "CONTEXT & PERFORMANCE:" -ForegroundColor Green
    Write-Host "  Context Size:   $($Model.parameters.ctx_size)" -ForegroundColor White
    Write-Host "  Max Tokens:     $($Model.parameters.n_predict)" -ForegroundColor White
    Write-Host "  Threads:        $($Model.parameters.n_threads)" -ForegroundColor White
    Write-Host "  GPU Layers:     $($Model.parameters.n_gpu_layers)" -ForegroundColor White
    
    if ($Model.parameters.flash_attn) {
        Write-Host "  Flash Attention: Enabled" -ForegroundColor White
    }
    
    Write-Host ""
}

# ============================================================================
# SERVER STARTUP
# ============================================================================

function Start-LlamaServer {
    param(
        [string]$LlamaServerPath,
        [string]$ModelPath,
        [object]$Parameters,
        [string]$Host,
        [int]$Port
    )
    
    Write-Host "[START] Launching llama-server..." -ForegroundColor Green
    Write-Host "This will load the large model file - please wait..." -ForegroundColor Yellow
    
    $arguments = @(
        "-m", $ModelPath,
        "--host", $Host,
        "--port", $Port,
        "-c", $Parameters.ctx_size,
        "-n", $Parameters.n_predict,
        "-t", $Parameters.n_threads,
        "-ngl", $Parameters.n_gpu_layers,
        "--temp", $Parameters.temperature,
        "--top-p", $Parameters.top_p,
        "--min-p", $Parameters.min_p,
        "--repeat-penalty", $Parameters.repeat_penalty,
        "--top-k", $Parameters.top_k
    )
    
    if ($Parameters.flash_attn) {
        $arguments += "--flash-attn"
    }
    
    try {
        $process = Start-Process -FilePath $LlamaServerPath -ArgumentList $arguments `
            -NoNewWindow -PassThru -ErrorAction Stop
        
        Write-Host "[OK] Process started (PID: $($process.Id))" -ForegroundColor Green
        $GlobalServerStatus.ProcessId = $process.Id
        $GlobalServerStatus.ProcessObject = $process
        
        Start-Sleep -Milliseconds 500
        if ($process.HasExited) {
            Write-Host "[ERROR] Process exited immediately (possible crash)" -ForegroundColor Red
            return $null
        }
        
        return $process
    }
    catch {
        Write-Host "[ERROR] Failed to start process: $_" -ForegroundColor Red
        return $null
    }
}

# ============================================================================
# SERVER READINESS WAITING
# ============================================================================

function Wait-ServerReady {
    param(
        [object]$Config,
        [object]$Process
    )
    
    $serverHost = $Config.server.host
    $serverPort = $Config.server.port
    $healthEndpoint = $Config.server.health_check_endpoint
    $timeoutMs = $Config.server.health_check_timeout_ms
    $startupDelayMs = $Config.server.startup_delay_ms
    $maxAttempts = $Config.server.max_wait_attempts
    $attemptIntervalMs = $Config.server.attempt_interval_ms
    
    Write-Host "[WAIT] Loading model into memory (this can take 3-5+ minutes)..." -ForegroundColor Cyan
    Write-Host "  Waiting $($startupDelayMs / 1000) seconds for server initialization..." -ForegroundColor Gray
    
    $remainingMs = $startupDelayMs
    while ($remainingMs -gt 0) {
        $sleepMs = [math]::Min(1000, $remainingMs)
        Start-Sleep -Milliseconds $sleepMs
        $remainingMs -= $sleepMs
    }
    
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        if (Test-ServerRunning -ServerHost $serverHost -ServerPort $serverPort `
            -HealthEndpoint $healthEndpoint -TimeoutMs $timeoutMs) {
            Write-Host "[READY] Server is ready!" -ForegroundColor Green
            $GlobalServerStatus.Running = $true
            return $true
        }
        
        $attempt++
        $elapsedSeconds = ($startupDelayMs / 1000) + ($attempt * ($attemptIntervalMs / 1000))
        Write-Host "  Attempt $attempt/$maxAttempts (elapsed: $($elapsedSeconds)s)..." -ForegroundColor Gray
        Start-Sleep -Milliseconds $attemptIntervalMs
    }
    
    Write-Host "[FAIL] Server did not respond after ~$([math]::Round($elapsedSeconds)) seconds" -ForegroundColor Red
    return $false
}

# ============================================================================
# GRACEFUL SHUTDOWN
# ============================================================================

function Stop-LlamaServerGracefully {
    if ($GlobalServerStatus.ProcessId -eq $null -or -not (Test-Path "Proc:\$($GlobalServerStatus.ProcessId)")) {
        Write-Host "[INFO] Server is not running" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "[STOP] Shutting down llama-server (PID: $($GlobalServerStatus.ProcessId))..." -ForegroundColor Yellow
    
    try {
        $process = Get-Process -Id $GlobalServerStatus.ProcessId -ErrorAction Stop
        
        # Send SIGTERM first (graceful shutdown)
        Stop-Process -Id $GlobalServerStatus.ProcessId -ErrorAction Stop
        
        # Wait up to 10 seconds for graceful shutdown
        $waited = 0
        while ($waited -lt 10 -and -not $process.HasExited) {
            Start-Sleep -Milliseconds 500
            $waited += 0.5
            try {
                $process.Refresh()
            }
            catch {
                break
            }
        }
        
        # Force kill if still running
        if (-not $process.HasExited) {
            Write-Host "[WARN] Graceful shutdown timeout, force terminating..." -ForegroundColor Yellow
            Stop-Process -Id $GlobalServerStatus.ProcessId -Force -ErrorAction Stop
        }
        
        Write-Host "[OK] Server stopped successfully" -ForegroundColor Green
        $GlobalServerStatus.Running = $false
    }
    catch {
        Write-Host "[WARN] Error during shutdown: $_" -ForegroundColor Yellow
    }
}

# ============================================================================
# CTRL+C SIGNAL HANDLING
# ============================================================================

function Enable-GracefulShutdown {
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        Stop-LlamaServerGracefully
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                  GGUF MODEL LAUNCHER                       ║" -ForegroundColor Magenta
    Write-Host "║              Powered by llama.cpp & llama-server           ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    # Load configuration
    $config = Load-Configuration
    
    # Model selection
    $selectedModel = Show-ModelSelection -Config $config
    if ($selectedModel -eq $null) {
        exit 1
    }
    
    # Version selection
    $selectedVersion = Show-VersionSelection -Config $config
    $versionConfig = $config.llamaServerVersions.available[$selectedVersion]
    $llamaServerPath = $versionConfig.path
    
    # Validate paths
    $pathErrors = Test-PathsExist -LlamaServerPath $llamaServerPath -ModelPath $selectedModel.path
    if ($pathErrors.Count -gt 0) {
        Write-Host ""
        Write-Host "[ERROR] Path validation failed:" -ForegroundColor Red
        foreach ($error in $pathErrors) {
            Write-Host "  ✗ $error" -ForegroundColor Red
        }
        exit 1
    }
    
    # Display configuration
    Display-ModelParameters -Model $selectedModel -LlamaServerVersion $selectedVersion -LlamaServerPath $llamaServerPath
    
    # Check if server already running
    Write-Host "Checking if llama-server is already running..." -ForegroundColor Cyan
    if (Test-ServerRunning -ServerHost $config.server.host -ServerPort $config.server.port `
        -HealthEndpoint $config.server.health_check_endpoint -TimeoutMs 2000) {
        Write-Host "[OK] Server already running on port $($config.server.port)" -ForegroundColor Green
        Write-Host "     Skipping startup (server is ready)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "API Endpoint: http://$($config.server.host):$($config.server.port)/completion" -ForegroundColor Cyan
        Write-Host ""
        $GlobalServerStatus.Running = $true
    }
    else {
        Write-Host "[INFO] No existing instance found, starting new server..." -ForegroundColor Yellow
        
        # Start server
        $process = Start-LlamaServer -LlamaServerPath $llamaServerPath `
            -ModelPath $selectedModel.path `
            -Parameters $selectedModel.parameters `
            -Host $config.server.host `
            -Port $config.server.port
        
        if ($process -eq $null) {
            Write-Host "[FAIL] Could not start llama-server" -ForegroundColor Red
            exit 1
        }
        
        # Wait for readiness
        if (-not (Wait-ServerReady -Config $config -Process $process)) {
            Write-Host "[STOP] Terminating failed server process..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            exit 1
        }
    }
    
    # Server is running
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║               SERVER RUNNING SUCCESSFULLY                  ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Model:        $($selectedModel.name)" -ForegroundColor Green
    Write-Host "API Endpoint: http://$($config.server.host):$($config.server.port)/completion" -ForegroundColor Green
    Write-Host "PID:          $($GlobalServerStatus.ProcessId)" -ForegroundColor Green
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  Press Ctrl+C to gracefully shutdown the server           ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    # Enable graceful shutdown handling
    Enable-GracefulShutdown
    
    # Wait for server process to exit or Ctrl+C
    if ($GlobalServerStatus.ProcessObject -ne $null) {
        try {
            $GlobalServerStatus.ProcessObject.WaitForExit()
        }
        catch {
            # Process already exited
        }
    }
    else {
        # Server was already running, wait for Ctrl+C
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
}

# Run main
Main
