# YÖK Atlas Veri Çekme Sistemi

Türkiye'deki **tüm üniversitelerin** ve **tüm bölümlerin** verilerini YÖK Atlas'tan otomatik olarak çeken kapsamlı bir sistem.

## 🎯 Özellikler

- ✅ **200+** farklı bölüm/program
- ✅ **3000+** üniversite programı (devlet + vakıf)
- ✅ **81** şehir coverage
- ✅ Taban puanlar, kontenjanlar, yerleşen sayıları
- ✅ Eğitim dili ve tür bilgileri
- ✅ Burs/ücret bilgileri (vakıf üniversiteleri için)
- ✅ Checkpoint sistemi (kaldığı yerden devam edebilme)
- ✅ Progress tracking ve raporlama

## 📊 Veri Formatı

Her üniversite programı için şu bilgiler çekilir:

```json
{
  "name": "İstanbul Üniversitesi",
  "type": "Devlet",
  "city": "İstanbul",
  "campus": "Avcılar Kampüsü",
  "program": "Bilgisayar Programcılığı",
  "quota": 70,
  "enrolled": 70,
  "minRanking": 198456,
  "minScore": 265.48,
  "language": "Türkçe",
  "educationType": "Örgün Öğretim",
  "scholarship": null
}
```

## 🚀 Hızlı Başlangıç

### 1. Test Mod (Önerilen İlk Adım)

İlk olarak küçük bir test yapın (5 bölüm):

```bash
node backend/test-yok-scraper.js
```

Bu komut:
- İlk 5 bölümü tarar
- Her bölüm için üniversiteleri çeker
- MySQL'e ve JSON'a kaydeder
- ~5-10 dakika sürer

### 2. Toplu Veri Çekme

Tüm Türkiye için veri çekmek:

```bash
node backend/batch-scrape-all-programs.js
```

**Süre:** ~2-3 saat  
**Sonuç:** 3000+ program verisi

### 3. Özelleştirilmiş Kullanım

#### Belirli bölüm aralığı

```bash
# İlk 50 bölümü çek
node backend/batch-scrape-all-programs.js --start=0 --limit=50

# 100. bölümden sonraki 30 bölümü çek
node backend/batch-scrape-all-programs.js --start=100 --limit=30
```

#### Hız ayarlama

```bash
# Daha yavaş (server yükünü azaltmak için)
node backend/batch-scrape-all-programs.js --delay=5000

# Daha hızlı (risk: IP ban)
node backend/batch-scrape-all-programs.js --delay=1000
```

#### Sadece JSON'a kaydet

```bash
# Veritabanına kaydetme, sadece JSON dosyaları oluştur
node backend/batch-scrape-all-programs.js --no-db
```

## 📁 Çıktı Dosyaları

### JSON Dosyaları

Tüm veriler `backend/scraped-data/` klasörüne kaydedilir:

```
backend/scraped-data/
├── bilgisayar-muhendisligi.json
├── yazilim-muhendisligi.json
├── bilgisayar-programciligi.json
├── elektrik-elektronik-muhendisligi.json
└── ...
```

### Veritabanı

Veriler MySQL `universities` tablosuna kaydedilir.

**Kontrol sorguları:**

```sql
-- Toplam kayıt sayısı
SELECT COUNT(*) FROM universities;

-- İstanbul'daki Bilgisayar Mühendisliği programları
SELECT * FROM universities 
WHERE city LIKE '%İstanbul%' 
AND department = 'Bilgisayar Mühendisliği'
ORDER BY minRanking;

-- Şehir bazında dağılım
SELECT city, COUNT(*) as total 
FROM universities 
GROUP BY city 
ORDER BY total DESC 
LIMIT 20;

-- Bölüm bazında sayılar
SELECT department, COUNT(*) as total 
FROM universities 
GROUP BY department 
ORDER BY total DESC 
LIMIT 20;
```

### Checkpoint Dosyası

İlerleme `backend/scraping-checkpoint.json` dosyasına kaydedilir. Bu dosya:
- Her 10 bölümde bir güncellenir
- Toplam istatistikleri içerir
- Kesintide kaldığı yeri gösterir

## 🔧 Gereksinimler

### NPM Paketleri

```json
{
  "puppeteer": "^24.30.0",
  "axios": "^1.13.2",
  "mysql2": "^3.15.3"
}
```

### MySQL Veritabanı

Veritabanı şeması otomatik oluşturulur. Eğer manuel oluşturmak isterseniz:

```bash
node backend/db.js
# veya
node backend/setup-db.js
```

## ⚙️ Ayarlar

### Rate Limiting

Scriptler YÖK Atlas'ı aşırı yüklemeden çalışacak şekilde optimize edilmiştir:

- **Bölümler arası gecikme:** 2000ms (2 saniye)
- **Üniversiteler arası gecikme:** 500ms (0.5 saniye)

Bu değerleri değiştirmek için `--delay` parametresini kullanın.

### Veritabanı Bağlantısı

Backend `.env` dosyasını düzenleyin:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tercihAI
DB_PORT=3306
```

## 📈 İlerleme Takibi

Script çalışırken şu bilgileri gösterir:

```
[45/187] Bilgisayar Mühendisliği
────────────────────────────────────────────────────────
   📊 78 üniversite bulundu
   İşleniyor: 78/78 üniversite...
   ✅ 78 üniversite verisi çekildi
   💾 Veritabanı: 78 kayıt
   💾 JSON: ./scraped-data/bilgisayar-muhendisligi.json
```

Her 20 bölümde bir özet rapor:

```
════════════════════════════════════════════════════════
📊 İLERLEME RAPORU
════════════════════════════════════════════════════════
İşlenen: 40/187 bölüm
Başarılı: 38 | Başarısız: 2
Toplam üniversite: 1845
Geçen süre: 42 dakika
Kalan süre (tahmini): 98 dakika
════════════════════════════════════════════════════════
```

## 🛠️ Sorun Giderme

### "Bölüm kodu bulunamadı" hatası

YÖK Atlas'ın yapısı değişmiş olabilir. `yok-atlas-comprehensive-scraper.js` dosyasındaki `getAllProgramCodes` fonksiyonunu kontrol edin.

### IP Ban / Rate Limit

Eğer YÖK Atlas'tan IP ban aldıysanız:

1. `--delay` parametresini artırın (örn: `--delay=5000`)
2. Birkaç saat bekleyin
3. VPN kullanmayı deneyin

### Veritabanı Bağlantı Hatası

```bash
# Veritabanı bağlantısını test et
node backend/db.js
```

MySQL'in çalıştığından ve `.env` dosyasındaki bilgilerin doğru olduğundan emin olun.

### Eksik Veriler

Bazı üniversiteler için bazı alanlar NULL olabilir. Bu normal bir durumdur çünkü YÖK Atlas'ta her program için tüm bilgiler mevcut olmayabilir.

## 📝 Gelişmiş Kullanım

### Programatik Kullanım

```javascript
const { scrapeAllPrograms } = require('./yok-atlas-comprehensive-scraper');

async function customScraping() {
  await scrapeAllPrograms({
    startFrom: 50,
    limit: 100,
    delayBetweenPrograms: 3000,
    delayBetweenUniversities: 750,
    saveToDb: true,
    saveJson: true
  });
}

customScraping();
```

### Sadece Belirli Bir Bölüm

```javascript
const { 
  scrapeProgramUniversities,
  scrapeProgramDetails 
} = require('./yok-atlas-comprehensive-scraper');

// Manuel olarak belirli bir bölüm için
const programCode = '10002'; // Bilgisayar Mühendisliği
// ... implementation
```

## 📊 Beklenen Sonuçlar

Başarılı bir tam tarama sonrası:

- ✅ **3000-3500** üniversite programı kaydı
- ✅ **150-200** farklı bölüm
- ✅ **81** şehir coverage
- ✅ **%95+** veri bütünlüğü

## 🤝 Katkıda Bulunma

Hata bulursanız veya öneriniz varsa lütfen bildirin!

## ⚖️ Yasal Not

Bu script eğitim amaçlıdır. YÖK Atlas'ın kullanım şartlarına uygun şekilde kullanılmalıdır. Aşırı yük oluşturmamak için rate limiting kullanılmıştır.

## 📄 Lisans

MIT License - Kendi sorumluluğunuzda kullanın.
