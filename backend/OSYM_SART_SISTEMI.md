# 📋 ÖSYM Şart Maddesi Entegrasyonu

## 🎯 Özellik Özeti

Tercih AI artık ÖSYM'nin resmi tercih kılavuzundaki **şart maddelerini** her üniversite için otomatik olarak gösteriyor!

### ✨ Neler Değişti?

- ✅ Her üniversite önerisinde şart maddeleri gösteriliyor
- ✅ Şart maddeleri kategorilendirilmiş (Cinsiyet, Sağlık, Dil, Ücret, vs.)
- ✅ 25+ farklı şart tanımı sisteme entegre edildi
- ✅ Admin panelden şart yönetimi

## 📊 Şart Maddesi Örnekleri

| Madde No | Açıklama | Kategori |
|----------|----------|----------|
| 1 | Kontenjanın %50'si sadece kız öğrencilere aittir | Cinsiyet |
| 5 | Renk körlüğü olanlar kabul edilmez | Sağlık |
| 12 | İngilizce hazırlık sınıfı zorunludur | Dil |
| 14 | Program %100 İngilizce eğitim vermektedir | Dil |
| 16 | Ücretli (Vakıf) program, burs imkanları mevcuttur | Ücret |
| 23 | Tam burslu öğrenci alınmaktadır | Burs |

## 🔧 Kurulum

### 1. Veritabanı Tablolarını Oluştur

```bash
cd backend
node setup-osym-data.js
```

Bu komut:
- `program_conditions` tablosunu oluşturur
- `condition_definitions` tablosunu oluşturur
- 25 adet şart tanımı ekler
- Popüler bölümler için örnek veriler yükler

### 2. Sunucuyu Başlat

```bash
node server.js
```

Sunucu başlatıldığında ÖSYM verileri otomatik yüklenir.

## 📡 API Endpoints

### Kullanıcı Endpoint'leri

#### Tüm Şart Tanımlarını Getir
```
GET /api/conditions/definitions
```

Yanıt:
```json
{
  "conditions": [
    {
      "conditionNumber": "1",
      "conditionText": "Kontenjanın %50'si sadece kız öğrencilere aittir",
      "category": "Cinsiyet"
    },
    ...
  ]
}
```

#### Üniversite Şartlarını Getir
```
GET /api/conditions/:university/:program
```

Örnek:
```
GET /api/conditions/Boğaziçi%20Üniversitesi/Bilgisayar%20Mühendisliği
```

Yanıt:
```json
{
  "conditions": [
    {
      "conditionNumber": "14",
      "conditionText": "Program %100 İngilizce eğitim vermektedir",
      "category": "Dil"
    },
    {
      "conditionNumber": "12",
      "conditionText": "İngilizce hazırlık sınıfı zorunludur",
      "category": "Dil"
    }
  ]
}
```

### Admin Endpoint'leri (Token Gerekli)

#### ÖSYM Verilerini Yenile
```
POST /api/admin/refresh-osym
Authorization: Bearer {token}
```

#### Tüm Program Şartlarını Listele
```
GET /api/admin/program-conditions
Authorization: Bearer {token}
```

## 🎨 Frontend Entegrasyonu

### Kullanıcı Analiz Sonuçlarında Şartlar

```javascript
// Tercih analizi sonucu
{
  "universities": [
    {
      "name": "Boğaziçi Üniversitesi",
      "city": "İstanbul",
      "ranking": 3000,
      "conditions": [
        {
          "number": "14",
          "text": "Program %100 İngilizce eğitim vermektedir",
          "category": "Dil"
        }
      ],
      "conditionNumbers": "14, 12"  // Hızlı gösterim için
    }
  ]
}
```

### Frontend'de Gösterim

```html
<div class="university-card">
    <h3>Boğaziçi Üniversitesi</h3>
    <p>İstanbul - Taban: 3.000</p>
    
    <div class="conditions">
        <h4>📋 Şartlar:</h4>
        <span class="condition-badge">Madde 14, 12</span>
        
        <!-- Detaylı gösterim -->
        <div class="condition-details">
            <span class="badge badge-language">Dil</span>
            <p>14: Program %100 İngilizce eğitim vermektedir</p>
            <p>12: İngilizce hazırlık sınıfı zorunludur</p>
        </div>
    </div>
</div>
```

## 🗄️ Veritabanı Yapısı

### program_conditions Tablosu
```sql
CREATE TABLE program_conditions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    universityCode VARCHAR(20),
    universityName VARCHAR(255) NOT NULL,
    programCode VARCHAR(20),
    programName VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    campus VARCHAR(255),
    conditionNumber VARCHAR(10),
    type ENUM('Devlet', 'Vakıf'),
    year INT DEFAULT 2024,
    UNIQUE KEY (universityCode, programCode, conditionNumber, year)
);
```

### condition_definitions Tablosu
```sql
CREATE TABLE condition_definitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conditionNumber VARCHAR(10) NOT NULL UNIQUE,
    conditionText TEXT NOT NULL,
    category VARCHAR(100),
    year INT DEFAULT 2024
);
```

## 📝 Yeni Şart Ekleme

### Manuel Ekleme
```sql
INSERT INTO condition_definitions (conditionNumber, conditionText, category)
VALUES ('26', 'Yeni şart açıklaması', 'Kategori');
```

### Program-Şart Eşleştirme
```sql
INSERT INTO program_conditions 
(universityCode, universityName, programCode, programName, city, campus, conditionNumber, type, year)
VALUES 
('100110001', 'Boğaziçi Üniversitesi', '100110001', 'Bilgisayar Mühendisliği', 'İstanbul', 'Bebek', '26', 'Devlet', 2024);
```

## 🔄 Veri Güncelleme Stratejisi

### Otomatik Güncelleme (Önerilen)
```javascript
// Cron job ile her yıl güncelle
const cron = require('node-cron');

// Her yıl Temmuz ayında güncelle
cron.schedule('0 0 1 7 *', async () => {
    await refreshAllData();
});
```

### Manuel Güncelleme
Admin panelden "ÖSYM Verilerini Güncelle" butonuna tıklayın.

## 📚 Şart Kategorileri

| Kategori | Açıklama | Örnek Maddeler |
|----------|----------|----------------|
| Cinsiyet | Cinsiyet bazlı kontenjan ayrımları | 1, 2, 3, 4 |
| Sağlık | Sağlık durumu gereklilikleri | 5, 7 |
| Fiziksel | Boy, kilo gibi fiziksel şartlar | 6 |
| Dil | İngilizce/yabancı dil gereklilikleri | 12, 13, 14 |
| Ücret | Ücretli program bilgileri | 16, 17 |
| Burs | Burs imkanları | 23, 24 |
| Öğretim Şekli | Normal/İkinci/Açık/Uzaktan | 18, 19, 20, 21 |
| Ek Puan | KPSS, DGS, yetenek sınavı | 8, 9, 10, 15 |

## 🧪 Test

### Backend Test
```bash
cd backend
node setup-osym-data.js
```

### API Test
```bash
# Şart tanımlarını getir
curl http://localhost:3000/api/conditions/definitions

# Boğaziçi Bilgisayar Mühendisliği şartları
curl "http://localhost:3000/api/conditions/Boğaziçi%20Üniversitesi/Bilgisayar%20Mühendisliği"
```

## ⚠️ Önemli Notlar

1. **ÖSYM Verileri Değişkendir**: Her yıl ÖSYM yeni kılavuz yayınlar, şartlar değişebilir
2. **Manuel Güncelleme Gerekir**: Şu anda otomatik PDF parsing yok, veriler manuel girilmeli
3. **Yıl Kontrolü**: Her yıl için ayrı veriler tutulur (`year` kolonu)
4. **Şart Numaraları**: ÖSYM'nin resmi numaralandırmasına uygun olmalı

## 🚀 Gelecek Geliştirmeler

- [ ] ÖSYM PDF'lerinden otomatik veri çekme
- [ ] Şartları dinamik filtreleme (Frontend)
- [ ] Şart ihlallerini tespit etme (örn: renk körlüğü uyarısı)
- [ ] Şart bazlı akıllı öneriler
- [ ] Şart değişiklik bildirimleri

## 📞 Destek

Sorun yaşarsanız:
1. `setup-osym-data.js` script'ini tekrar çalıştırın
2. MySQL servisinin çalıştığından emin olun
3. Log dosyalarını kontrol edin

---

**Tercih AI** - Artık ÖSYM şartlarıyla entegre! 🎓📋
