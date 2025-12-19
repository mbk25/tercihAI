# 📊 Google Sheets Entegrasyonu Kurulum Rehberi

Kullanıcıların seçtikleri üniversiteleri Google Sheets'e aktarması için Google Service Account kurulumu gerekiyor.

## 📋 Adım 1: Google Cloud Console'a Giriş

1. https://console.cloud.google.com/ adresine gidin
2. Google hesabınızla giriş yapın
3. Mevcut projenizi seçin (veya yeni bir proje oluşturun)

## 📋 Adım 2: Google Sheets API'yi Etkinleştir

1. Sol menüden **"APIs & Services"** > **"Library"** seçin
2. Arama kutusuna **"Google Sheets API"** yazın
3. **"Google Sheets API"** üzerine tıklayın
4. **"ENABLE"** butonuna tıklayın
5. Aynı şekilde **"Google Drive API"** de etkinleştirin

## 📋 Adım 3: Service Account Oluştur

1. Sol menüden **"APIs & Services"** > **"Credentials"** seçin
2. Üstteki **"+ CREATE CREDENTIALS"** > **"Service account"** seçin
3. Aşağıdaki bilgileri doldurun:
   - **Service account name**: TercihAI Sheets
   - **Service account ID**: (otomatik oluşur)
   - **Service account description**: Üniversite tercih listesi için Google Sheets erişimi
4. **"CREATE AND CONTINUE"** butonuna tıklayın
5. **Role** seçimi:
   - **"Select a role"** > **"Basic"** > **"Editor"** seçin
6. **"CONTINUE"** ve **"DONE"** butonlarına tıklayın

## 📋 Adım 4: Service Account Key Oluştur

1. Oluşturduğunuz service account'a tıklayın
2. Üstteki **"KEYS"** sekmesine tıklayın
3. **"ADD KEY"** > **"Create new key"** seçin
4. **"JSON"** formatını seçin
5. **"CREATE"** butonuna tıklayın
6. JSON dosyası otomatik indirilecek

## 📋 Adım 5: JSON Dosyasını Backend'e Ekle

1. İndirilen JSON dosyasının adını **`google-credentials.json`** olarak değiştirin
2. Bu dosyayı **`backend`** klasörüne taşıyın:
   ```
   tercihAI/
   └── backend/
       ├── server.js
       ├── google-sheets-service.js
       └── google-credentials.json  ← BURAYA
   ```

## 📋 Adım 6: .gitignore'a Ekle

Güvenlik için credentials dosyasını git'e eklemeyin:

```bash
# .gitignore dosyasına ekleyin
backend/google-credentials.json
```

## ✅ Test Etme

1. Backend'i yeniden başlatın:
   ```bash
   cd backend
   npm start
   ```

2. Frontend'de:
   - Kullanıcı bilgilerini girin
   - "Analiz Yap" butonuna tıklayın
   - Çıkan üniversitelerin "Detaylar" butonuna tıklayın
   - Gitmek istediğiniz üniversiteleri seçin (checkbox)
   - **"Seçilenleri Google Sheets'e Aktar"** butonuna tıklayın
   - Yeni bir Google Sheets oluşturulacak ve otomatik açılacak!

## 🔐 JSON Dosyası Örnek Yapısı

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "terchai-sheets@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🚨 Sorun Giderme

### "Google authentication başarısız"
- `backend/google-credentials.json` dosyasının var olduğundan emin olun
- JSON dosyasının geçerli olduğunu kontrol edin
- Google Sheets API ve Google Drive API'nin etkinleştirildiğini kontrol edin

### "Permission denied"
- Service account'a **Editor** rolü verildiğinden emin olun
- Google Sheets API ve Drive API'nin etkinleştirildiğini kontrol edin

### "File not found"
- JSON dosyasının adının **tam olarak** `google-credentials.json` olduğundan emin olun
- Dosyanın `backend` klasörünün içinde olduğunu kontrol edin

## 📝 Önemli Notlar

1. **Service Account Email**: JSON dosyasındaki `client_email` değerini not alın. Bu email ile oluşturulan sheets'ler bu hesaba ait olacak.

2. **Güvenlik**: 
   - **ASLA** `google-credentials.json` dosyasını GitHub'a push etmeyin
   - `.gitignore` dosyasına eklediğinizden emin olun
   - Bu dosya uygulamanıza tam erişim sağlar

3. **Oluşturulan Sheets**:
   - Service account tarafından oluşturulan sheets otomatik olarak herkese görüntüleme izni verilir
   - Kullanıcı email'i belirtilirse, kullanıcıya düzenleme izni de verilir

4. **API Limitleri**:
   - Google Sheets API günde 300 okuma/yazma isteği sınırı vardır (ücretsiz tier)
   - Daha fazla istek için Google Cloud Console'dan quota artışı talep edebilirsiniz

## 🔗 Faydalı Linkler

- Google Cloud Console: https://console.cloud.google.com/
- Google Sheets API Docs: https://developers.google.com/sheets/api
- Service Account Rehberi: https://cloud.google.com/iam/docs/service-accounts
- API Quotas: https://console.cloud.google.com/apis/api/sheets.googleapis.com/quotas
