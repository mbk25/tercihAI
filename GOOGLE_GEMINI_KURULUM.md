# Google Gemini AI Kurulumu

## 1. API Key Alma

1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresine gidin
2. "Get API Key" veya "Create API Key" butonuna tıklayın
3. API anahtarınızı kopyalayın

## 2. Backend Yapılandırma

`backend/.env` dosyasını açın ve API key'inizi ekleyin:

```env
# Google Gemini API Key (ÜCRETSİZ!)
GEMINI_API_KEY=AIzaSy...buraya_api_keyinizi_yapistiriniz

# Hangi AI kullanılsın?
AI_PROVIDER=gemini
```

## 3. Sunucuyu Başlatın

```bash
cd backend
npm start
```

## Özellikler

✅ **Tamamen Ücretsiz** - Günlük 60 istek limiti
✅ **Hızlı** - Gemini 2.0 Flash modeli kullanılıyor
✅ **Akıllı** - GPT-4 seviyesinde yanıtlar
✅ **Türkçe Desteği** - Doğal Türkçe konuşma

## Kullanım

API key ekledikten sonra sistem otomatik olarak Google Gemini kullanacak. WebLLM tamamen kaldırıldı.

Chat ekranında artık model indirme yok, direk AI yanıt vermeye başlayacak!
