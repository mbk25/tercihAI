# Hızlı Deploy Rehberi

Bu rehber, TercihAI uygulamasını Vercel'e hızlı bir şekilde deploy etmenizi sağlar.

## 1. Vercel'de Proje Oluşturma

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. "Add New..." > "Project" seçeneğine tıklayın
3. GitHub repository'nizi seçin ve "Import" edin

## 2. Environment Variables (Çevre Değişkenleri)

Vercel Dashboard'da projeniz için aşağıdaki environment variables'ları ekleyin:

### Temel Ayarlar
```
NODE_ENV=production
PORT=3000
```

### Veritabanı Ayarları
```
DB_HOST=YOUR_DB_HOST
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
DB_PORT=YOUR_DB_PORT
DB_SSL_CA_BASE64=YOUR_SSL_CERTIFICATE_BASE64
```

### Güvenlik Ayarları
```
JWT_SECRET=YOUR_JWT_SECRET_HERE
SESSION_SECRET=YOUR_SESSION_SECRET_HERE
```

### Google OAuth Ayarları
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=https://YOUR-DOMAIN.vercel.app/auth/google/callback
```

### AI Provider Ayarları (Groq veya Gemini)
```
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
AI_PROVIDER=groq
```

veya Gemini kullanıyorsanız:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
AI_PROVIDER=gemini
```

### Vercel Özel Ayarları
```
VERCEL=1
```

## 3. Deploy Etme

1. Environment variables'ları girdikten sonra "Deploy" butonuna tıklayın
2. Deploy işlemi tamamlanana kadar bekleyin
3. Deploy tamamlandığında verilen URL'yi kaydedin

## 4. Google OAuth Callback URL'ini Güncelleme

1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
2. OAuth credentials'ınıza gidin
3. Authorized redirect URIs'a Vercel URL'inizi ekleyin:
   ```
   https://YOUR-DOMAIN.vercel.app/auth/google/callback
   ```

## 5. Test Etme

1. Vercel URL'inizi tarayıcıda açın
2. Google ile giriş yaparak test edin
3. AI önerilerini test edin

## Notlar

- Tüm API anahtarlarınızı güvenli bir şekilde saklayın
- Production ortamında güçlü JWT ve SESSION secrets kullanın
- Google OAuth callback URL'inizi doğru şekilde ayarlayın
- Veritabanı SSL sertifikasını base64 formatında ekleyin

## Sorun Giderme

Eğer deploy sırasında sorun yaşarsanız:

1. Vercel Dashboard'da Logs bölümünü kontrol edin
2. Environment variables'ların doğru girildiğinden emin olun
3. Google OAuth ayarlarını kontrol edin
4. Veritabanı bağlantı bilgilerini doğrulayın
