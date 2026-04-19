#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run compare-all-models-next.js across all prompts and generate consolidated report.
.DESCRIPTION
    Loops through all prompts (IDs 1-5) from promptConfig.json, running the benchmark
    for each prompt sequentially, then runs report-generator.js to consolidate results.
    All output is logged to a file with timestamp.
.EXAMPLE
    .\run-all-benchmarks.ps1
#>

param(
    [int]$StartPrompt = 1,
    [int]$StartCombination = 1
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create log file with datetime format
$now = Get-Date
$logFilename = "run-all-benchmarks-{0:yyyy-MM-ddTHH-mm-ss}.log" -f $now
$logFilePath = Join-Path $scriptDir $logFilename

# Function to write to both console and log file
function Write-Log {
    param([string]$Message, [string]$Type = "Info")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Type -eq "Error") {
        Write-Host $Message -ForegroundColor Red
    } elseif ($Type -eq "Warning") {
        Write-Host $Message -ForegroundColor Yellow
    } else {
        Write-Host $Message
    }
    
    # Append to log file
    Add-Content -Path $logFilePath -Value $Message
}

Write-Log "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Log "║                    RUNNING ALL BENCHMARK PROMPTS                             ║"
Write-Log "╚═══════════════════════════════════════════════════════════════════════════════╝`n"

# Load promptConfig to get actual prompt count
$promptConfigPath = Join-Path $scriptDir "promptConfig.json"
$promptConfig = Get-Content $promptConfigPath | ConvertFrom-Json
$promptCount = $promptConfig.prompts.Count

Write-Log "📋 Configuration:"
Write-Log "   - Total prompts: $promptCount"
Write-Log "   - Starting prompt: $StartPrompt"
if ($StartCombination -gt 1) {
    Write-Log "   - Resume from combination: $StartCombination"
}
Write-Log "   - Log file: $logFilePath"
Write-Log ""

# Track timing
$benchmarkStartTime = Get-Date

# Run benchmarks for each prompt
for ($promptId = $StartPrompt; $promptId -le $promptCount; $promptId++) {
    $promptName = $promptConfig.prompts[$promptId - 1].name
    $promptTime = Get-Date
    
    Write-Log "╔═══════════════════════════════════════════════════════════════════════════════╗"
    Write-Log "║ Prompt $promptId/$promptCount: $promptName"
    Write-Log "╚═══════════════════════════════════════════════════════════════════════════════╝`n"
    
    # Build command
    $cmdArgs = @("compare-all-models-next.js", "--prompt=$promptId", "--no-wait")
    
    # Add start combination for first prompt
    if ($promptId -eq $StartPrompt -and $StartCombination -gt 1) {
        $cmdArgs += "--start=$StartCombination"
    }
    
    Write-Log "▶️  Running: node $($cmdArgs -join ' ')`n"
    
    # Run benchmark and capture output
    $output = & node @cmdArgs 2>&1
    $output | ForEach-Object { Add-Content -Path $logFilePath -Value $_ }
    Write-Host $output
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Prompt $promptId failed with exit code $LASTEXITCODE" -Type "Error"
        exit 1
    }
    
    $promptDuration = (Get-Date) - $promptTime
    Write-Log "`n✅ Prompt $promptId completed in $($promptDuration.TotalMinutes.ToString('F2')) minutes`n"
}

# Calculate total benchmark time
$totalDuration = (Get-Date) - $benchmarkStartTime

Write-Log "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Log "║ ALL PROMPTS COMPLETED"
Write-Log "║ Total time: $($totalDuration.TotalMinutes.ToString('F2')) minutes"
Write-Log "╚═══════════════════════════════════════════════════════════════════════════════╝`n"

# Generate consolidated report
Write-Log "▶️  Generating consolidated report..."
Write-Log ""

$output = & node report-generator.js 2>&1
$output | ForEach-Object { Add-Content -Path $logFilePath -Value $_ }
Write-Host $output

if ($LASTEXITCODE -ne 0) {
    Write-Log "❌ Report generation failed with exit code $LASTEXITCODE" -Type "Error"
    exit 1
}

Write-Log "`n╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Log "║ ✅ BENCHMARK SUITE COMPLETE"
Write-Log "║ All prompts tested and report generated successfully!"
Write-Log "║ Log file: $logFilePath"
Write-Log "╚═══════════════════════════════════════════════════════════════════════════════╝`n"
