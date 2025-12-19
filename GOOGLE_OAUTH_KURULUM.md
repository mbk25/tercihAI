# 🔐 Google OAuth Kurulum Rehberi

Google ile giriş özelliğini çalıştırmak için Google Cloud Console'dan OAuth kimlik bilgileri almanız gerekiyor.

## 📋 Adım 1: Google Cloud Console'a Giriş

1. https://console.cloud.google.com/ adresine gidin
2. Google hesabınızla giriş yapın
3. Yeni bir proje oluşturun veya mevcut projeyi seçin

## 📋 Adım 2: OAuth Consent Screen Ayarları

1. Sol menüden **"APIs & Services"** > **"OAuth consent screen"** seçin
2. **"External"** seçip **"CREATE"** butonuna tıklayın
3. Aşağıdaki bilgileri doldurun:
   - **App name**: Tercih AI
   - **User support email**: Email adresiniz
   - **Developer contact**: Email adresiniz
4. **"SAVE AND CONTINUE"** butonuna tıklayın
5. **Scopes** ekranında herhangi bir şey eklemenize gerek yok, **"SAVE AND CONTINUE"**
6. **Test users** ekranında **"ADD USERS"** ile kendinizi ekleyin
7. **"SAVE AND CONTINUE"** > **"BACK TO DASHBOARD"**

## 📋 Adım 3: OAuth 2.0 Client ID Oluşturma

1. Sol menüden **"APIs & Services"** > **"Credentials"** seçin
2. Üstteki **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** seçin
3. Aşağıdaki bilgileri doldurun:
   - **Application type**: Web application
   - **Name**: Tercih AI Web Client
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/google/callback
     ```
4. **"CREATE"** butonuna tıklayın
5. Açılan popup'ta gösterilen bilgileri kopyalayın:
   - **Client ID** (örn: 123456789-abc...apps.googleusercontent.com)
   - **Client Secret** (örn: GOCSPX-abc123...)

## 📋 Adım 4: .env Dosyasını Güncelleme

`backend/.env` dosyasını açın ve aşağıdaki satırları bulun:

```env
# Google OAuth (Şimdilik geliştirme için placeholder)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

Kopyaladığınız bilgilerle değiştirin:

```env
# Google OAuth
GOOGLE_CLIENT_ID=BURAYA_CLIENT_ID_YAPIŞTIRIN
GOOGLE_CLIENT_SECRET=BURAYA_CLIENT_SECRET_YAPIŞTIRIN
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## 📋 Adım 5: Backend'i Yeniden Başlatma

1. Eğer backend çalışıyorsa, durdurun (Ctrl+C)
2. Backend'i tekrar başlatın:
   ```bash
   cd backend
   npm start
   ```

## ✅ Test Etme

1. Tarayıcıda http://localhost:3000 adresine gidin
2. Sol sidebar'da "Google ile Giriş" butonuna tıklayın
3. Google hesabınızı seçin ve izin verin
4. Başarılı olursa, ismınız ve profil fotoğrafınız görünecektir

## 🚨 Sorun Giderme

### "Error 400: redirect_uri_mismatch"
- Google Cloud Console'da **Authorized redirect URIs** bölümünü kontrol edin
- Tam olarak `http://localhost:3000/auth/google/callback` olmalı
- Değişiklik yaptıysanız birkaç dakika bekleyin

### "Access blocked: This app's request is invalid"
- OAuth Consent Screen'de **Test users** bölümüne kendinizi ekleyin
- **Publishing status** "Testing" modunda olmalı

### "Invalid Client"
- .env dosyasındaki Client ID ve Secret'ı kontrol edin
- Backend'i yeniden başlatın

## 📝 Önemli Notlar

- **Test modunda** maksimum 100 kullanıcı ekleyebilirsiniz
- **Production'a** geçmek için Google'dan onay almanız gerekir
- Geliştirme için test modu yeterlidir
- Client Secret'ı **asla** paylaşmayın veya commit etmeyin

## 🔗 Faydalı Linkler

- Google Cloud Console: https://console.cloud.google.com/
- OAuth 2.0 Dokümanı: https://developers.google.com/identity/protocols/oauth2
- Passport.js Google Strategy: http://www.passportjs.org/packages/passport-google-oauth20/
