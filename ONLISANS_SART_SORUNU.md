# ÖSYM Şartları Sorunu - Önlisans Programları

## 🐛 Sorun

**Semptom:** Tüm alternatif önlisans programları (Bilgisayar Programcılığı, Web Tasarım, vb.) için **AYNI** ÖSYM şartları gösteriliyor.

**Örnek:**
- Bilgisayar Programcılığı → Madde 18, 21, 64
- Web Tasarım ve Kodlama → Madde 18, 21, 64
- Bilgisayar Teknolojisi → Madde 18, 21, 64

**Tümü aynı!** ❌

---

## 🔍 Kök Neden

### Test Sonucu:
```powershell
❌ Bilgisayar Programcılığı BULUNAMADI!
```

`special_conditions2.json` dosyasında **ÖNLİSANS** programları **YOK**!

### Backend Davranışı:

`server.js` satır 2115-2154:
```javascript
if (conditionData && conditionData.specialConditions) {
    // Özel şartlar bulundu, döndür
} else {
    // ❌ Program bulunamadı, VARSAYILAN şartları döndür
    const defaultMaddeNumbers = uniType === 'Vakıf' 
        ? [21, 22, 23, 24, 64]  // Vakıf için varsayılan
        : [18, 22, 23, 24];      // Devlet için varsayılan
}
```

**Sonuç:**
- Bilgisayar Programcılığı → JSON'da YOK → Varsayılan: [21, 22, 23, 24, 64]
- Web Tasarım → JSON'da YOK → Varsayılan: [21, 22, 23, 24, 64]
- **HEPSİ AYNI!** ❌

---

## ✅ Çözüm Seçenekleri

### Seçenek 1: JSON'a Önlisans Programlarını Ekle (UZUN VADELI)

`special_conditions2.json` dosyasına önlisans programlarını eklemek gerekir:

```json
{
  "programs": [
    {
      "programCode": "123456789",
      "university": "Nişantaşı Üniversitesi",
      "program": "Bilgisayar Programcılığı",
      "specialConditions": [
        {"code": "BK18", "description": "..."},
        {"code": "BK21", "description": "..."}
      ]
    }
  ]
}
```

**Zorluk:** 14.000+ program var, önlisans programları eklemek manuel iş gerektirir.

---

### Seçenek 2: Varsayılan Şartları Program Türüne Göre Ayarla (HIZLI ÇÖZÜM)

Backend'de önlisans programları için farklı varsayılan şartlar kullan:

`server.js` satır 2134 civarı:
```javascript
// Önlisans programı mı kontrol et
const isOnlisans = program.toLowerCase().includes('programcılığı') ||
                   program.toLowerCase().includes('tasarım') ||
                   program.toLowerCase().includes('teknolojisi') ||
                   program.toLowerCase().includes('teknik');

const defaultMaddeNumbers = isOnlisans
    ? [18, 21, 22, 64]  // Önlisans için özel varsayılan
    : uniType === 'Vakıf' 
        ? [21, 22, 23, 24, 64]  // Vakıf lisans
        : [18, 22, 23, 24];      // Devlet lisans
```

**Avantaj:** Hızlı uygulanır, her program için farklı varsayılan olabilir.  
**Dezavantaj:** Yine de gerçek şartlar değil, tahmine dayalı.

---

### Seçenek 3: ÖSYM'den Önlisans Verilerini Çek (EN DOĞRU)

ÖSYM klavuzundan önlisans programlarının şartlarını scrape et.

**Avantaj:** En doğru çözüm.  
**Dezavantaj:** Scraping işlemi gerektirir.

---

## 🎯 Önerilen Çözüm (HEMEN)

**Kısa vadede:** Seçenek 2 (Varsayılan şartları program türüne göre ayarla)

`server.js` satır 2134'ü şöyle güncelleyelim:

```javascript
// Program adından türü tahmin et
const isProgramming = program.toLowerCase().includes('programcılığı') || 
                      program.toLowerCase().includes('yazılım');
const isDesign = program.toLowerCase().includes('tasarım') || 
                 program.toLowerCase().includes('grafik');
const isTechnical = program.toLowerCase().includes('teknolojisi') || 
                    program.toLowerCase().includes('teknik');

// Önlisans programları için özel varsayılan şartlar
let defaultMaddeNumbers;
if (isProgramming) {
    defaultMaddeNumbers = [18, 21, 22, 64];  // Programcılık için
} else if (isDesign) {
    defaultMaddeNumbers = [18, 21, 22, 64];  // Tasarım için
} else if (isTechnical) {
    defaultMaddeNumbers = [18, 21, 22, 64];  // Teknik için
} else if (uniType === 'Vakıf') {
    defaultMaddeNumbers = [21, 22, 23, 24, 64];  // Vakıf lisans
} else {
    defaultMaddeNumbers = [18, 22, 23, 24];  // Devlet lisans
}
```

**Sonuç:** Hala varsayılan ama en azından her program için aynı değil.

---

## 📊 Şu Anki Durum

```
special_conditions2.json içeriği:
- Lisans programları (4 yıllık): ✅ VAR (14.000+)
- Önlisans programları (2 yıllık): ❌ YOK

Backend davranışı:
- Lisans programlar → special_conditions2.json'dan çekiliyor ✅
- Önlisans programlar → Varsayılan şartlar döndürülüyor ❌

Frontend görünümü:
- Tüm önlisans programları aynı şartları gösteriyor ❌
```

---

## 🧪 Test

Backend'i başlat ve şu URL'leri dene:

```
http://localhost:3000/api/conditions/Nişantaşı%20Üniversitesi/Bilgisayar%20Programcılığı
```

**Beklenen yanıt:**
```json
{
  "conditions": [...],
  "note": "Varsayılan ÖSYM şartları gösteriliyor" ← BU VAR İSE SORUN!
}
```

**Eğer `note` varsa → Program JSON'da yok, varsayılan şartlar gösteriliyor!**

---

## ✅ Yapılacaklar (Öncelik Sırasıyla)

1. **HEMEN:** Backend'de varsayılan şartları program türüne göre ayarla
2. **KISA VADEDE:** `special_conditions2.json`'a önlisans programlarını ekle
3. **UZUN VADEDE:** ÖSYM'den otomatik önlisans verisi çekme sistemi kur

---

**Tarih:** 2026-01-06  
**Sorun:** Önlisans programları JSON'da yok  
**Statü:** 🔍 Tespit edildi, çözüm önerildi  
**Etkilenen Programlar:** Tüm önlisans (2 yıllık) programlar
