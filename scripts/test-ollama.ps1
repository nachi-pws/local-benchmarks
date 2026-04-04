param(
    [switch]$Stream = $false,
    [string]$Prompt = "List 5 best practices for REST APIs",
    [switch]$Warmup = $false
)

$streamValue = [bool]$Stream
$uri = "http://localhost:11434/api/generate"

# Warmup connection if requested (loads model into memory)
if ($Warmup) {
    Write-Host "🔥 Warming up connection..." -ForegroundColor Yellow
    $warmupBody = @{
        model   = "gemma4:26b"
        prompt  = "test"
        stream  = $true
    } | ConvertTo-Json -Compress
    
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -d $warmupBody | Out-Null
    
    Write-Host "✓ Ready" -ForegroundColor Green
    Start-Sleep -Milliseconds 500
}

$body = @{
    model   = "gemma4:26b"
    prompt  = $Prompt
    stream  = $streamValue
    options = @{ num_ctx = 2048 }
} | ConvertTo-Json -Depth 3 -Compress

Write-Host "🚀 Starting Ollama Test" -ForegroundColor Cyan
Write-Host "Mode       : $(if($streamValue){'STREAM'}else{'NON-STREAM'})"

$firstTokenTime = $null
$tokenCount = 0
$curlStartTime = $null

if ($streamValue) {
    Write-Host "`n=== LIVE STREAMING (curl) ===" -ForegroundColor Yellow
    Write-Host "(Waiting for first token...)" -ForegroundColor DarkGray

    $curlStartTime = Get-Date
    
    # Streaming mode - direct output, minimal parsing
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -H "Connection: keep-alive" `
        -d $body | ForEach-Object {
            if ($_ -and $_.Trim() -ne "") {
                $tokenCount++
                if ($null -eq $firstTokenTime) {
                    $firstTokenTime = Get-Date
                    $ttft = ($firstTokenTime - $curlStartTime).TotalSeconds
                    Write-Host "`n[First Token after $($ttft.ToString('F3'))s]" -ForegroundColor Magenta
                }
                # Minimal JSON parsing - only extract response field
                $json = $_ | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($json -and $json.response) {
                    Write-Host $json.response -ForegroundColor Gray -NoNewline
                }
            }
        }
    
    Write-Host ""
    $curlEndTime = Get-Date
}
else {
    # Non-stream mode
    $curlStartTime = Get-Date
    $response = curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -H "Connection: keep-alive" `
        -d $body
    $curlEndTime = Get-Date
    
    Write-Host "`n=== NON-STREAM RESPONSE ===" -ForegroundColor Yellow
    $lastLine = ($response | Where-Object { $_.Trim() } | Select-Object -Last 1) | ConvertFrom-Json
    Write-Host "API Load Duration : $($lastLine.load_duration / 1e9) seconds" -ForegroundColor Yellow
    Write-Host "API Generation    : $($lastLine.eval_duration / 1e9) seconds" -ForegroundColor Yellow
    Write-Host "Total API Time    : $(($lastLine.load_duration + $lastLine.eval_duration) / 1e9) seconds" -ForegroundColor Cyan
    Write-Host "Response (first 200 chars): $($lastLine.response.Substring(0, [Math]::Min(200, $lastLine.response.Length)))" -ForegroundColor Green
}

Write-Host "`n=================================" -ForegroundColor Green
$duration = ($curlEndTime - $curlStartTime).TotalSeconds
Write-Host "curl Duration     : $($duration.ToString('F3')) seconds" -ForegroundColor Green
if ($firstTokenTime) {
    Write-Host "Time to First Token : $(($firstTokenTime - $curlStartTime).TotalSeconds.ToString('F3')) seconds" -ForegroundColor Magenta
}
Write-Host "Tokens Received   : $tokenCount" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Green