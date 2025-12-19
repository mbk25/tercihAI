# 🔍 Console Kontrol Rehberi

## Adım 1: Ana Sayfayı Açın
```
http://localhost:3000
```

## Adım 2: Developer Console'u Açın
```
F12 tuşuna basın
```

## Adım 3: Console Sekmesine Gidin
- Üstte "Console" yazısına tıklayın
- Kırmızı hatalar var mı bakın

## Adım 4: Şu Komutları Yazın ve Enter'a Basın

### Test 1: selectedUniversities var mı?
```javascript
selectedUniversities
```
**Beklenen:** `Set(0) {size: 0}`  
**Eğer:** `undefined` → Problem var!

### Test 2: toggleUniversitySelection var mı?
```javascript
typeof toggleUniversitySelection
```
**Beklenen:** `"function"`  
**Eğer:** `"undefined"` → Problem var!

### Test 3: showEligibleUniversityModal var mı?
```javascript
typeof showEligibleUniversityModal
```
**Beklenen:** `"function"`  
**Eğer:** `"undefined"` → Problem var!

### Test 4: exportSelectedToGoogleSheets var mı?
```javascript
typeof exportSelectedToGoogleSheets
```
**Beklenen:** `"function"`  
**Eğer:** `"undefined"` → Problem var!

## Adım 5: Kullanıcı Bilgilerini Girin ve "Analiz Yap"

1. Sıralama: `50000`
2. Puan Türü: `SAY`
3. "Analiz Yap" butonuna tıklayın

## Adım 6: "Detaylar" Butonuna Tıklayın

Modal açıldıktan sonra Console'a bakın:
- Kırmızı hatalar var mı?
- Üniversite verisi geldi mi?

## Adım 7: Modal HTML'ini İnceleyin

Console'da şunu yazın:
```javascript
document.querySelector('.modal-overlay')
```

**Eğer null ise:** Modal açılmadı!  
**Eğer obje döndüyse:** HTML'e bakın:

```javascript
document.querySelector('.modal-overlay').innerHTML
```

Bu çıktıda "uni-check-devlet" arayın (CTRL+F)

## 📸 Ekran Görüntüleri Alın

1. **Ana sayfa** (kullanıcı bilgileri girildikten sonra)
2. **"Detaylar" butonuna tıkladıktan sonra açılan modal**
3. **Console sekmesi** (tüm hataları göster)
4. **Network sekmesi** (app.js dosyasının yüklendiğini göster)

## 🔴 Olası Hatalar ve Çözümleri

### Hata 1: "selectedUniversities is not defined"
```
Çözüm: app.js yüklenmemiş
- Network sekmesinde app.js'i kontrol edin
- 404 hatası varsa dosya yolu yanlış
```

### Hata 2: "Uncaught SyntaxError"
```
Çözüm: JavaScript syntax hatası
- Hangi satırda olduğuna bakın
- app.js dosyasını kontrol edin
```

### Hata 3: "Cannot read property 'map' of undefined"
```
Çözüm: Üniversite verisi gelmemiş
- Backend çalışıyor mu kontrol edin
- API'ye veri geliyor mu kontrol edin
```

### Hata 4: Modal açılıyor ama checkbox yok
```
Çözüm: HTML doğru üretilmemiş
Console'da şunu deneyin:

document.querySelector('input[id^="uni-check"]')

Null dönüyorsa checkbox HTML'de yok demektir.
```

## 🧪 Manuel Test

Console'da şunu yazıp Enter'a basın:
```javascript
showEligibleUniversityModal('Bilgisayar Mühendisliği', [
    {name: 'Test Üniversitesi', city: 'İstanbul', campus: 'Ana', type: 'Devlet', ranking: 1000, quota: 50}
])
```

Modal açılmalı ve içinde checkbox olmalı!

## 📋 Kontrol Listesi

- [ ] Console'da kırmızı hata yok
- [ ] `selectedUniversities` tanımlı
- [ ] `toggleUniversitySelection` fonksiyonu var
- [ ] `showEligibleUniversityModal` fonksiyonu var
- [ ] Modal açılıyor
- [ ] Modal içinde üniversite kartları var
- [ ] Kartların sağ üstünde checkbox var
- [ ] Checkbox'ları işaretleyince sayaç güncelleniyor
- [ ] Alt kısımda "Google Sheets'e Aktar" butonu var

## 💡 Sonuç

Tüm testlerin sonuçlarını bana yazın. Böylece sorunu tam olarak bulabiliriz!
