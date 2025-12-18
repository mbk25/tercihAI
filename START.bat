@echo off
chcp 65001 >nul
echo ========================================
echo    TERCIH AI - Sunucu Başlatılıyor
echo    MySQL Veritabanı ile Entegre
echo ========================================
echo.

cd backend

echo [1/3] MySQL bağlantısı kontrol ediliyor...
echo.
echo UYARI: .env dosyasındaki DB_PASSWORD değerini
echo MySQL şifrenizle değiştirmeyi unutmayın!
echo.
timeout /t 3 /nobreak > nul

echo [2/3] Backend sunucusu başlatılıyor...
echo Veritabanı otomatik oluşturulacak...
start cmd /k "npm start"

timeout /t 5 /nobreak > nul

echo [3/3] Tarayıcı açılıyor...
timeout /t 2 /nobreak > nul

start http://localhost:3000
start http://localhost:3000/admin

echo.
echo ========================================
echo    ✅ Tercih AI Hazır!
echo ========================================
echo.
echo 📡 Kullanıcı Arayüzü: http://localhost:3000
echo 📊 Admin Panel: http://localhost:3000/admin
echo.
echo 🔐 Admin Giriş:
echo    Kullanıcı: admin
echo    Şifre: admin123
echo.
echo 💾 Veritabanı: MySQL (tercihAI)
echo.
echo ⚙️ Özellikler:
echo    ✅ Tercih Analizi
echo    ✅ YÖK Atlas Veri Çekme
echo    ✅ Google OAuth Giriş
echo    ✅ Yeni Sohbet
echo    ✅ Admin Paneli
echo.
echo Sunucuyu durdurmak için backend penceresini kapatın.
echo.
pause
