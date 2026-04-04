param(
    [switch]$Stream = $false,
    [string]$Prompt = "List 5 best practices for REST APIs",
    [switch]$Warmup = $false,
    [ValidateSet('GPU', 'CPU', 'NPU', 'Auto')]
    [string]$Device = 'Auto'
)

$streamValue = [bool]$Stream
$uri = "http://localhost:11434/api/generate"

# Optimized options for high-performance hardware (128GB RAM, GPU/CPU/NPU)
$options = @{
    num_ctx      = 2048              # Optimized context for fast TTFT
    num_batch    = 512               # High batch size for GPU efficiency
    num_thread   = [Environment]::ProcessorCount  # Use all CPU cores
    num_gpu      = 999               # Use all GPU layers
    top_k        = 40                # Better quality sampling
    top_p        = 0.9
    temperature  = 0.7
}

# Add device-specific optimizations
switch ($Device) {
    'GPU' {
        $options['num_gpu'] = 999  # All layers on GPU
        Write-Host "📊 Mode: GPU Acceleration (All layers)" -ForegroundColor Cyan
    }
    'NPU' {
        # NPU typically handled automatically by Ollama
        Write-Host "📊 Mode: NPU Acceleration (if available)" -ForegroundColor Cyan
    }
    'CPU' {
        $options['num_gpu'] = 0     # CPU only
        Write-Host "📊 Mode: CPU (no GPU)" -ForegroundColor Cyan
    }
    'Auto' {
        Write-Host "📊 Mode: Auto (let Ollama decide)" -ForegroundColor Cyan
    }
}

# Warmup connection if requested (loads model into memory)
if ($Warmup) {
    Write-Host "🔥 Warming up connection..." -ForegroundColor Yellow
    $warmupBody = @{
        model   = "gemma4:26b"
        prompt  = "x"
        stream  = $true
        options = @{ num_ctx = 2048; num_batch = 512 }
    } | ConvertTo-Json -Compress
    
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -H "Connection: keep-alive" `
        -d $warmupBody | Out-Null
    
    Write-Host "✓ Ready" -ForegroundColor Green
    Start-Sleep -Milliseconds 1000
}

$body = @{
    model   = "gemma4:26b"
    prompt  = $Prompt
    stream  = $streamValue
    options = $options
} | ConvertTo-Json -Depth 3 -Compress

Write-Host "🚀 Starting Ollama Test" -ForegroundColor Cyan
Write-Host "CPU Cores  : $([Environment]::ProcessorCount)" -ForegroundColor White
Write-Host "RAM        : 128 GB" -ForegroundColor White
Write-Host "Mode       : $(if($streamValue){'STREAM'}else{'NON-STREAM'})" -ForegroundColor White

$firstTokenTime = $null
$tokenCount = 0
$curlStartTime = $null

if ($streamValue) {
    Write-Host "`n=== LIVE STREAMING (curl optimized) ===" -ForegroundColor Yellow
    Write-Host "(Waiting for first token...)" -ForegroundColor DarkGray

    $curlStartTime = Get-Date
    
    # Streaming mode with keep-alive for persistent connection
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -H "Connection: keep-alive" `
        -H "Accept-Encoding: gzip, deflate" `
        -d $body | ForEach-Object {
            if ($_ -and $_.Trim() -ne "") {
                $tokenCount++
                if ($null -eq $firstTokenTime) {
                    $firstTokenTime = Get-Date
                    $ttft = ($firstTokenTime - $curlStartTime).TotalSeconds
                    Write-Host "`n[First Token after $($ttft.ToString('F3'))s]" -ForegroundColor Magenta
                }
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
        -H "Accept-Encoding: gzip, deflate" `
        -d $body
    $curlEndTime = Get-Date
    
    Write-Host "`n=== NON-STREAM RESPONSE ===" -ForegroundColor Yellow
    $lastLine = ($response | Where-Object { $_.Trim() } | Select-Object -Last 1) | ConvertFrom-Json
    
    $loadSecs = $lastLine.load_duration / 1e9
    $evalSecs = $lastLine.eval_duration / 1e9
    $totalSecs = $loadSecs + $evalSecs
    $tokensPerSec = $lastLine.eval_count / $evalSecs
    
    Write-Host "API Load Duration : $($loadSecs.ToString('F3')) seconds" -ForegroundColor Yellow
    Write-Host "API Generation    : $($evalSecs.ToString('F3')) seconds" -ForegroundColor Yellow
    Write-Host "Tokens Generated  : $($lastLine.eval_count)" -ForegroundColor Cyan
    Write-Host "Throughput        : $($tokensPerSec.ToString('F1')) tokens/sec" -ForegroundColor Green
    Write-Host "Total API Time    : $($totalSecs.ToString('F3')) seconds" -ForegroundColor Cyan
    Write-Host "`nResponse (first 200 chars):" -ForegroundColor White
    Write-Host "$($lastLine.response.Substring(0, [Math]::Min(200, $lastLine.response.Length)))" -ForegroundColor Green
}

Write-Host "`n=================================" -ForegroundColor Green
$duration = ($curlEndTime - $curlStartTime).TotalSeconds
Write-Host "Request Duration  : $($duration.ToString('F3')) seconds" -ForegroundColor Green
if ($firstTokenTime) {
    $ttft = ($firstTokenTime - $curlStartTime).TotalSeconds
    Write-Host "Time to First Token : $($ttft.ToString('F3')) seconds" -ForegroundColor Magenta
}
Write-Host "Tokens Received   : $tokenCount" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Green