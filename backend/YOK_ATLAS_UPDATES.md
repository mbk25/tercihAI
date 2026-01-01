# YÖK Atlas Veri Çekme Sistemi - GÜNCELLEMELER

## ✅ Yeni Özellikler

### 1. **Tek JSON Dosyası**
Artık tüm veriler `all-universities.json` tek dosyasında toplan

ıyor 📄

### 2. **Ön Lisans Programları**
- **Lisans programları** (`~640 bölüm`)
- **Önlisans programları** (`~240 bölüm`) ✨ YENİ!
- **Toplam: ~880 bölüm**

### 3. **Vakıf + Devlet Üniversiteleri**
Her iki tür üniversite de çekiliyor ✅

## 🚀 Hızlı Kullanım

```bash
# Test (5 bölüm - hem lisans hem önlisans)
cd backend
node test-yok-scraper.js

# Tüm Türkiye (lisans + önlisans)
node batch-scrape-all-programs.js
```

## 📊 Çıktı Formatı

Tüm veriler `all-universities.json` dosyasında:

```json
[
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
  },
  ...
]
```

## 📈 Beklenen Sonuçlar

- **Lisans:** ~3000-3500 program
- **Önlisans:** ~1200-1500 program
- **TOPLAM:** ~4500-5000 üniversite programı
- **Tek dosya:** `all-universities.json`

## 🔍 Veri Kontrolü

```bash
# JSON dosyasını görüntüle
cat all-universities.json

# Kaç kayıt var?
(Get-Content all-universities.json | ConvertFrom-Json).Length

# Vakıf üniversiteleri
(Get-Content all-universities.json | ConvertFrom-Json) | Where-Object {$_.type -eq "Vakıf"} | Measure-Object

# Önlisans programları
(Get-Content all-universities.json | ConvertFrom-Json) | Where-Object {$_.program -like "*Önlisans*"} | Measure-Object
```
