# Test Smart Recommend API

$body = @{
    aytRanking = 350000
    tytRanking = 450000
    dreamDept = "Bilgisayar Mühendisliği"
    city = "İstanbul"
    gender = "Erkek"
    educationType = "Tümü"
} | ConvertTo-Json

Write-Host "`n🧪 Testing /api/smart-recommend endpoint...`n"
Write-Host "Request Body:"
Write-Host $body
Write-Host "`n"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/smart-recommend" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 60
    
    Write-Host "✅ API Response:`n"
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "❌ Error: $_"
    Write-Host $_.Exception.Message
}
