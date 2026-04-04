param(
    [switch]$Stream = $false,
    [string]$Prompt = "List 5 best practices for REST APIs"
)

$streamValue = [bool]$Stream
$uri = "http://localhost:11434/api/generate"

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
    Write-Host "`n=== LIVE STREAMING (curl real-time) ===" -ForegroundColor Yellow
    Write-Host "(Waiting for first token...)" -ForegroundColor DarkGray

    $curlStartTime = Get-Date
    
    # Use curl.exe with actual streaming (no buffering)
    curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -d $body | ForEach-Object {
            if ($_ -and $_.Trim() -ne "") {
                $tokenCount++
                if ($null -eq $firstTokenTime) {
                    $firstTokenTime = Get-Date
                    $ttft = ($firstTokenTime - $curlStartTime).TotalSeconds
                    Write-Host "`n[First Token after $($ttft.ToString('F3'))s]" -ForegroundColor Magenta
                }
                # Parse JSON to extract actual response
                try {
                    $json = $_ | ConvertFrom-Json -ErrorAction SilentlyContinue
                    if ($json -and $json.response) {
                        Write-Host $json.response -ForegroundColor Gray -NoNewline
                    }
                }
                catch { }
            }
        }
    
    Write-Host ""  # Newline after streaming
    $curlEndTime = Get-Date
}
else {
    # Non-stream mode
    $curlStartTime = Get-Date
    $response = curl.exe -s -X POST $uri `
        -H "Content-Type: application/json" `
        -d $body
    $curlEndTime = Get-Date
    
    Write-Host "`n=== NON-STREAM RESPONSE ===" -ForegroundColor Yellow
    $lastLine = ($response | Where-Object { $_.Trim() } | Select-Object -Last 1) | ConvertFrom-Json
    Write-Host "API Load Duration : $($lastLine.load_duration / 1e9) seconds" -ForegroundColor Yellow
    Write-Host "API Generation    : $($lastLine.eval_duration / 1e9) seconds" -ForegroundColor Yellow
    Write-Host "Response (first 200 chars): $($lastLine.response.Substring(0, [Math]::Min(200, $lastLine.response.Length)))" -ForegroundColor Green
}

Write-Host "`n=================================" -ForegroundColor Green
Write-Host "curl Duration     : $(($curlEndTime - $curlStartTime).TotalSeconds.ToString('F3')) seconds" -ForegroundColor Green
if ($firstTokenTime) {
    Write-Host "Time to First Token : $(($firstTokenTime - $curlStartTime).TotalSeconds.ToString('F3')) seconds" -ForegroundColor Magenta
}
Write-Host "Tokens Received   : $tokenCount" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Green