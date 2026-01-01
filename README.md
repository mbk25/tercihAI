# Tercih AI - Üniversite Tercih Danışmanı

Akıllı üniversite tercih sistemi. YKS sıralamanıza göre üniversite önerisi yapar.

## 🚀 Vercel'e Deploy Etme

### 1. Vercel Dashboard'da Environment Variables Ekle

Vercel projenizin Settings > Environment Variables bölümünde şu değişkenleri ekleyin:

```env
# Database (Aiven MySQL)
DB_HOST=your-mysql-host.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_PORT=13551

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tercihAI

# JWT
JWT_SECRET=your-jwt-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.vercel.app/auth/google/callback

# Session
SESSION_SECRET=your-session-secret

# AI Services (Choose one)
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key

# Google Sheets (Optional)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
```

### 2. Deploy

```bash
# Vercel CLI ile deploy
vercel

# Veya GitHub repo'yu Vercel'e bağla
# Vercel otomatik olarak her push'ta deploy eder
```

### 3. Domain Ayarları

Vercel deploy edildikten sonra, Google OAuth callback URL'ini güncellemeyi unutmayın:
- Google Cloud Console > APIs & Services > Credentials
- Authorized redirect URIs: `https://your-domain.vercel.app/auth/google/callback`

## 📦 Lokal Geliştirme

```bash
# Dependencies yükle
npm install

# Backend'i başlat
npm start

# Tarayıcıda aç
http://localhost:3000
```

## 🛠 Teknolojiler

- **Backend:** Node.js + Express
- **Database:** MySQL (Aiven) + MongoDB Atlas
- **AI:** Groq / OpenAI / Gemini
- **Auth:** Google OAuth 2.0
- **Hosting:** Vercel

## 📝 Özellikler

- ✅ Tercih Analizi (Sıralamaya göre üniversite önerisi)
- ✅ Hedef Analizi (Net bazlı bölüm analizi)
- ✅ Google ile giriş
- ✅ Sohbet geçmişi
- ✅ Excel export
- ✅ ÖSYM şartları gösterimi
- ✅ Kampüs haritası
- ✅ Vakıf üniversiteleri için ücret bilgisi

## 🔒 Güvenlik

- JWT token authentication
- Google OAuth 2.0
- CORS koruması
- SQL injection koruması (Prepared statements)
- Environment variables ile hassas bilgi koruması
