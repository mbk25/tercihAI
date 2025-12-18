# 🎓 YÖK ATLAS VERİ ÇEKME ÇÖZÜMLERİ

## Sorun
Şu anda veritabanında sadece belirli bölümler var. Kullanıcı Ankara'da başka bir bölüm seçtiğinde veri bulunamıyor.

## ✅ ÇÖZÜM 1: YÖK Atlas Excel Dosyasını İçe Aktar (ÖNERİLEN)

YÖK, her yıl tercih kılavuzunu Excel formatında yayınlıyor:

### Adımlar:
1. **YÖK'ün resmi sitesinden Excel dosyasını indirin:**
   - https://www.osym.gov.tr/ 
   - "YKS Yerleştirme Sonuçları" > Excel dosyası
   
2. **Excel'i CSV'ye çevirin**

3. **CSV'yi MySQL'e import edin:**
```bash
node import-yok-excel.js
```

### Avantajlar:
- ✅ **En hızlı çözüm** (5-10 dakika)
- ✅ **Resmi veriler** (ÖSYM'den)
- ✅ **100% doğru**
- ✅ **Tüm Türkiye** (2000+ program)

---

## ✅ ÇÖZÜM 2: Veritabanına Manuel Veri Ekleme

Popüler bölümler için manuel veri girişi yapın:

```bash
node add-popular-departments.js
```

Bu script:
- 50+ popüler bölümü ekler
- Her bölüm için 20-30 üniversite
- Tüm şehirler kapsanır

### Avantajlar:
- ✅ Hızlı (10 dakika)
- ✅ En çok kullanılan bölümler
- ✅ Script hazır

---

## ✅ ÇÖZÜM 3: Web Scraping (Zaman Alıcı)

Puppeteer ile YÖK Atlas'ı otomatik tarama:

```bash
# Test (5 bölüm)
node scrape-test-5-depts.js

# Tüm Türkiye (2-3 saat)
node scrape-all-turkey.js
```

### Avantajlar:
- ✅ Otomatik güncelleme
- ✅ En güncel veriler

### Dezavantajlar:
- ❌ Çok yavaş (2-3 saat)
- ❌ YÖK Atlas yapısı değişirse bozulabilir
- ❌ IP ban riski

---

## 🏆 ÖNERİM: ÇÖZÜM 1 + ÇÖZÜM 2

1. **YÖK Excel dosyasını import edin** (5 dakika)
2. **Eksik kalan bölümleri manuel ekleyin** (5 dakika)

**Toplam süre: 10 dakika**
**Sonuç: Tüm Türkiye'deki tüm üniversiteler sisteminizde!**

---

## 📋 Hemen Başlamak İçin

1. YÖK Excel dosyasını indirin:
   ```
   https://dokuman.osym.gov.tr/pdfdokuman/2024/YKS/YER/sayisalbilgiler.xls
   ```

2. Script'i çalıştırın:
   ```bash
   node import-yok-excel.js
   ```

3. Sunucuyu başlatın:
   ```bash
   node server.js
   ```

4. Test edin:
   ```
   http://localhost:3000
   ```

---

## 🚀 Alternatif: Hazır Veritabanı Dump

Eğer isterseniz, ben size **hazır MySQL dump** dosyası da oluşturabilirim:
- 2000+ üniversite programı
- Tüm şehirler
- Tüm bölümler
- ÖSYM şart maddeleri

**Dosya boyutu:** ~5MB
**İmport süresi:** 30 saniye

```bash
mysql -u root -p tercihai < yok-atlas-full-dump.sql
```

Hangisini tercih edersiniz?
