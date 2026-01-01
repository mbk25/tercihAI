# 🚀 Vercel Deployment Checklist

## ✅ Yapılması Gerekenler

### 1. GitHub Repository Bağlantısı
- [ ] GitHub'a push yapıldı ✅
- [ ] Vercel Dashboard > Add New Project
- [ ] GitHub repo'yu seç: `tercihAI`
- [ ] Import et

### 2. Environment Variables (Vercel Dashboard)

Vercel > Project Settings > Environment Variables bölümünde ekle:

#### Database
```
DB_HOST=mysql-xxxxx.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=xxxxx
DB_NAME=defaultdb
DB_PORT=13551
```

#### MongoDB
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tercihAI
```

#### JWT & Session
```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key
```

#### Google OAuth
```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=https://your-domain.vercel.app/auth/google/callback
```

#### AI Provider (Groq - Ücretsiz)
```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx
```

#### Google Sheets (Opsiyonel)
```
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
xxxxx
-----END PRIVATE KEY-----"
```

### 3. Google OAuth Callback URL Güncelleme

Deploy edildikten sonra:

1. Google Cloud Console'a git
2. APIs & Services > Credentials
3. OAuth 2.0 Client ID'nizi seçin
4. Authorized redirect URIs'e ekle:
   ```
   https://your-domain.vercel.app/auth/google/callback
   https://your-domain.vercel.app
   ```

### 4. Deploy Sonrası Test

- [ ] Ana sayfa açılıyor mu?
- [ ] Google ile giriş çalışıyor mu?
- [ ] Tercih analizi yapılabiliyor mu?
- [ ] Hedef analizi yapılabiliyor mu?
- [ ] Üniversite detayları gösteriliyor mu?
- [ ] Harita çalışıyor mu?
- [ ] Vakıf üniversiteleri için ücret bilgisi gösteriliyor mu?

### 5. Vercel Ayarları

#### Build Settings (Otomatik ayarlanmalı)
```
Build Command: (boş bırak veya "echo 'No build'")
Output Directory: public
Install Command: npm install
```

#### Functions Settings
```
Function Region: Washington, D.C. (iad1) veya en yakın bölge
Memory: 1024 MB
Max Duration: 60 seconds
```

### 6. Domain (Opsiyonel)

Vercel > Project Settings > Domains
- Kendi domain'inizi ekleyebilirsiniz
- Otomatik SSL sertifikası verilir

---

## 🔍 Sorun Giderme

### Database bağlantı hatası
- Environment variables doğru mu?
- Aiven IP whitelist kontrolü (0.0.0.0/0 açık olmalı)
- SSL bağlantısı aktif mi?

### Google OAuth çalışmıyor
- GOOGLE_CALLBACK_URL environment variable doğru mu?
- Google Console'da redirect URI eklendi mi?
- Authorized domains eklenmiş mi?

### AI yanıt vermiyor
- GROQ_API_KEY doğru mu?
- AI_PROVIDER=groq olarak ayarlandı mı?
- API limiti aşıldı mı?

### Static dosyalar yüklenmiyor
- vercel.json routes kontrolü
- public klasörü doğru konumda mı?

---

## 📊 Monitoring

Vercel Dashboard > Analytics'te:
- Request sayısı
- Error rate
- Response time
- Function logs

---

## 🎉 Deploy Sonrası

Tebrikler! Projeniz artık canlıda:
```
https://your-domain.vercel.app
```

Her GitHub push'ta otomatik deploy edilecek.
