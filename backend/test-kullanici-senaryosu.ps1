# KULLANICI SENARYOSU TEST
# TYT: 300.000, İstanbul, Bilgisayar Mühendisliği

Write-Host "`n🎯 KULLANICI SENARYOSU TEST" -ForegroundColor Cyan
Write-Host "="*80
Write-Host ""
Write-Host "📋 Kullanıcı Bilgileri:"
Write-Host "   TYT Sıralaması: 300.000"
Write-Host "   AYT Sıralaması: 350.000"
Write-Host "   Hayalindeki Bölüm: Bilgisayar Mühendisliği"
Write-Host "   Şehir: İstanbul"
Write-Host ""
Write-Host "="*80
Write-Host ""

$body = @{
    tytRanking = 300000
    aytRanking = 350000
    ranking = 300000
    dreamDept = "Bilgisayar Mühendisliği"
    city = "İstanbul"
    gender = "Erkek"
    educationType = "Tümü"
} | ConvertTo-Json

Write-Host "📤 Request gönderiliyor..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/analyze" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 120

    Write-Host "✅ API Yanıtı Alındı!" -ForegroundColor Green
    Write-Host ""
    Write-Host "="*80
    Write-Host ""

    if ($response.isEligible) {
        Write-Host "🎉 SONUÇ: Hedef bölüme girebilir!" -ForegroundColor Green
        Write-Host "   Toplam Üniversite: $($response.summary.total)"
        Write-Host "   Devlet: $($response.summary.devlet)"
        Write-Host "   Vakıf: $($response.summary.vakif)"
    } else {
        Write-Host "⚠️ SONUÇ: Hedef bölüme yetmiyor, alternatifler gösteriliyor" -ForegroundColor Yellow
        Write-Host ""
        
        if ($response.alternatives) {
            # 4 yıllık alternatifler
            $fourYear = $response.alternatives | Where-Object { $_.type -eq '4 Yıllık' -and $_.available }
            Write-Host "📘 4 YILLIK ALTERNATİFLER: $($fourYear.Count) adet" -ForegroundColor Cyan
            
            # 2 yıllık alternatifler
            $twoYear = $response.alternatives | Where-Object { $_.type -eq '2 Yıllık' -and $_.available }
            Write-Host "📗 2 YILLIK ALTERNATİFLER: $($twoYear.Count) adet" -ForegroundColor Green
            Write-Host ""
            
            # Bilgisayar Programcılığı var mı?
            $csProgram = $response.alternatives | Where-Object { $_.dept -like '*Bilgisayar Programcılığı*' }
            
            if ($csProgram) {
                Write-Host "🎓 BİLGİSAYAR PROGRAMCILIĞI DETAY:" -ForegroundColor Magenta
                Write-Host "   Durum: $(if($csProgram.available){'✅ UYGUN'}else{'❌ UYGUN DEĞİL'})"
                Write-Host "   Üniversite Sayısı: $($csProgram.universities.Count)"
                
                if ($csProgram.universities.Count -gt 0) {
                    Write-Host ""
                    Write-Host "   İlk 10 Üniversite:" -ForegroundColor Yellow
                    $csProgram.universities | Select-Object -First 10 | ForEach-Object -Begin {$i=1} -Process {
                        Write-Host "   $i. $($_.name) ($($_.type)) - Taban: $($_.ranking -f 'N0')"
                        $i++
                    }
                } else {
                    Write-Host "   ⚠️ Seçtiğiniz şehirde üniversite bulunamadı" -ForegroundColor Red
                }
            } else {
                Write-Host "❌ Bilgisayar Programcılığı alternatifi bulunamadı!" -ForegroundColor Red
            }
        }
    }

    Write-Host ""
    Write-Host "="*80
    Write-Host ""

} catch {
    Write-Host "❌ HATA: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
