# 🎯 Global Üniversite Seçim Sistemi

## 🆕 Yeni Özellik: Çoklu Program Seçimi

### Problem
❌ **Eski Sistem:** Kullanıcı her programdan üniversite seçtiğinde ayrı ayrı CSV dosyaları indiriliyordu.
- Bilgisayar Programcılığı → csv_1.csv
- Web Tasarımı → csv_2.csv  
- Yazılım Mühendisliği → csv_3.csv

### Çözüm
✅ **Yeni Sistem:** Tüm programlardan yapılan seçimler tek bir global listede toplanıyor!
- Tüm seçimler → **TEK BİR** tercih_listesi.csv

---

## 🎨 Kullanıcı Arayüzü

### 1. Sağ Üst Köşe - Seçimlerim Butonu
```
┌─────────────────────────────────────┐
│  🌙  📋 Seçimlerim (6)              │ ← Yeşil, dikkat çekici buton
└─────────────────────────────────────┘
```
- **Başlangıçta gizli:** Hiç seçim yokken görünmez
- **Dinamik sayaç:** Her seçimde otomatik güncellenir
- **Her zaman erişilebilir:** Sayfanın her yerinden tıklanabilir

### 2. Program Detay Modalı
Her program için:
```
┌──────────────────────────────────────────┐
│  ☑️ [ ] İstanbul Üniversitesi            │
│      📍 İstanbul  🏫 Merkez Kampüs       │
│      [🔍 ÖSYM Şartları ve Harita Detayı] │
├──────────────────────────────────────────┤
│  ☑️ [✓] Ankara Üniversitesi             │
│      📍 Ankara  🏫 Tandoğan Kampüs       │
│      [🔍 ÖSYM Şartları ve Harita Detayı] │
├──────────────────────────────────────────┤
│  Seçili: 1 üniversite                    │
│  [Tümünü Seç]  [➕ Listeme Ekle]        │
└──────────────────────────────────────────┘
```

### 3. Global Seçimler Modalı
```
┌────────────────────────────────────────────────────┐
│  📋 Seçtiğim Üniversiteler                    [×]  │
├────────────────────────────────────────────────────┤
│  Toplam: 6 Üniversite                              │
├────────────────────────────────────────────────────┤
│  🎯 Bilgisayar Programcılığı (3)                   │
│    ├─ İstanbul Üniversitesi - İstanbul [Kaldır]   │
│    ├─ Ankara Üniversitesi - Ankara     [Kaldır]   │
│    └─ İzmir Ekonomi Ünv. - İzmir       [Kaldır]   │
│                                                     │
│  🎯 Web Tasarımı ve Kodlama (2)                    │
│    ├─ Marmara Üniversitesi - İstanbul  [Kaldır]   │
│    └─ Ege Üniversitesi - İzmir         [Kaldır]   │
│                                                     │
│  🎯 Yazılım Mühendisliği (1)                       │
│    └─ Sabancı Üniversitesi - İstanbul  [Kaldır]   │
├────────────────────────────────────────────────────┤
│  [🗑️ Tümünü Temizle]                              │
│  [📊 Tüm Seçimlerimi Google Sheets'e Aktar]       │
└────────────────────────────────────────────────────┘
```

---

## 🔄 Kullanım Akışı

### Adım 1: Analiz Yap
```javascript
User Input:
- TYT: 300.000
- AYT: 400.000
- Hayalindeki Bölüm: Bilgisayar Mühendisliği

AI Sonuç:
❌ Sıralama yetmiyor
✅ 3 Alternatif Program Öneriliyor:
   1. Bilgisayar Programcılığı (55 üniversite)
   2. Web Tasarımı ve Kodlama (32 üniversite)
   3. Yazılım Mühendisliği (15 üniversite)
```

### Adım 2: Her Programdan Seçim Yap
```javascript
// Program 1: Bilgisayar Programcılığı
"Detaylar" butonuna tıkla
→ 55 üniversite listesi açıldı
→ 3 üniversiteyi işaretle
→ "Listeme Ekle" butonuna bas
✅ globalSelectedUniversities = [uni1, uni2, uni3]
✅ "Seçimlerim (3)" butonu göründü

// Program 2: Web Tasarımı ve Kodlama  
"Detaylar" butonuna tıkla
→ 32 üniversite listesi açıldı
→ 2 üniversiteyi işaretle
→ "Listeme Ekle" butonuna bas
✅ globalSelectedUniversities = [uni1, uni2, uni3, uni4, uni5]
✅ "Seçimlerim (5)" güncellendi

// Program 3: Yazılım Mühendisliği
"Detaylar" butonuna tıkla
→ 15 üniversite listesi açıldı
→ 1 üniversiteyi işaretle
→ "Listeme Ekle" butonuna bas
✅ globalSelectedUniversities = [uni1...uni6]
✅ "Seçimlerim (6)" güncellendi
```

### Adım 3: Tüm Seçimleri Görüntüle
```javascript
"📋 Seçimlerim (6)" butonuna tıkla
→ Global seçimler modalı açıldı
→ 3 program grubunda 6 üniversite gösteriliyor
→ Her üniversitenin yanında "Kaldır" butonu var
→ İstenmeyen üniversiteler tek tek kaldırılabilir
```

### Adım 4: Export
```javascript
"Tüm Seçimlerimi Google Sheets'e Aktar" butonuna tıkla
→ CSV dosyası oluşturuldu:
   tercih_listesi_1234567890.csv
   ├─ Sıra | Üniversite | Şehir | Kampüs | Bölüm | Tür | Sıralama | Kontenjan
   ├─ 1    | İstanbul Ü. | İstanbul | ... | Bilgisayar Prog. | Devlet | ... | ...
   ├─ 2    | Ankara Ü.   | Ankara   | ... | Bilgisayar Prog. | Devlet | ... | ...
   ├─ 3    | İzmir Ek. Ü.| İzmir    | ... | Bilgisayar Prog. | Vakıf  | ... | ...
   ├─ 4    | Marmara Ü.  | İstanbul | ... | Web Tasarımı     | Devlet | ... | ...
   ├─ 5    | Ege Ü.      | İzmir    | ... | Web Tasarımı     | Devlet | ... | ...
   └─ 6    | Sabancı Ü.  | İstanbul | ... | Yazılım Müh.     | Vakıf  | ... | ...

→ Kullanıcıya bilgilendirme mesajı gösterildi
→ Backend'e kaydedildi (user_selections tablosu)
```

---

## 💻 Teknik Detaylar

### JavaScript (app.js)
```javascript
// Global değişken
let globalSelectedUniversities = [];

// Modal'dan seçim ekle
function addToGlobalList(selectedFromModal) {
    selectedFromModal.forEach(uni => {
        const exists = globalSelectedUniversities.find(u => 
            u.name === uni.name && u.department === uni.department
        );
        if (!exists) {
            globalSelectedUniversities.push(uni);
        }
    });
    updateSelectionButton();
}

// Seçimler butonunu güncelle
function updateSelectionButton() {
    const count = globalSelectedUniversities.length;
    document.getElementById('selectionCount').textContent = count;
    document.getElementById('selectionsBtn').style.display = 
        count > 0 ? 'flex' : 'none';
}

// Tüm seçimleri göster
function showSelectionsModal() {
    // Bölümlere göre grupla
    const byDepartment = {};
    globalSelectedUniversities.forEach(uni => {
        if (!byDepartment[uni.department]) {
            byDepartment[uni.department] = [];
        }
        byDepartment[uni.department].push(uni);
    });
    
    // Modal oluştur ve göster
    // ...
}
```

### Backend (server.js)
```javascript
app.post('/api/save-selections', async (req, res) => {
    const { userEmail, universities } = req.body;
    
    // Her üniversiteyi ayrı satır olarak kaydet
    for (const uni of universities) {
        await connection.query(
            `INSERT INTO user_selections 
            (user_email, university_name, city, campus, department, type, ranking, quota) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userEmail, uni.name, uni.city, uni.campus, uni.department, 
             uni.type, uni.ranking, uni.quota]
        );
    }
});
```

---

## 📊 Veri Akışı

```
┌─────────────────────────────────────────────────────────────┐
│  KULLANICI                                                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  PROGRAM 1 MODAL                                             │
│  [✓] Üniversite A                                           │
│  [✓] Üniversite B  →  "Listeme Ekle"                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL ARRAY                                                │
│  globalSelectedUniversities = [A, B]                        │
│  "Seçimlerim (2)" göründü                                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  PROGRAM 2 MODAL                                             │
│  [✓] Üniversite C  →  "Listeme Ekle"                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL ARRAY                                                │
│  globalSelectedUniversities = [A, B, C]                     │
│  "Seçimlerim (3)" güncellendi                               │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  "Seçimlerim (3)" BUTONU TIKLANDI                           │
│  → showSelectionsModal() çağrıldı                           │
│  → Program 1: [A, B]                                        │
│  → Program 2: [C]                                           │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  "GOOGLE SHEETS'E AKTAR" BUTONU TIKLANDI                    │
│  → exportToGoogleSheets([A, B, C])                         │
│  → CSV oluşturuldu ve indirildi                             │
│  → Backend'e kaydedildi                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Avantajlar

1. **Tek Dosya:** Tüm seçimler tek CSV'de
2. **Kolay Yönetim:** Merkezi "Seçimlerim" paneli
3. **Esnek Seçim:** İstediğiniz kadar programdan seçim
4. **Tekrar Önleme:** Aynı üniversite+bölüm tekrar eklenmez
5. **Kolay Düzenleme:** İstenmeyen seçimler kaldırılabilir
6. **Responsive:** Mobil ve desktop uyumlu
7. **Görsel Geri Bildirim:** Her işlemde bilgilendirme mesajları

---

## 🎓 Kullanım Senaryoları

### Senaryo 1: Birden Fazla Alternatif
```
Problem: Bilgisayar Mühendisliği tutmadı
Çözüm: 
→ Bilgisayar Programcılığı'ndan 5 üniversite seç
→ Web Tasarımı'ndan 3 üniversite seç
→ Yazılım Mühendisliği'nden 2 üniversite seç
Sonuç: 10 üniversitelik tercih listesi (tek CSV)
```

### Senaryo 2: Karışık Tercih
```
→ 4 yıllık programlardan 3 üniversite
→ 2 yıllık programlardan 5 üniversite
→ DGS ile 4 yıllıka geçiş yapabileceğim okullar
Sonuç: Karma bir tercih listesi
```

### Senaryo 3: Şehir Bazlı Seçim
```
→ İstanbul'daki tüm programlardan seçim
→ Ankara'daki tüm programlardan seçim
→ İzmir'deki tüm programlardan seçim
Sonuç: Şehir bazlı sıralama yapabilirsin
```

---

## 🔮 Gelecek Geliştirmeler

- [ ] Drag & drop ile sıralama
- [ ] Favorilere kaydetme
- [ ] Karşılaştırma modu
- [ ] PDF export
- [ ] E-posta ile gönderme
- [ ] Google Drive otomatik upload
- [ ] Önceki seçimleri geri yükleme
