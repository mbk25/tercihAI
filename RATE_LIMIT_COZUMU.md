# Rate Limit (429) Hatası Çözümü

## Sorun
Google Gemini API'de günlük/dakikalık istek limiti aşıldı.

## Çözümler

### 1. ✅ Yeni API Key Oluştur (ÖNERİLEN)
1. https://aistudio.google.com/app/apikey adresine git
2. **"Create API Key in New Project"** butonuna tıkla (YENİ PROJE!)
3. Yeni API key'i kopyala
4. `backend/.env` dosyasında değiştir:
   ```env
   GEMINI_API_KEY=YENİ_API_KEY_BURAYA
   ```
5. Sunucuyu yeniden başlat

**Neden yeni proje?** 
- Her proje kendi limitine sahip
- Eski key'in limiti dolmuş olabilir
- Yeni projede günlük 1500 istek hakkı var

### 2. ⏰ 24 Saat Bekle
- Gemini ücretsiz tier günlük limitler koyuyor
- Yarın saat aynı saatlerde yenilenecek

### 3. 🔄 Fallback Sistemi Aktif
Sistem şu anda otomatik olarak basit yanıtlar veriyor:
- ✅ Temel sorulara yanıt verebiliyor
- ✅ "Analiz Yap" özelliği hala çalışıyor (database'den)
- ⚠️ Sadece AI sohbet devre dışı

## Rate Limit Bilgileri

**Gemini Free Tier Limitleri:**
- **15 istek/dakika**
- **1500 istek/gün**
- **1 milyon token/dakika**

## Test

Yeni API key ekledikten sonra:
```bash
cd backend
npm start
```

Chat'e "test" yazın - yanıt veriyorsa çalışıyor demektir!

## Bonus: Limit Aşımını Önleme

Backend'e cache sistemi eklenmiş - aynı soru tekrar sorulursa API'yi çağırmıyor (yakında aktif olacak).
