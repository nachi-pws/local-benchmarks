param(
    [switch]$Stream = $false
)

$streamValue = [bool]$Stream

$body = @{
    model   = "gemma4:26b"
    prompt  = "List 5 best practices for REST APIs"
    stream  = $streamValue
    options = @{ num_ctx = 2048 }
} | ConvertTo-Json -Depth 3 -Compress

Write-Host "🚀 Starting Ollama Test" -ForegroundColor Cyan
Write-Host "Mode       : $(if($streamValue){'STREAM'}else{'NON-STREAM'})"
$globalStart = Get-Date
Write-Host "Global Start : $($globalStart.ToString('HH:mm:ss.fff'))"

$firstTokenTime = $null
$tokenCount = 0

if ($streamValue) {
    Write-Host "`n=== LIVE STREAMING (real-time) ===" -ForegroundColor Yellow
    Write-Host "(Waiting for first token...)" -ForegroundColor DarkGray

    # This version uses direct pipeline - most reliable
    curl.exe -s -X POST http://localhost:11434/api/generate `
        -H "Content-Type: application/json" `
        -d $body | ForEach-Object {
            if ($_ -and $_.Trim() -ne "") {
                $tokenCount++
                if ($null -eq $firstTokenTime) {
                    $firstTokenTime = Get-Date
                    $ttft = ($firstTokenTime - $globalStart).TotalSeconds
                    Write-Host "`n[First Token after $($ttft.ToString('F3'))s]" -ForegroundColor Magenta
                }
                Write-Host $_ -ForegroundColor Gray
            }
        }
}
else {
    # Non-stream mode
    $time = Measure-Command {
        $response = curl.exe -s -X POST http://localhost:11434/api/generate `
            -H "Content-Type: application/json" -d $body
        
        Write-Host "`n=== NON-STREAM RESPONSE ===" -ForegroundColor Yellow
        $response | ConvertFrom-Json | Format-List response, total_duration, load_duration
    }
    Write-Host "Non-Stream Total: $($time.TotalSeconds.ToString('F3'))s" -ForegroundColor Green
}

$globalEnd = Get-Date
$total = ($globalEnd - $globalStart).TotalSeconds

Write-Host "`n=================================" -ForegroundColor Green
Write-Host "Total Time        : $($total.ToString('F3')) seconds" -ForegroundColor Green
if ($firstTokenTime) {
    Write-Host "Time to First Token : $(($firstTokenTime - $globalStart).TotalSeconds.ToString('F3')) seconds" -ForegroundColor Magenta
}
Write-Host "Tokens Received   : $tokenCount" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Green