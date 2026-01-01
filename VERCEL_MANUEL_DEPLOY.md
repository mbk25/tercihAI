# 🚀 Vercel'e Manuel Deploy - Adım Adım Rehber

## 📍 Mevcut Durum
- ✅ GitHub Repo: https://github.com/mbk25/tercihAI
- ✅ Kodlar push edildi
- ⏳ Vercel'e import edilmesi bekleniyor

---

## 🎯 ADIM ADIM VERCEL DEPLOYMENT

### 1️⃣ Vercel'e Giriş Yap
```
https://vercel.com/login
```
- GitHub hesabınla giriş yap
- Vercel hesabın yoksa "Sign Up" ile oluştur

---

### 2️⃣ Yeni Proje Ekle

**Dashboard'da:**
```
1. "Add New..." butonuna tıkla
2. "Project" seç
```

veya direkt:
```
https://vercel.com/new
```

---

### 3️⃣ GitHub Repository Import Et

**Import Git Repository ekranında:**

```
1. "Import Git Repository" bölümünde:
   
   a) GitHub seçeneğini bul
   
   b) Eğer GitHub hesabın bağlı değilse:
      → "Connect GitHub Account" tıkla
      → GitHub'da Vercel'e izin ver
   
   c) Repository listesinde ara:
      🔍 "tercihAI" yaz
   
   d) "mbk25/tercihAI" reposunu bul
   
   e) "Import" butonuna tıkla
```

---

### 4️⃣ Proje Ayarları (Configure Project)

**Framework Preset:**
```
Framework: Other (veya Node.js)
```

**Build & Development Settings:**
```
Build Command:    (BOŞ BIRAK)
Output Directory: public
Install Command:  npm install
```

**Root Directory:**
```
./  (değiştirme)
```

---

### 5️⃣ Environment Variables Ekle

**⚠️ ÇOK ÖNEMLİ - Şu değişkenleri ekle:**

Click "Environment Variables" dropdown:

#### Database (MySQL)
```
DB_HOST          = mysql-xxxxx.aivencloud.com
DB_USER          = avnadmin
DB_PASSWORD      = [Aiven'dan aldığın şifre]
DB_NAME          = defaultdb
DB_PORT          = 13551
```

#### MongoDB
```
MONGODB_URI      = mongodb+srv://username:password@cluster.mongodb.net/tercihAI
```

#### JWT & Session
```
JWT_SECRET       = [32+ karakter random string]
SESSION_SECRET   = [32+ karakter random string]
```

#### Google OAuth
```
GOOGLE_CLIENT_ID     = xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = xxxxx
GOOGLE_CALLBACK_URL  = https://tercih-ai.vercel.app/auth/google/callback
```
⚠️ Not: Domain adını deploy sonrası güncelleyeceksin

#### AI Provider
```
AI_PROVIDER   = groq
GROQ_API_KEY  = gsk_xxxxx
```

#### Google Sheets (Opsiyonel)
```
GOOGLE_SHEETS_CLIENT_EMAIL  = xxx@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY   = -----BEGIN PRIVATE KEY-----\nxxx\n-----END...
```

⚠️ Her değişken için:
1. Name: Değişken adı
2. Value: Değer (.env dosyandan kopyala)
3. Environment: Production, Preview, Development (HEPSİNİ SEÇ)

---

### 6️⃣ Deploy Et

```
"Deploy" butonuna tıkla!
```

**Deployment süreci başlayacak:**
```
⏳ Installing dependencies...
⏳ Building...
⏳ Deploying...
✅ Deployment successful!
```

---

### 7️⃣ Domain ve Callback URL Güncelle

**Deploy tamamlandıktan sonra:**

```
Vercel size bir domain verecek:
https://tercih-ai.vercel.app
veya
https://tercih-ai-[random].vercel.app
```

**Google OAuth Callback Güncelle:**

```
1. Google Cloud Console'a git:
   https://console.cloud.google.com

2. APIs & Services → Credentials

3. OAuth 2.0 Client ID'ni seç

4. Authorized redirect URIs'e EKLE:
   https://[vercel-domain].vercel.app/auth/google/callback
   https://[vercel-domain].vercel.app

5. SAVE
```

**Vercel'de Environment Variable Güncelle:**

```
1. Vercel Dashboard → Settings → Environment Variables

2. GOOGLE_CALLBACK_URL değerini güncelle:
   https://[vercel-domain].vercel.app/auth/google/callback

3. Redeploy et (Deployments → ⋯ → Redeploy)
```

---

## 🔍 Deployment Kontrolü

### Build Logs İncele:
```
Vercel Dashboard
→ Deployments
→ En son deployment
→ "Building" tıkla
→ Log'ları oku
```

### Function Logs İncele:
```
→ "Functions" sekmesi
→ /api/index.js
→ Logs
```

### Test Et:
```
1. Ana sayfa: https://[domain].vercel.app
2. Health check: https://[domain].vercel.app/api/health
3. Google Login: https://[domain].vercel.app/auth/google
```

---

## ❌ Hata Alırsan

### Build hatası:
```
→ Logs'ta hatayı bul
→ Dependencies eksikse package.json kontrol et
→ Syntax hatası varsa düzelt ve push et
```

### Runtime hatası:
```
→ Function Logs kontrol et
→ Environment variables eksiksiz mi kontrol et
→ Database bağlantısı çalışıyor mu test et
```

### 500 Internal Server Error:
```
→ Environment variables doğru mu?
→ DB_HOST, GROQ_API_KEY vs. ekli mi?
→ Function timeout 60 saniye yeterli mi?
```

---

## 🎉 Başarılı Deploy Sonrası

### Özellik Testleri:
- [ ] Ana sayfa açılıyor
- [ ] Google ile giriş çalışıyor
- [ ] Tercih analizi yapılabiliyor
- [ ] Hedef analizi yapılabiliyor
- [ ] Üniversite detayları gösteriliyor
- [ ] Harita çalışıyor
- [ ] Ücret bilgisi gösteriliyor (vakıf üniv.)
- [ ] Sohbet geçmişi kaydediliyor

### Otomatik Deployments:
```
✅ Her GitHub push'ta otomatik deploy
✅ Preview deployments (PR'lar için)
✅ Production deployment (main branch)
```

---

## 💡 İpuçları

1. **Environment Variables:**
   - Hassas bilgileri GitHub'a pushlama
   - Vercel dashboard'dan ekle
   - Production + Preview + Development seç

2. **Logs:**
   - Deployment logs → Build hataları
   - Function logs → Runtime hataları
   - Real-time monitoring

3. **Domain:**
   - Vercel ücretsiz subdomain verir
   - Kendi domain'ini ekleyebilirsin
   - Otomatik SSL sertifikası

4. **Performance:**
   - Global CDN
   - Auto-scaling
   - Edge network

---

## 📞 Destek

Hata alırsan:
1. Vercel logs'u kontrol et
2. GitHub repo'yu kontrol et
3. Environment variables'ı kontrol et
4. Bana log çıktısını göster

---

🚀 Başarılar! Deploy'dan sonra sonucu paylaş!
