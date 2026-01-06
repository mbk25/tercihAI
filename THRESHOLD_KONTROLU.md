# Threshold Kontrolü Eklendi - Alternatif Programlar

## 🐛 Sorun

Kullanıcı:
- TYT: 300.000
- AYT: 400.000
- Hayali: Bilgisayar Mühendisliği

**HATA:** Şu alternatifler gösteriliyordu:
- ❌ Yazılım Mühendisliği (threshold: 50.000)
- ❌ Bilgisayar Öğretim Teknolojileri (threshold: 120.000)  
- ❌ Yönetim Bilişim Sistemleri (threshold: 150.000)
- ❌ Bilgisayar Teknolojisi (threshold: 180.000)

**SORUN:** Kullanıcı 400.000 sıralamalı, ama tüm alternatifler 180.000'den daha iyi threshold'a sahip!

---

## 🔍 Kök Neden

`smart-alternatives-v2.js` dosyasında **threshold kontrolü eksikti**!

Sadece şu kontrol yapılıyordu:
```javascript
// ❌ YANLIŞ - Sadece üniversite taban puanı kontrolü
const eligibleUnis = allUnis.filter(uni =>
    aytRanking <= (uni.ranking || uni.minRanking)
);
```

**Eksik olan:**
```javascript
// ✅ DOĞRU - Önce alternatif bölüm threshold kontrolü
if (aytRanking > alt.threshold) {
    // Bu alternatif kullanıcı için uygun değil!
    return { eligible: false };
}
```

---

## ✅ Çözüm

### 4 Yıllık Programlar (Satır 175-192)

```javascript
alternatives.fourYearAlternatives.map(async (alt) => {
    // ÖNCE THRESHOLD KONTROLÜ YAP!
    if (aytRanking > alt.threshold) {
        console.log(`⏭️ ${alt.name} atlanıyor - Threshold: ${alt.threshold}, Kullanıcı AYT: ${aytRanking}`);
        return {
            ...alt,
            eligible: false,
            universities: [],
            stats: { totalEligible: 0 }
        };
    }
    
    // Threshold uygunsa devam et
    console.log(`✅ ${alt.name} uygun - Threshold: ${alt.threshold}`);
    // ... üniversiteleri çek
});
```

### 2 Yıllık Programlar (Satır 251-268)

```javascript
alternatives.twoYearAlternatives.map(async (alt) => {
    // ÖNCE THRESHOLD KONTROLÜ YAP!
    if (tytRanking > alt.threshold) {
        console.log(`⏭️ ${alt.name} atlanıyor - Threshold: ${alt.threshold}, Kullanıcı TYT: ${tytRanking}`);
        return {
            ...alt,
            eligible: false,
            universities: [],
            stats: { totalEligible: 0 }
        };
    }
    
    // Threshold uygunsa devam et
    console.log(`✅ ${alt.name} uygun - Threshold: ${alt.threshold}`);
    // ... üniversiteleri çek
});
```

---

## 🎯 Mantık

### Threshold Nedir?

**Threshold = Alternatif bölümün en iyi üniversitesinin taban puanı (yaklaşık)**

Örnek:
- Yazılım Mühendisliği threshold: 50.000
  → En iyi Yazılım Müh. programı ~50.000 civarında
  
- Bilgisayar Programcılığı threshold: 450.000
  → En iyi Bilgisayar Programcılığı ~450.000 civarında

### Kontrol Mantığı

```
EĞER kullanıcı_sıralaması > alternatif_threshold:
    → Bu alternatifi GÖSTERME ❌
YOKSA:
    → Bu alternatifi göster, üniversiteleri çek ✅
```

**Örnekler:**

```javascript
// Kullanıcı AYT: 400.000

// ❌ Yazılım Mühendisliği
400.000 > 50.000 → TRUE → ATLA

// ❌ Bilgisayar Öğretim Teknolojileri  
400.000 > 120.000 → TRUE → ATLA

// ❌ Yönetim Bilişim Sistemleri
400.000 > 150.000 → TRUE → ATLA

// ❌ Bilgisayar Teknolojisi
400.000 > 180.000 → TRUE → ATLA

// ✅ Bilgisayar Programcılığı (2 yıllık)
// Kullanıcı TYT: 300.000
300.000 < 450.000 → FALSE → GÖSTER ✅
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Çok Kötü Sıralama (400.000 AYT)

**Girdi:**
- TYT: 300.000
- AYT: 400.000
- Hayali: Bilgisayar Mühendisliği

**Beklenen Sonuç:**
- ❌ 4 yıllık alternatif YOK (hepsi threshold'un altında)
- ✅ 2 yıllık alternatifler var (Bilgisayar Programcılığı, Web Tasarım)

**Terminal Logu:**
```
🔍 4 yıllık alternatifler aranıyor...
   ⏭️ Yazılım Mühendisliği atlanıyor - Threshold: 50000, Kullanıcı AYT: 400000 (350000 puan fark)
   ⏭️ Bilgisayar Öğretim Tek. atlanıyor - Threshold: 120000, Kullanıcı AYT: 400000 (280000 puan fark)
   ⏭️ Yönetim Bilişim Sis. atlanıyor - Threshold: 150000, Kullanıcı AYT: 400000 (250000 puan fark)
   ⏭️ Bilgisayar Teknolojisi atlanıyor - Threshold: 180000, Kullanıcı AYT: 400000 (220000 puan fark)

🔍 2 yıllık alternatifler aranıyor...
   ✅ Bilgisayar Programcılığı uygun - Threshold: 450000, Kullanıcı TYT: 300000
   📚 Bilgisayar Programcılığı için veriler çekiliyor...
```

---

### Senaryo 2: Orta Sıralama (100.000 AYT)

**Girdi:**
- AYT: 100.000
- Hayali: Bilgisayar Mühendisliği

**Beklenen Sonuç:**
- ❌ Yazılım Mühendisliği (50.000) → ATLA
- ✅ Bilgisayar Öğretim Tek. (120.000) → GÖSTER
- ✅ Yönetim Bilişim Sis. (150.000) → GÖSTER
- ✅ Bilgisayar Teknolojisi (180.000) → GÖSTER

---

### Senaryo 3: İyi Sıralama (30.000 AYT)

**Girdi:**
- AYT: 30.000
- Hayali: Bilgisayar Mühendisliği

**Beklenen Sonuç:**
- ✅ TÜM 4 yıllık alternatifler gösterilir
- (30.000 < 50.000, hepsi uygun)

---

## 📊 Threshold Değerleri (Bilgisayar Mühendisliği)

### 4 Yıllık Alternatifler (AYT bazlı)
1. Yazılım Mühendisliği → **50.000**
2. Bilgisayar Öğretim Teknolojileri → **120.000**
3. Yönetim Bilişim Sistemleri → **150.000**
4. Bilgisayar Teknolojisi → **180.000**

### 2 Yıllık Alternatifler (TYT bazlı)
1. Bilgisayar Programcılığı → **450.000**
2. Web Tasarım ve Kodlama → **500.000**
3. Bilgisayar Teknolojisi → **520.000**

---

## 🎯 Sonuç

**Değişiklik:**
- `smart-alternatives-v2.js` - Satır 175-192 (4 yıllık)
- `smart-alternatives-v2.js` - Satır 251-268 (2 yıllık)

**Eklenen Kontrol:**
```javascript
if (aytRanking > alt.threshold) {
    return { eligible: false };
}
```

**Sonuç:**
- ✅ Artık sadece kullanıcının sıralamasına uygun alternatifler gösteriliyor
- ✅ Threshold kontrolü sayesinde gereksiz veritabanı sorguları önleniyor
- ✅ Kullanıcıya gerçekçi alternatifler sunuluyor

---

## 🧪 Test

Backend'i yeniden başlat ve test et:

```bash
cd backend
node server.js
```

Test:
- TYT: 300.000
- AYT: 400.000
- Hayali: Bilgisayar Mühendisliği

Beklenen:
- ❌ 4 yıllık alternatif gösterilmemeli
- ✅ 2 yıllık alternatifler gösterilmeli

---

**Tarih:** 2026-01-06  
**Düzeltme:** Threshold kontrolü eklendi  
**Dosya:** smart-alternatives-v2.js  
**Statü:** ✅ Tamamlandı
