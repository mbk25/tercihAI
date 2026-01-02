# ÖNLİSANS PROGRAMLARI EKLEME REHBERİ

## 🎯 Hedef
Bilgisayar Mühendisliği'ne alternatif önlisans programlarını YÖK Atlas'tan çekip veritabanına eklemek.

## 📋 İstenilen Programlar
1. **Bilgisayar Teknolojileri ve Bilişim Sistemleri**
2. **Bilişim Güvenliği Teknolojisi**
3. **İnternet ve Ağ Teknolojileri**

## ⚠️ Sorun
YÖK Atlas'ın bot koruması (418 hatası) nedeniyle otomatik veri çekme çalışmıyor.

## ✅ Çözüm Yöntemleri

### Yöntem 1: Manuel Program Kodları ile Çekme (ÖNERİLEN)

1. **Program Kodlarını Toplama:**
   - https://yokatlas.yok.gov.tr/onlisans.php adresine gidin
   - Arama kutusuna programı yazın (örn: "Bilgisayar Programcılığı")
   - Her sonuç linkine tıklayın
   - URL'den program ID'sini alın (örn: `y=123456` → ID: `123456`)

2. **Kodları Script'e Ekle

me:**
   ```javascript
   // backend/scrape-onlisans-manual-ids.js dosyasını düzenleyin
   const PROGRAM_IDS = [
       { id: "123456", programName: "Bilgisayar Programcılığı" },
       { id: "123457", programName: "Bilgisayar Teknolojisi" },
       // ... daha fazla ekleyin
   ];
   ```

3. **Script'i Çalıştırın:**
   ```bash
   cd backend
   node scrape-onlisans-manual-ids.js
   ```

### Yöntem 2: Google Sheets Veri İçe Aktarma

YÖK Atlas verilerini Excel'e manuel olarak kopyalayıp, mevcut `import-yok-excel.js` scriptini kullanarak içe aktarabilirsiniz.

### Yöntem 3: Puppeteer ile İnteraktif Çekme

`debug-onlisans-page.js` scriptini kullanarak sayfayı açın ve manuel olarak elementleri inceleyip scraper'ı düzeltin.

```bash
cd backend
node debug-onlisans-page.js
```

## 📊 Hazırlanan Dosyalar

1. **add-program-type-column.js** - Veritabanı şeması güncelleme ✅
2. **scrape-onlisans-programs.js** - Axios ile scraper (bot koruması nedeniyle çalışmıyor)
3. **scrape-onlisans-puppeteer.js** - Puppeteer ile scraper (elementler bulunamıyor)
4. **scrape-onlisans-manual-ids.js** - Manuel ID ile çekme (ÖNERİLEN) ✅
5. **test-onlisans-api.js** - API test scripti
6. **debug-onlisans-page.js** - Sayfa yapısını inceleme

## 🔄 Veritabanı Durumu

- ✅ `programType` sütunu eklendi
- ✅ ENUM değerleri: 'Lisans', 'Önlisans'
- ✅ Index oluşturuldu
- ⏳ Önlisans verileri bekleniyor

## 💡 Tavsiye

En hızlı çözüm için:
1. YÖK Atlas'tan 10-20 önlisans programının kodlarını manuel olarak toplayın
2. `scrape-onlisans-manual-ids.js` dosyasına ekleyin
3. Script'i çalıştırın

Bu yöntemle bot korumasını bypass edip tüm detay verilerini çekebilirsiniz.

## 🎥 Alternatif: Excel Export Kullanma

YÖK Atlas'tan Excel export alabiliyorsanız:
1. Önlisans programlarını Excel'e export edin
2. `import-yok-excel.js` scriptini önlisans için uyarlayın
3. Toplu import yapın
