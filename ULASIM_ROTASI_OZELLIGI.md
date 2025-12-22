# 🚍 Ulaşım Rotası Planlama Özelliği

## ✅ Özellik Özeti

Kullanıcılar tercih analizi yaptıktan sonra çıkan üniversitelerin "ÖSYM Şartları ve Harita Detayı" butonuna basınca açılan modal'da:

1. **Kampüs Konumu Haritası** - Google Maps embed ile gösterilir
2. **Ulaşım Rotası Planlayın Butonu** - Kampüs konumunun altında bulunur
3. **Konum İzni İsteme** - Kullanıcı butona bastığında konum izni istenir
4. **Google Maps Yol Tarifi** - Kullanıcının konumundan kampüse toplu taşıma rotası (otobüs, tramvay, metro vs.) gösterilir

---

## 🎯 Özellikler

### 1. **ÖSYM Şartları ve Harita Modal**
- Modal iki bölüme ayrılır:
  - Sol: ÖSYM 2025 Tercih Şartları
  - Sağ: Kampüs Konumu ve Ulaşım

### 2. **Kampüs Haritası**
- Google Maps Embed API kullanılır
- Kampüs konumu otomatik olarak gösterilir
- Yakınlaştırma ve keşfetme yapılabilir

### 3. **Ulaşım Rotası Planlama Butonu**
- Yeşil gradient buton
- "🚍 Ulaşım Rotası Planlayın" yazısı
- Hover efekti ile canlanır
- Tıklandığında:
  1. Konum izni ister
  2. Kullanıcının konumunu alır
  3. Google Maps'te yeni sekmede yol tarifini açar
  4. Transit modu (toplu taşıma) olarak açılır

### 4. **Konum İzni Yönetimi**
```javascript
navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback,
    options
)
```

**Konum İzni Senaryoları:**
- ✅ İzin verildi → Konum alındı → Google Maps yol tarifi açıldı
- ❌ İzin reddedildi → Hata mesajı → Manuel konum girme seçeneği
- ❌ Konum alınamadı → Hata mesajı → Manuel rota planlama
- ⏱️ Timeout → Hata mesajı → Tekrar deneme önerisi

---

## 💻 Kod Yapısı

### `planRoute()` Fonksiyonu
```javascript
async function planRoute(uniName, city, campus) {
    // 1. Konum kontrolü
    // 2. Buton devre dışı bırakma
    // 3. Geolocation API ile konum alma
    // 4. Google Maps URL oluşturma (transit mode)
    // 5. Yeni sekmede açma
    // 6. Hata yönetimi
}
```

### Google Maps URL Formatı
**Konumlu:**
```
https://www.google.com/maps/dir/?api=1
    &origin=KULLANICI_LAT,KULLANICI_LNG
    &destination=UNİVERSİTE_ADI_ŞEHİR_KAMPÜS
    &travelmode=transit
```

**Konumsuz (Manuel):**
```
https://www.google.com/maps/dir/?api=1
    &destination=UNİVERSİTE_ADI_ŞEHİR_KAMPÜS
    &travelmode=transit
```

---

## 🎨 UI/UX Özellikleri

### Buton Tasarımı
- Gradient: `linear-gradient(135deg, #10a37f, #0d8a6a)`
- Padding: `15px 20px`
- Border radius: `12px`
- Font: 15px, bold
- Shadow: `0 4px 12px rgba(16, 163, 127, 0.3)`
- Hover: Transform ve shadow artışı
- İkon: 🚍 emoji

### Yükleniyor Durumu
- Buton devre dışı
- Opacity: 0.7
- Metin: "📍 Konumunuz alınıyor..."

### Başarı/Hata Mesajları
- Sağ üst köşede geçici toast mesajı
- 3 saniye sonra otomatik kapanır
- Animasyonlu giriş/çıkış (slideInRight/slideOutRight)
- Renk kodları:
  - Başarı: Yeşil gradient
  - Hata: Kırmızı gradient
  - Bilgi: Mor gradient

---

## 🔧 Kullanım Senaryosu

### Adım 1: Tercih Analizi
```
Kullanıcı → Tercih Analizi Yap → Üniversiteler Listelendi
```

### Adım 2: Detaylı Görüntüleme
```
Üniversite Kartı → "ÖSYM Şartları ve Harita Detayı" Butonuna Tıkla
```

### Adım 3: Modal Açıldı
```
Modal → Sol: ÖSYM Şartları | Sağ: Harita + Ulaşım Butonu
```

### Adım 4: Rota Planlama
```
"Ulaşım Rotası Planlayın" Butonuna Tıkla
→ Konum izni iste
→ Konum alındı
→ Google Maps açıldı (yeni sekme)
→ Toplu taşıma rotası gösterildi
```

---

## 📱 Mobil Uyumluluk

### Responsive Tasarım
- Tablet ve mobilde grid tek sütun olur
- Buton tam genişlik olarak gösterilir
- Modal içeriği scroll edilebilir

### Konum Hizmetleri
- Mobil cihazlarda daha hassas konum alır
- GPS, Wi-Fi ve ağ konumu kullanır
- Pil tasarrufu için `enableHighAccuracy` opsiyonel

---

## 🚀 Avantajlar

1. **Kullanıcı Dostu**: Tek tıkla yol tarifi
2. **Gerçek Zamanlı**: Güncel trafik ve toplu taşıma bilgileri
3. **Çoklu Mod**: Otobüs, tramvay, metro, yürüyüş kombinasyonları
4. **Güvenli**: Konum izni kontrolü ve hata yönetimi
5. **Entegre**: Google Maps'in tüm özellikleri

---

## 🔒 Güvenlik

- Konum verisi sadece Google Maps'e gönderilir
- Backend'e konum bilgisi kayıt edilmez
- HTTPS zorunluluğu (Geolocation API için)
- Kullanıcı izni zorunlu

---

## 📊 Test Senaryoları

### ✅ Test 1: Normal Akış
1. Tercih analizi yap
2. Üniversite seç
3. "ÖSYM Şartları ve Harita Detayı" butonuna tıkla
4. "Ulaşım Rotası Planlayın" butonuna tıkla
5. Konum iznini ver
6. Google Maps açıldı mı kontrol et
7. Toplu taşıma rotası gösterildi mi kontrol et

### ✅ Test 2: Konum İzni Reddedildi
1. Butona tıkla
2. Konum iznini reddet
3. Hata mesajı gösterildi mi?
4. Manuel rota seçeneği sunuldu mu?

### ✅ Test 3: Konum Alınamadı
1. Konum hizmetlerini kapat
2. Butona tıkla
3. Hata mesajı gösterildi mi?
4. Alternatif önerildi mi?

### ✅ Test 4: Mobil Cihaz
1. Mobil tarayıcıda aç
2. Butona tıkla
3. Responsive tasarım çalışıyor mu?
4. GPS konumu doğru alındı mı?

---

## 🎓 Örnek Kullanım

### JavaScript Çağrısı
```javascript
// Modal içinde buton
<button onclick="planRoute('Hacettepe Üniversitesi', 'Ankara', 'Beytepe Kampüsü')">
    🚍 Ulaşım Rotası Planlayın
</button>
```

### Konum Alma
```javascript
navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        // Google Maps'i aç
    },
    (error) => {
        // Hata yönetimi
    },
    {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    }
);
```

---

## 🌟 Gelecek Geliştirmeler

1. **Favorilere Ekleme**: Sık kullanılan rotaları kaydet
2. **Karşılaştırma**: Birden fazla kampüse rota karşılaştırması
3. **Canlı Güncelleme**: Gerçek zamanlı trafik ve toplu taşıma güncellemeleri
4. **Offline Harita**: PWA ile offline harita desteği
5. **Alternatif Rotalar**: Birden fazla rota seçeneği gösterme

---

## 📞 Destek

Sorun yaşarsanız:
1. Konum izinlerini kontrol edin
2. HTTPS bağlantısı kullanın
3. Tarayıcı güncellemelerini yapın
4. Console'da hata mesajlarını kontrol edin

---

**Geliştirici:** Tercih AI Team  
**Tarih:** 2025-12-22  
**Versiyon:** 1.0.0  
**Durum:** ✅ Aktif ve Çalışıyor
