# 🔐 VERCEL ENVIRONMENT VARIABLES CHECKLIST

## ⚠️ DEPLOYMENT ÇALIŞMIYORSA İLK KONTROL EDİLECEK YER!

Vercel Dashboard'a git:
```
https://vercel.com/dashboard
→ tercihai projesi seç
→ Settings
→ Environment Variables
```

---

## ✅ ZORUNLU ENVIRONMENT VARIABLES:

### 📊 Database (MySQL)
```
DB_HOST          = mysql-xxxxx.aivencloud.com
DB_USER          = avnadmin  
DB_PASSWORD      = [Aiven şifren]
DB_NAME          = defaultdb
DB_PORT          = 13551
```

### 🍃 MongoDB
```
MONGODB_URI      = mongodb+srv://username:password@cluster.mongodb.net/tercihAI
```

### 🔐 Security
```
JWT_SECRET       = [32+ karakter random string]
SESSION_SECRET   = [32+ karakter random string]
```

### 🔑 Google OAuth
```
GOOGLE_CLIENT_ID     = xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxxxx
GOOGLE_CALLBACK_URL  = https://tercihai.vercel.app/auth/google/callback
```

### 🤖 AI Provider
```
AI_PROVIDER   = groq
GROQ_API_KEY  = gsk_xxxxx
```

---

## 🎯 HER VARIABLE İÇİN:

**Environment seçimi:**
- ✅ Production
- ✅ Preview  
- ✅ Development

(HEPSİNİ SEÇ!)

---

## 🔄 VARIABLES EKLEDİKTEN SONRA:

1. Vercel Dashboard → Deployments
2. En son deployment'i bul
3. Sağ taraftaki **"⋯"** menü
4. **"Redeploy"** tıkla
5. Onay ver

Bu önemli! Çünkü environment variables değiştiğinde otomatik redeploy olmaz.

---

## 🧪 TEST:

Deployment tamamlandıktan sonra:

### 1. Health Check
```
https://tercihai.vercel.app/api/health
```

**Beklenen çıktı:**
```json
{
  "status": "OK",
  "message": "Server çalışıyor"
}
```

### 2. Ana Sayfa
```
https://tercihai.vercel.app
```
- Sayfa açılıyor mu? ✅
- Tercih Analizi butonu çalışıyor mu? ✅
- Hedef Analizi butonu çalışıyor mu? ✅

### 3. Google Login
```
https://tercihai.vercel.app/auth/google
```
- Google login sayfası açılıyor mu? ✅

---

## ❌ HATA ALIRSAN:

### "Failed to fetch" hatası:
→ Environment variables eksik
→ DB bağlantısı başarısız
→ API routes çalışmıyor

**Çözüm:**
1. Vercel → Settings → Environment Variables kontrol et
2. Function Logs kontrol et (hangi variable eksik bakabilirsin)
3. Redeploy et

### "500 Internal Server Error":
→ Database bağlantısı yok
→ Environment variable değerleri yanlış

**Çözüm:**
1. DB_HOST, DB_PASSWORD doğru mu kontrol et
2. GROQ_API_KEY geçerli mi kontrol et
3. Function Logs'a bak

### Google Login çalışmıyor:
→ GOOGLE_CALLBACK_URL yanlış

**Çözüm:**
1. Google Cloud Console → OAuth → Redirect URIs
2. Şunu ekle: `https://tercihai.vercel.app/auth/google/callback`
3. Vercel'de GOOGLE_CALLBACK_URL'i güncelle
4. Redeploy

---

## 📝 .env Dosyandan Kopyala:

Lokal bilgisayarındaki `.env` dosyasını aç:
```
C:\Users\Bilal\Desktop\site-projeleri\tercihAI\.env
```

Her satırı Vercel'e kopyala (değer kısmını):
```
DB_HOST=mysql-xxxxx.aivencloud.com
     ↑
     Bu kısmı kopyala
```

---

## 🚨 HATIRLA:

1. **HER VARIABLE İÇİN** Production + Preview + Development SEÇ
2. **DEĞER DEĞİŞTİRİRSEN** mutlaka Redeploy et
3. **SENSİTİF BİLGİLERİ** GitHub'a pushlama (sadece Vercel'de)

---

## 🎉 Başarılı Deploy Göstergeleri:

✅ Health endpoint çalışıyor
✅ Ana sayfa açılıyor
✅ Form submit ediliyor
✅ AI analiz dönüyor
✅ Google login çalışıyor
✅ Sohbet geçmişi kaydediliyor

---

🚀 Başarılar!
