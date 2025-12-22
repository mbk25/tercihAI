# Vercel Deploy Rehberi

Bu rehber, TercihAI projesini Vercel'e deploy etmek için adım adım talimatlar içerir.

## Ön Hazırlık

1. [Vercel hesabı](https://vercel.com) oluşturun
2. GitHub repository'nizi hazırlayın
3. Gerekli API anahtarlarını edinin

## Environment Variables

Aşağıdaki environment variables'ları Vercel Dashboard'dan ekleyin:

### Veritabanı
```
DB_HOST=YOUR_DB_HOST
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
DB_PORT=YOUR_DB_PORT
DB_SSL_CA_BASE64=YOUR_SSL_CERTIFICATE_BASE64
```

### Güvenlik
```
JWT_SECRET=YOUR_JWT_SECRET_HERE
SESSION_SECRET=YOUR_SESSION_SECRET_HERE
```

### Google OAuth
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=https://your-domain.vercel.app/auth/google/callback
```

### AI Provider (Groq)
```
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
AI_PROVIDER=groq
```

### Diğer
```
NODE_ENV=production
PORT=3000
VERCEL=1
```

## Deploy Adımları

1. Vercel Dashboard'a gidin
2. "Add New..." > "Project" seçin
3. GitHub repository'nizi import edin
4. Environment variables'ları ekleyin
5. "Deploy" butonuna tıklayın

## Deploy Sonrası

1. Google Cloud Console'da OAuth callback URL'ini güncelleyin
2. Vercel'de verilen domain'i test edin
3. Logs'ları kontrol ederek hata olmadığından emin olun

## Önemli Notlar

- API anahtarlarınızı asla public repository'ye commit etmeyin
- `.env` dosyası `.gitignore`'da olmalıdır
- Production ortamında güçlü secret'lar kullanın
- SSL sertifikasını base64 encode edin

## Yardım

Sorun yaşıyorsanız:
- Vercel Logs'ları kontrol edin
- Environment variables'ları doğrulayın  
- Google OAuth ayarlarını gözden geçirin
- Database bağlantısını test edin
