param(
    [switch]$Stream = $false
)

# Force proper boolean
$streamValue = [bool]$Stream

$body = @{
    model   = "gemma4:26b"
    prompt  = "List 5 best practices for REST APIs"
    stream  = $streamValue
    options = @{ num_ctx = 2048 }
} | ConvertTo-Json -Depth 3 -Compress

Write-Host "🚀 Starting Ollama Test" -ForegroundColor Cyan
Write-Host "Mode       : $(if($streamValue){'STREAM'}else{'NON-STREAM'})" -ForegroundColor White
Write-Host "Start Time : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff')" -ForegroundColor White

$time = Measure-Command {
    $response = curl.exe -s -X POST http://localhost:11434/api/generate `
        -H "Content-Type: application/json" `
        -d $body

    Write-Host "`n" -NoNewline

    if ($streamValue) {
        Write-Host "=== LIVE STREAMING RESPONSE (All Lines) ===" -ForegroundColor Yellow
        
        # Split and display every line in real-time style
        $lines = $response -split "`n"
        foreach ($line in $lines) {
            if ($line.Trim() -ne "") {
                Write-Host $line -ForegroundColor Gray
            }
        }
        Write-Host "`n=== STREAM END ===" -ForegroundColor Yellow
    }
    else {
        Write-Host "=== NON-STREAM RESPONSE ===" -ForegroundColor Yellow
        if ($response) {
            $response | ConvertFrom-Json | Format-List response, done, total_duration, load_duration
        }
        else {
            "No response received."
        }
    }
}

$endTime = Get-Date
Write-Host "`n=================================" -ForegroundColor Green
Write-Host "End Time   : $($endTime.ToString('yyyy-MM-dd HH:mm:ss.fff'))" -ForegroundColor White
Write-Host "Total Time : $($time.TotalSeconds.ToString("F3")) seconds" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green