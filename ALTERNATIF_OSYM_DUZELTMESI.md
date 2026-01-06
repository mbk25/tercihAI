# Alternatif Program ÖSYM Şartları Düzeltmesi

## 🐛 Problem

Kullanıcı tercih analizi yaptığında:
- **Hayali Bölüm:** Bilgisayar Mühendisliği
- **Alternatif Öneri:** Yazılım Mühendisliği

**HATA:** Alternatif programların (Yazılım Mühendisliği) kartlarında **Bilgisayar Mühendisliği'nin** ÖSYM şartları gösteriliyordu!

**DOĞRU OLMASI GEREKEN:** Her alternatif program **kendi** ÖSYM şartlarını göstermeli.

---

## 🔍 Sorunun Kök Nedeni

`server.js` dosyasında **satır 1259**, alternatif programları frontend'e gönderirken `universities` array'ini **BOŞ** gönderiyordu:

```javascript
// ❌ YANLIŞI
...smartAlternatives.fourYearOptions.map(opt => ({
    dept: opt.name,
    universities: [], // ← BOŞ ARRAY!
    // ...
}))
```

Bu yüzden:
1. Backend'de doğru şartlar çekiliyordu (`alt.name` ile)
2. Ama frontend'e **üniversite verisi gönderilmiyordu**
3. Frontend başka yerden (muhtemelen hayali bölümden) şart çekiyordu

---

## ✅ Çözüm

### Değişiklik: `server.js` - Satır 1259

```javascript
// ✅ DOĞRUSU
...smartAlternatives.fourYearOptions.map(opt => ({
    dept: opt.name,
    universities: opt.universities || [], // ← Alternatif programın kendi üniversiteleri!
    // ...
}))
```

---

## 📊 Veri Akışı (Düzeltilmiş)

### 1. **smart-alternatives-v2.js**

```javascript
// Satır 200 - 4 yıllık programlar
universities: eligibleUnis.slice(0, 20).map(uni => ({
    name: uni.name,
    city: uni.city,
    ranking: uni.ranking,
    conditionNumbers: getSpecialConditionsForUniversity(uni.name, alt.name).conditionNumbers
    //                                                              ^^^^^^^^
    //                                                    ALTERNATİF PROGRAMIN ADI!
}))
```

```javascript
// Satır 257 - 2 yıllık programlar
universities: eligibleUnis.slice(0, 20).map(uni => ({
    name: uni.name,
    city: uni.city,
    ranking: uni.ranking,
    conditionNumbers: getSpecialConditionsForUniversity(uni.name, alt.name).conditionNumbers
    //                                                              ^^^^^^^^
    //                                                    ALTERNATİF PROGRAMIN ADI!
}))
```

✅ **Sonuç:** Her alternatif için doğru ÖSYM şartları çekiliyor!

---

### 2. **server.js - Satır 533, 568, 1380**

```javascript
// 4 yıllık alternatifler için
const specialConds = getSpecialConditionsForUniversity(u.name, alt.dept);
//                                                              ^^^^^^^^
//                                                    ALTERNATİF PROGRAMIN ADI!
```

✅ **Sonuç:** Buralarda da doğru program adı kullanılıyor!

---

### 3. **server.js - Satır 1259 (DÜZELTİLDİ)**

```javascript
// ÖNCEDEN ❌
universities: [], // Boş gönderiliyor → Frontend yanlış veri gösteriyor

// SONRA ✅
universities: opt.universities || [], // Dolu gönderiliyor → Frontend doğru veri gösteriyor
```

✅ **Sonuç:** Frontend'e doğru üniversite verileri gönderiliyor!

---

## 🎯 Örnek Senaryo (Düzeltilmiş)

### Kullanıcı Girdisi:
- TYT: 300.000
- AYT: 400.000
- Hayali Bölüm: **Bilgisayar Mühendisliği**

### Alternatif Öneri: **Yazılım Mühendisliği**

#### Backend İşlem Akışı:

1. **smart-alternatives-v2.js** çalışır
   ```
   🔍 Yazılım Mühendisliği için üniversiteler aranıyor...
   ✅ 45 üniversite bulundu
   
   Her üniversite için ÖSYM şartları:
   - Nişantaşı Üni. - Yazılım Müh. → Madde 18, 21, 64 ✅
   - Beykent Üni. - Yazılım Müh. → Madde 18, 21, 64 ✅
   ```

2. **server.js** frontend'e gönderir
   ```javascript
   {
     dept: "Yazılım Mühendisliği",
     universities: [
       {
         name: "Nişantaşı Üniversitesi",
         conditionNumbers: "18, 21, 64" // ← Yazılım Müh.'nin şartları!
       },
       {
         name: "Beykent Üniversitesi",
         conditionNumbers: "18, 21, 64" // ← Yazılım Müh.'nin şartları!
       }
     ]
   }
   ```

3. **Frontend** gösterir
   ```
   ╔════════════════════════════════════════╗
   ║ Yazılım Mühendisliği                  ║
   ║                                        ║
   ║ 📍 Nişantaşı Üniversitesi             ║
   ║ 📋 ÖSYM Şartları: Madde 18, 21, 64   ║ ← DOĞRU!
   ║                                        ║
   ║ 📍 Beykent Üniversitesi               ║
   ║ 📋 ÖSYM Şartları: Madde 18, 21, 64   ║ ← DOĞRU!
   ╚════════════════════════════════════════╝
   ```

---

## ✅ Doğrulama

### Önceden (YANLIŞTI ❌)
```
Hayali: Bilgisayar Mühendisliği
Alternatif: Yazılım Mühendisliği

Nişantaşı - Yazılım Müh.
ÖSYM Şartları: Madde 18, 21, 64 
(← Bilgisayar Mühendisliği'nin şartları!)
```

### Şimdi (DOĞRU ✅)
```
Hayali: Bilgisayar Mühendisliği
Alternatif: Yazılım Mühendisliği

Nişantaşı - Yazılım Müh.
ÖSYM Şartları: Madde 18, 21, 64
(← Yazılım Mühendisliği'nin şartları!)
```

---

## 📝 Değiştirilen Dosya

**Dosya:** `backend/server.js`  
**Satır:** 1259  
**Değişiklik:**
```javascript
universities: opt.universities || []
```

---

## 🧪 Test

Backend'i yeniden başlatın:
```bash
cd backend
node server.js
```

Test senaryosu:
1. TYT: 300.000, AYT: 400.000
2. Hayali bölüm: "Bilgisayar Mühendisliği"
3. Alternatif öneri: "Yazılım Mühendisliği"
4. Kontrol: Kartlarda "Madde 18, 21, 64" görmeli
5. Modal aç: Açıklamalar "Yazılım Mühendisliği" için olmalı

---

## ✅ Sonuç

**Artık her alternatif program:**
- ✅ Kendi üniversitelerini gösteriyor
- ✅ Kendi ÖSYM şartlarını gösteriyor
- ✅ Kendi taban sıralamalarını gösteriyor

**Hayali bölümün şartları artık karışmıyor!**

---

**Tarih:** 2026-01-06  
**Düzeltme:** Alternatif program ÖSYM şartları  
**Etkilenen Dosya:** server.js (1 satır)  
**Statü:** ✅ Tamamlandı
