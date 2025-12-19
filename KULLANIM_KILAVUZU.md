# 🎓 TercihAI - Google Sheets Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

### 1️⃣ Adım: Kullanıcı Bilgilerini Girin
```
📝 Ana sayfada:
- Sıralama bilgilerinizi girin
- Puan türünüz seçin
- "Analiz Yap" butonuna tıklayın
```

### 2️⃣ Adım: Üniversiteleri Görüntüleyin
```
📊 Analiz sonuçlarında:
- Önerilen üniversite programını görün
- "Detaylar" butonuna tıklayın
- Pop-up ekranı açılacak
```

### 3️⃣ Adım: Üniversiteleri Seçin
```
✅ Pop-up ekranında:
- Her üniversite kartının SAĞ ÜST köşesinde ✓ TİK KUTUSU var
- Gitmek istediğiniz üniversiteleri işaretleyin
- Seçtiğiniz sayı ekranın altında gösterilir
```

**Örnek Görünüm:**
```
┌─────────────────────────────────────────────────┐
│ 🏛️ Devlet Üniversiteleri (15)                   │
│                                                  │
│ ┌────────────────────────────────────────┐     │
│ │ [✓] Seç    İstanbul Teknik Üniversitesi│     │
│ │ 📍 İstanbul                             │     │
│ │ 🏫 Ayazağa Kampüsü                      │     │
│ │ 🎯 Taban: 1.234                         │     │
│ │ 👥 Kontenjan: 150                       │     │
│ └────────────────────────────────────────┘     │
│                                                  │
│ ┌────────────────────────────────────────┐     │
│ │ [✓] Seç    Boğaziçi Üniversitesi       │     │
│ │ 📍 İstanbul                             │     │
│ │ ...                                     │     │
│ └────────────────────────────────────────┘     │
│                                                  │
│ ────────────────────────────────────────────   │
│              2 üniversite seçildi               │
│                                                  │
│  [📊 Seçilenleri Google Sheets'e Aktar]        │
└─────────────────────────────────────────────────┘
```

### 4️⃣ Adım: Google Sheets'e Aktarın
```
📊 Pop-up ekranının EN ALTINDA:
- Yeşil "Seçilenleri Google Sheets'e Aktar" butonu
- Butona tıklayın
- ⏳ Bekleyin (3-5 saniye)
- ✅ Otomatik olarak Google Sheets açılacak!
```

## 📊 Google Sheets'te Ne Görünür?

Oluşturulan tabloda şu bilgiler olacak:

| Üniversite Adı | Şehir | Kampüs | Tür | Taban Sıralama | Kontenjan | ÖSYM Şartları |
|----------------|-------|--------|-----|----------------|-----------|---------------|
| İstanbul Teknik Üniversitesi | İstanbul | Ayazağa | Devlet | 1.234 | 150 | Madde 5 |
| Boğaziçi Üniversitesi | İstanbul | Bebek | Devlet | 987 | 120 | Madde 3 |
| Koç Üniversitesi | İstanbul | Rumeli Hisarı | Vakıf | 2.345 | 80 | Yok |

### ✨ Tablo Özellikleri:
- ✅ Otomatik formatlanmış başlıklar (yeşil, kalın)
- ✅ Düzenli sütunlar
- ✅ Düzenleme izniniz var
- ✅ Paylaşılabilir link
- ✅ İndirilebilir (Excel, PDF)

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hızlı Seçim
```
1. "Analiz Yap" → "Detaylar"
2. Beğendiğiniz 5-10 üniversiteyi hızlıca işaretleyin
3. "Google Sheets'e Aktar" butonuna tıklayın
4. ✅ Listeniz hazır!
```

### Senaryo 2: Detaylı İnceleme
```
1. "Analiz Yap" → "Detaylar"
2. Her üniversitenin "📋 Genel Bilgi" butonuna tıklayın
3. Program bilgilerini inceleyin
4. Beğendiyseniz sağ üstteki ✓ kutuyu işaretleyin
5. Diğer üniversiteleri de inceleyin
6. "Google Sheets'e Aktar"
7. ✅ Detaylı karşılaştırma listeniz hazır!
```

### Senaryo 3: ÖSYM Şartlarını İnceleyerek
```
1. "Analiz Yap" → "Detaylar"
2. "🔍 Detay + Harita" butonuna tıklayın
3. ÖSYM şartlarını okuyun
4. Kampüs konumunu haritada görün
5. Uygunsa sağ üstteki ✓ kutuyu işaretleyin
6. "Google Sheets'e Aktar"
7. ✅ ÖSYM şartlarına uygun listeniz hazır!
```

## 🎨 Görsel Rehber

### Checkbox Konumları:

#### 1. Ana Liste Modal'da:
```
┌──────────────────────────────┐
│  [✓] Seç    Üniversite Adı   │ ← Sağ üst köşede
│  📍 Bilgiler...               │
└──────────────────────────────┘
```

#### 2. Genel Bilgi Modal'da:
```
┌─────────────────────────────────────┐
│ 🏛️ Üniversite Adı        [✓] Seç [×]│ ← Header'da
├─────────────────────────────────────┤
│ Program detayları...                 │
└─────────────────────────────────────┘
```

#### 3. ÖSYM Detay Modal'da:
```
┌─────────────────────────────────────┐
│ 📋 Üniversite Adı        [✓] Seç [×]│ ← Header'da
├─────────────────────────────────────┤
│ ÖSYM Şartları  │  📍 Kampüs Konumu  │
└─────────────────────────────────────┘
```

## ⚙️ Kurulum (Yönetici İçin)

### Backend Kurulumu:
```bash
# 1. Google Service Account oluştur
# 2. JSON credentials dosyasını indir
# 3. backend klasörüne kopyala:

tercihAI/
└── backend/
    └── google-credentials.json  ← Buraya

# 4. Backend'i başlat
cd backend
npm start
```

Detaylı kurulum için: `backend/GOOGLE_SHEETS_KURULUM.md`

## 🔍 Sorun Giderme

### ❌ "Lütfen en az bir üniversite seçin" Hatası
**Çözüm:** En az 1 üniversite işaretlemelisiniz.

### ❌ "Google Sheets oluşturulamadı" Hatası
**Sebep:** Backend'de Google credentials dosyası yok.
**Çözüm:** Yöneticinizle iletişime geçin.

### ❌ Checkbox'ları göremiyorum
**Çözüm:** CTRL + F5 yapın (tarayıcı cache'ini temizleyin)

### ❌ Seçili sayı güncellenmiyor
**Çözüm:** Sayfayı yenileyin (F5)

### ❌ Google Sheets açılmadı
**Kontroller:**
1. Pop-up engelleyici kapalı mı?
2. Backend çalışıyor mu? (http://localhost:3000/api/health)
3. Google credentials dosyası var mı?

## 💡 İpuçları

### ✅ Verimli Kullanım:
1. **Önce hepsini inceleyin**: Tüm üniversiteleri gezin
2. **Sonra seçim yapın**: Karşılaştırdıktan sonra işaretleyin
3. **Notlarınızı ekleyin**: Google Sheets'te düzenleme yapabilirsiniz

### ✅ Liste Düzenleme:
1. Google Sheets açıldıktan sonra:
   - Sıralama ekleyebilirsiniz
   - Notlar yazabilirsiniz
   - Renklendirme yapabilirsiniz
   - Aileniyle paylaşabilirsiniz

### ✅ Birden Fazla Liste:
- Her analiz için yeni bir liste oluşturulur
- Farklı bölümleri karşılaştırabilirsiniz
- Tüm listeler Google Drive'ınızda kalır

## 🎓 Örnek Kullanım

### 1. Mühendislik Bölümü Analizi:
```
TYT: 450
AYT: 420
Puan Türü: SAY

→ "Analiz Yap"
→ Bilgisayar Mühendisliği önerildi
→ "Detaylar" → 15 üniversite var
→ 5 tanesini seç (İTÜ, ODTÜ, Boğaziçi, vb.)
→ "Google Sheets'e Aktar"
→ ✅ Liste hazır!
```

### 2. Karşılaştırmalı Analiz:
```
Önce Bilgisayar Mühendisliği analizi:
→ 5 üniversite seç → Google Sheets'e aktar

Sonra Yazılım Mühendisliği analizi:
→ 5 üniversite seç → Google Sheets'e aktar

→ İki listeyi karşılaştır
→ En uygun tercihi belirle
```

## 📞 Destek

### Teknik Sorunlar:
- Backend log'larını kontrol edin
- `backend/GOOGLE_SHEETS_KURULUM.md` dosyasına bakın
- Browser console'da hata var mı kontrol edin (F12)

### Özellik İstekleri:
- Excel export
- PDF export
- Email ile paylaşma
- Karşılaştırma tabloları

## 🎉 Sonuç

**Artık üniversite tercihlerinizi kolayca yönetebilirsiniz!**

✅ Seçin → ✅ Tıklayın → ✅ Google Sheets'e aktarın → ✅ Tercih yapın!

---

**Not:** Google Service Account kurulumu için yöneticinizle iletişime geçin.

**Başarılar! 🎓**
