param(
    [switch]$Stream = $false,
    [string]$Prompt = "List 5 REST API best practices"
)

$uri = "http://localhost:11434/api/generate"

$options = @{
    num_ctx   = 2048
    num_batch = 512
    num_gpu   = 999
    top_k     = 40
    top_p     = 0.9
    temperature = 0.7
}

$body = @{
    model   = "gemma4:26b"
    prompt  = $Prompt
    stream  = $Stream
    options = $options
} | ConvertTo-Json -Depth 3 -Compress

Write-Host "🚀 Ollama Test (curl via PowerShell)" -ForegroundColor Cyan
Write-Host "📝 Prompt: `"$Prompt`" ($($Prompt.Length) chars)"
Write-Host "CPU: $([Environment]::ProcessorCount) cores | RAM: 128GB`n"

$globalStart = [DateTime]::UtcNow
$firstTokenTime = $null
$tokenCount = 0

if ($Stream) {
    Write-Host "=== STREAMING ===`n"
    
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -d $body | ForEach-Object {
        if ($_ -and $_.Trim() -ne "") {
            try {
                $json = $_ | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($json -and $json.response) {
                    $tokenCount++
                    
                    if ($null -eq $firstTokenTime) {
                        $firstTokenTime = [DateTime]::UtcNow
                        $ttft = ($firstTokenTime - $globalStart).TotalSeconds
                        Write-Host "[First Token after $($ttft.ToString('F3'))s]`n" -ForegroundColor Magenta
                    }
                    
                    Write-Host $json.response -ForegroundColor Gray -NoNewline
                }
            }
            catch { }
        }
    }
    Write-Host "`n"
} else {
    $response = curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -d $body
    
    Write-Host "=== NON-STREAM ===`n" -ForegroundColor Yellow
    $lastLine = ($response | Where-Object { $_.Trim() } | Select-Object -Last 1) | ConvertFrom-Json
    Write-Host "API Load:  $($lastLine.load_duration / 1e9)s"
    Write-Host "API Eval:  $($lastLine.eval_duration / 1e9)s"
    Write-Host "API Speed: $(($lastLine.eval_count / ($lastLine.eval_duration / 1e9)).ToString('F0')) tokens/sec`n"
}

$globalEnd = [DateTime]::UtcNow
$total = ($globalEnd - $globalStart).TotalSeconds

Write-Host "=================================`n" -ForegroundColor Green
Write-Host "Total Duration      : $($total.ToString('F3'))s" -ForegroundColor Green
if ($firstTokenTime) {
    Write-Host "Time to First Token : $(($firstTokenTime - $globalStart).TotalSeconds.ToString('F3'))s" -ForegroundColor Magenta
}
Write-Host "Tokens Received     : $tokenCount" -ForegroundColor White
Write-Host "=================================`n" -ForegroundColor Green
