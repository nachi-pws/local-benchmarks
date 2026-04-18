#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run compare-all-models-next.js across all prompts and generate consolidated report.
.DESCRIPTION
    Loops through all prompts (IDs 1-5) from promptConfig.json, running the benchmark
    for each prompt sequentially, then runs report-generator.js to consolidate results.
.EXAMPLE
    .\run-all-benchmarks.ps1
#>

param(
    [int]$StartPrompt = 1,
    [int]$StartCombination = 1
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║                    RUNNING ALL BENCHMARK PROMPTS                             ║"
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝`n"

# Load promptConfig to get actual prompt count
$promptConfigPath = Join-Path $scriptDir "promptConfig.json"
$promptConfig = Get-Content $promptConfigPath | ConvertFrom-Json
$promptCount = $promptConfig.prompts.Count

Write-Host "📋 Configuration:"
Write-Host "   - Total prompts: $promptCount"
Write-Host "   - Starting prompt: $StartPrompt"
if ($StartCombination -gt 1) {
    Write-Host "   - Resume from combination: $StartCombination"
}
Write-Host ""

# Track timing
$benchmarkStartTime = Get-Date

# Run benchmarks for each prompt
for ($promptId = $StartPrompt; $promptId -le $promptCount; $promptId++) {
    $promptName = $promptConfig.prompts[$promptId - 1].name
    $promptTime = Get-Date
    
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗"
    Write-Host "║ Prompt $promptId/$promptCount: $promptName"
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝`n"
    
    # Build command
    $cmdArgs = @("compare-all-models-next.js", "--prompt=$promptId", "--no-wait")
    
    # Add start combination for first prompt
    if ($promptId -eq $StartPrompt -and $StartCombination -gt 1) {
        $cmdArgs += "--start=$StartCombination"
    }
    
    Write-Host "▶️  Running: node $($cmdArgs -join ' ')`n"
    
    # Run benchmark
    & node @cmdArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Prompt $promptId failed with exit code $LASTEXITCODE"
        exit 1
    }
    
    $promptDuration = (Get-Date) - $promptTime
    Write-Host "`n✅ Prompt $promptId completed in $($promptDuration.TotalMinutes.ToString('F2')) minutes`n"
}

# Calculate total benchmark time
$totalDuration = (Get-Date) - $benchmarkStartTime

Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║ ALL PROMPTS COMPLETED"
Write-Host "║ Total time: $($totalDuration.TotalMinutes.ToString('F2')) minutes"
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝`n"

# Generate consolidated report
Write-Host "▶️  Generating consolidated report..."
Write-Host ""

& node report-generator.js

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Report generation failed with exit code $LASTEXITCODE"
    exit 1
}

Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║ ✅ BENCHMARK SUITE COMPLETE"
Write-Host "║ All prompts tested and report generated successfully!"
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝`n"
