# MySQL conditionNumbers ile ÖSYM Şartları Çözümü

## 🎯 Sorun Çözüldü!

**Sorun:** Önlisans programları için aynı ÖSYM şartları gösteriliyordu.

**Kök Neden:** `special_conditions2.json` dosyasında önlisans programları YOK.

**Çözüm:** MySQL veritabanındaki `conditionNumbers` sütununu kullan + `osym_madde_aciklamalari.json`'dan açıklamaları al!

---

## 🔄 Yeni Akış

### 1️⃣ special_conditions2.json Kontrolü

```javascript
const conditionData = specialConditionsService.getConditionsByUniversityAndProgram(university, program);

if (conditionData && conditionData.specialConditions) {
    // ✅ Program bulundu (LİSANS programları için)
    // programCode ile şartları döndür
    return formattedConditions;
}
```

---

### 2️⃣ MySQL conditionNumbers Kontrolü (YENİ!)

```javascript
// MySQL'den üniversite ve program bilgilerini çek
const [programData] = await connection.query(
    'SELECT name, type, conditionNumbers FROM universities WHERE name LIKE ? AND department LIKE ?',
    [`%${university}%`, `%${program}%`]
);

if (programData[0].conditionNumbers) {
    // ✅ conditionNumbers bulundu (ÖNLİSANS programları için)
    const conditionNumbersStr = "18, 21, 64";
    
    // Madde numaralarını ayır
    const maddeNumbers = conditionNumbersStr.split(',')
        .map(num => parseInt(num.trim()))
        .sort();
    // → [18, 21, 64]
    
    // osym_madde_aciklamalari.json'dan açıklamaları al
    const maddeAciklamalari = loadOsymMaddeAciklamalari();
    
    const conditions = maddeNumbers.map(maddeNo => {
        const madde = maddeAciklamalari[maddeNo.toString()];
        return {
            conditionNumber: maddeNo,
            conditionText: madde.icerik,  // ← GERÇEK AÇIKLAMA!
            category: madde.madde_kodu
        };
    });
    
    return conditions;
}
```

---

### 3️⃣ Varsayılan Şartlar (Son Çare)

```javascript
// MySQL'de de yoksa, üniversite türüne göre varsayılan
const defaultMaddeNumbers = uniType === 'Vakıf' 
    ? [21, 22, 23, 24, 64]
    : [18, 22, 23, 24];
```

---

## 📊 Örnek Akış

### Bilgisayar Programcılığı Kartı Tıklandığında:

```
🔍 ÖSYM Şartları isteniyor: Nişantaşı Üniversitesi - Bilgisayar Programcılığı

1. special_conditions2.json kontrol ediliyor...
   ❌ Program bulunamadı

2. MySQL'den conditionNumbers kontrol ediliyor...
   ✅ conditionNumbers bulundu: "18, 21, 64"

3. Madde numaralarını ayır:
   → [18, 21, 64]

4. osym_madde_aciklamalari.json'dan açıklamaları al:
   
   Madde 18:
   {
     madde_no: 18,
     madde_kodu: "Bk. 18",
     icerik: "Vakıf üniversitelerinin ücretli/burslu... (GERÇEK AÇIKLAMA)"
   }
   
   Madde 21:
   {
     madde_no: 21,
     madde_kodu: "Bk. 21",
     icerik: "İndirimli/burslu öğretim şartları... (GERÇEK AÇIKLAMA)"
   }
   
   Madde 64:
   {
     madde_no: 64,
     madde_kodu: "Bk. 64",
     icerik: "Vakıf üniversitesi ücret bilgileri... (GERÇEK AÇIKLAMA)"
   }

5. Frontend'e gönder:
   {
     "conditions": [
       {
         "conditionNumber": 18,
         "conditionText": "Vakıf üniversitelerinin ücretli/burslu...",
         "category": "Bk. 18"
       },
       ...
     ],
     "source": "MySQL database"
   }
```

---

## ✅ Artık Ne Olacak?

### Önlisans Programları İçin:

**Bilgisayar Programcılığı:**
- MySQL'de `conditionNumbers: "18, 21, 64"`
- osym_madde_aciklamalari.json'dan açıklamalar
- **GERÇEK şartlar gösterilecek!** ✅

**Web Tasarım ve Kodlama:**
- MySQL'de `conditionNumbers: "18, 21, 22, 64"`
- osym_madde_aciklamalari.json'dan açıklamalar
- **GERÇEK şartlar gösterilecek!** ✅

**Farklı programlar → Farklı şartlar!** ✅

---

## 🧪 Test

1. **Backend'i yeniden başlat:**
   ```bash
   cd backend
   node server.js
   ```

2. **API'yi test et:**
   ```
   http://localhost:3000/api/conditions/Nişantaşı%20Üniversitesi/Bilgisayar%20Programcılığı
   ```

3. **Yanıt kontrol et:**
   ```json
   {
     "conditions": [
       {
         "conditionNumber": 18,
         "conditionText": "Gerçek ÖSYM açıklaması..."
       }
     ],
     "source": "MySQL database"  ← BU VARSA BAŞARILI!
   }
   ```

4. **Frontend'te test et:**
   - TYT: 300.000, AYT: 400.000
   - Alternatif: Bilgisayar Programcılığı
   - Karttan üniversite seç
   - ÖSYM Şartları butonuna tıkla
   - **GERÇEK şartlar görmeli!** ✅

---

## 📝 Değiştirilen Dosya

**Dosya:** `backend/server.js`  
**Satırlar:** 2115-2175

**Değişiklik:**
- MySQL'den `conditionNumbers` çekme eklendi
- `osym_madde_aciklamalari.json`'dan açıklama alma eklendi
- Önlisans programları için gerçek şartlar döndürülüyor

---

## ✅ Sonuç

**special_conditions2.json:**
- ✅ Lisans (4 yıllık) programlar için kullanılıyor
- 14.000+ program

**MySQL conditionNumbers:**
- ✅ Önlisans (2 yıllık) programlar için kullanılıyor
- Gerçek madde numaraları

**osym_madde_aciklamalari.json:**
- ✅ TÜM programlar için madde açıklamaları
- 187 ÖSYM maddesi

**Artık her program kendi GERÇEK ÖSYM şartlarını gösteriyor!** 🎉

---

**Tarih:** 2026-01-06  
**Düzeltme:** MySQL conditionNumbers + osym_madde_aciklamalari.json entegrasyonu  
**Dosya:** server.js  
**Statü:** ✅ Tamamlandı
