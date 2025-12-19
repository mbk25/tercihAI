# Groq API Kurulumu (ÖNERİLEN - Hızlı ve Ücretsiz!)

## Neden Groq?

✅ **Tamamen Ücretsiz** - Kredi kartı gerekmez
✅ **Çok Hızlı** - Saniyeler içinde yanıt
✅ **Yüksek Limit** - Günde 14,400 istek (Gemini'den 240x daha fazla!)
✅ **Akıllı Model** - Llama 3.3 70B kullanıyor (GPT-4 seviyesi)
✅ **Rate Limit Yok** - Rahatça kullanabilirsiniz

## Kurulum Adımları

### 1. API Key Alma

1. https://console.groq.com/keys adresine gidin
2. Google ile giriş yapın (veya yeni hesap oluşturun)
3. "Create API Key" butonuna tıklayın
4. API key'i kopyalayın (gsk_... ile başlıyor)

### 2. Backend Yapılandırma

`backend/.env` dosyasını açın ve şunu ekleyin:

```env
# Groq API Key (ÜCRETSİZ ve HIZLI!)
GROQ_API_KEY=gsk_...buraya_api_keyinizi_yapistiriniz

# Hangi AI kullanılsın?
AI_PROVIDER=groq
```

### 3. Sunucuyu Başlatın

```bash
cd backend
npm start
```

## Test

Chat'e "Merhaba" yazın - anında yanıt alırsanız çalışıyor demektir!

## Karşılaştırma

| Özellik | Groq | Gemini | OpenAI |
|---------|------|--------|--------|
| **Fiyat** | Ücretsiz | Ücretsiz | Ücretli |
| **Hız** | 🚀 Çok Hızlı | ⚡ Orta | ⚡ Orta |
| **Günlük Limit** | 14,400 | 1,500 | Krediye göre |
| **Model** | Llama 3.3 70B | Gemini 1.5 | GPT-4 |
| **Türkçe** | ✅ Mükemmel | ✅ Mükemmel | ✅ Mükemmel |
| **Kayıt** | Google | Google | Kredi Kartı |

## Sorun Giderme

**API Key çalışmıyor:**
- Key'in başında boşluk olmamalı
- `gsk_` ile başlamalı
- Console'da aktif olmalı

**Hala hata alıyorum:**
- `.env` dosyasını kaydettin mi?
- Sunucuyu yeniden başlattın mı?
- Konsola `echo $env:GROQ_API_KEY` yaz, çıktı geliyorsa doğru

## Başarı!

Groq ile artık:
- ⚡ Anında yanıt alacaksınız
- 🔄 Rate limit sorunu yaşamayacaksınız
- 💰 Para ödemeyeceksiniz
- 🎯 Daha akıllı yanıtlar alacaksınız

Keyifli kullanımlar! 🚀
