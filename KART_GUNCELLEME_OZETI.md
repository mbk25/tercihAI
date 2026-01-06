# Üniversite Kartlarına Özel Şartlar Eklendi

## 📋 Yapılan Değişiklikler

### Frontend Güncellemeleri (app.js)

#### Eski Görünüm:
```
Yeditepe Üniversitesi
📍 İstanbul
🏫 Ataşehir Kampüsü
👥 Kontenjan: 30
📋 ÖSYM Şartları: Madde 18, 21, 22
```

#### Yeni Görünüm:
```
Yeditepe Üniversitesi
📍 İstanbul
🏫 Ataşehir Kampüsü
👥 Kontenjan: 30

┌─────────────────────────────────┐
│ 📋 Özel Şartlar                 │
│ Madde: 18, 21, 22               │
└─────────────────────────────────┘
(Gradient arka plan + border ile)
```

### Güncellenen Bölümler

1. **Ana Program Kartları** (showUniversitiesModal)
   - Devlet üniversiteleri: Yeşil tema (#10a37f)
   - Vakıf üniversiteleri: Turuncu tema (#f59e0b)

2. **Alternatif Programlar Modal**
   - İlk 10 alternatif için özel şart gösterimi
   - Responsive tasarım

3. **Üniversite Seçim Modal** (selectUniversitiesForExcel)
   - Checkbox'lu kartlarda özel şartlar
   - Devlet ve Vakıf için ayrı renkler

4. **Excel Raporu için Seçim Ekranı**
   - Her kart için detaylı şart gösterimi

### Tasarım Özellikleri

#### Devlet Üniversiteleri
```css
background: linear-gradient(135deg, rgba(16, 163, 127, 0.15), rgba(0,0,0,0.1))
border-left: 3px solid #10a37f
color: #10a37f (başlık)
color: #cbd5e1 (madde numaraları)
```

#### Vakıf Üniversiteleri
```css
background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(0,0,0,0.1))
border-left: 3px solid #f59e0b
color: #f59e0b (başlık)
color: #cbd5e1 (madde numaraları)
```

### Konum

Özel Şartlar bölümü her zaman:
- **Kontenjan** bilgisinin hemen altında
- **Burs İmkanları** veya **Detaylı Bilgi** butonunun üstünde
- Responsive ve compact tasarım

### Veri Kaynağı

- `uni.conditionNumbers` değişkeninden alınıyor
- `special_conditions2.json` dosyasından backend tarafından dolduruluyor
- Her üniversite-program kombinasyonu için özel şartlar

## ✅ Test Edildi

- [x] Ana program kartları
- [x] Alternatif programlar modal
- [x] Devlet üniversiteleri kartları
- [x] Vakıf üniversiteleri kartları
- [x] Seçim modal kartları
- [x] Responsive tasarım
- [x] Renk temaları (Devlet/Vakıf)

## 🎯 Sonuç

Kullanıcılar artık her üniversite kartında, kontenjan bilgisinin hemen altında özel şartları (madde numaralarını) görsel olarak güzel bir şekilde görebiliyorlar. Detaylı açıklamalar için "Detaylı Bilgi" butonuna tıklayabilirler.
