# Özel Şart Maddeleri Entegrasyonu

## Yapılan Değişiklikler

### Backend (server.js)

#### 1. Yeni Kütüphane İçe Aktarımı
```javascript
const fs = require('fs');
const path = require('path');
```

#### 2. Yeni Yardımcı Fonksiyonlar Eklendi

**`loadSpecialConditions()`**
- `special_conditions.json` dosyasını yükler
- Cache mekanizması kullanarak performansı artırır
- 13,985 özel şart kaydını belleğe alır

**`getSpecialConditionsForUniversity(universityName, programName)`**
- Belirli bir üniversite ve program için özel şartları bulur
- İsim normalizasyonu yaparak esnek eşleştirme sağlar
- Şart numaralarını sıralı şekilde döndürür

#### 3. Dört Farklı Yerde conditionNumbers Güncellemesi

**a) `/api/recommendations` - Ana Tercih Analizi (Satır ~786-810)**
```javascript
// Veritabanından ÖSYM şartlarını al
const conditions = await getUniversityConditions(uni.name, dreamDept);
const dbConditionNumbers = conditions.map(c => c.conditionNumber);

// JSON dosyasından özel şartları al
const specialConds = getSpecialConditionsForUniversity(uni.name, dreamDept);

// Her iki kaynaktan gelen şart numaralarını birleştir
const allConditionNumbers = [...new Set([...dbConditionNumbers, ...specialConds.articleNumbers])];
allConditionNumbers.sort((a, b) => parseInt(a) - parseInt(b));

return {
    ...uni,
    conditions: conditions.map(c => c.conditionText),
    conditionNumbers: allConditionNumbers.join(', ')
};
```

**b) `/api/recommendations` - AI Önerisi Üniversiteleri (Satır ~944-976)**
- Aynı logic ile special_conditions.json'dan şartları entegre eder

**c) `/api/recommendations` - Akıllı Alternatif Sistemi (Satır ~1184-1226)**
- Alternatif bölümler için de özel şartları gösterir

**d) `/api/universities` - Üniversite Listeleme (Satır ~1546-1589)**
- Program bazlı listeleme endpoint'inde de özel şartları dahil eder

## Veri Akışı

```
1. Kullanıcı tercih analizi yapar
   ↓
2. Backend YÖK Atlas'tan üniversiteleri çeker
   ↓
3. Her üniversite için:
   a) MySQL database'den ÖSYM şartlarını çeker (getUniversityConditions)
   b) special_conditions.json'dan özel şartları çeker (getSpecialConditionsForUniversity)
   c) İki kaynaktan gelen şart numaralarını birleştirir ve sıralar
   ↓
4. Frontend üniversite kartlarında şart numaralarını gösterir
   - "👥 Kontenjan: 30" satırının altında
   - "📋 ÖSYM Şartları: Madde 22, 23, 24" şeklinde
```

## Özel Şart JSON Formatı

```json
{
  "universityName": "ABDULLAH GÜL ÜNİVERSİTESİ",
  "faculty": "Mühendislik Fakültesi",
  "programCode": "106510077",
  "programName": "Bilgisayar Mühendisliği (İngilizce)",
  "specialConditions": "22, 23, 24, 144",
  "articleNumbers": [22, 23, 24, 144],
  "degreeType": "Lisans"
}
```

## Frontend Görünümü

Üniversite kartlarında (app.js):
```javascript
<div>👥 Kontenjan: ${uni.quota || 'N/A'}</div>
${uni.conditionNumbers && uni.conditionNumbers.trim() ? 
    `<div style="color: #10a37f; font-weight: 600;">
        📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}
     </div>` 
: ''}
```

## Avantajlar

1. **Kapsamlı Veri**: Hem database'den hem de JSON'dan şartlar alınır
2. **Hata Toleransı**: Bir kaynak başarısız olsa bile diğeri çalışır
3. **Performans**: JSON dosyası cache'lenir, sadece ilk kullanımda yüklenir
4. **Doğruluk**: 13,985 program için detaylı şart bilgisi
5. **Esneklik**: İsim eşleştirmede esnek algoritma
6. **Tekrarsızlık**: Set kullanılarak aynı şart numarası tekrar gösterilmez

## Test Edilenler

✅ Server başarıyla başlatılıyor
✅ special_conditions.json yükleniyor (13,985 kayıt)
✅ API endpoint'leri çalışıyor
✅ Şart numaraları birleştiriliyor
✅ Frontend'de doğru görüntüleniyor

## Sonuç

Özel şart maddeleri artık üniversite kartlarında, "Kontenjan" bilgisinin hemen altında görüntüleniyor. Kullanıcılar "detaylar" butonuna tıkladıklarında, her üniversite için ilgili ÖSYM şart madde numaralarını görebiliyorlar.
