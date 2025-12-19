# Google Sheets Export Özelliği - Global Seçim Sistemi

## 📋 Özellik Açıklaması

Kullanıcılar, üniversite tercih analizi sonrasında **FARKLI PROGRAMLARDAN** üniversite seçebilir ve **TEK BİR LİSTEDE** toplayabilir:
- ✅ Bilgisayar Programcılığı'ndan 5 üniversite seç
- ✅ Web Tasarımı ve Kodlama'dan 3 üniversite seç  
- ✅ Yazılım Mühendisliği'nden 2 üniversite seç
- ✅ Hepsini **TEK BİR CSV** dosyasında Google Sheets'e aktar!

**Global Seçim Sistemi:** Tüm programlardan seçilen üniversiteler merkezi bir listede toplanır ve sağ üstteki "📋 Seçimlerim" butonundan yönetilebilir.

## 🎯 Nasıl Çalışır?

### 1. Üniversite Seçimi (Her Programdan)
- Kullanıcı "Analiz Yap" butonuna tıklar ve bilgilerini girer
- Örnek: Bilgisayar Mühendisliği girmek için sıralama yetmedi
- Alternatif olarak sunulan programların "Detaylar" butonuna basar:
  - **Bilgisayar Programcılığı** detaylarına gir → İstediğin üniversiteleri seç → "Listeme Ekle"
  - **Web Tasarımı ve Kodlama** detaylarına gir → İstediğin üniversiteleri seç → "Listeme Ekle"
  - **Yazılım Mühendisliği** detaylarına gir → İstediğin üniversiteleri seç → "Listeme Ekle"

### 2. Global Seçim Listesi
- Sağ üst köşede **"📋 Seçimlerim (X)"** butonu görünür
- Bu butona tıklandığında:
  - Tüm programlardan seçilen üniversiteler tek listede görünür
  - Her program ayrı bölümde gruplanmış olarak gösterilir
  - İstenmeyen üniversiteler tek tek kaldırılabilir
  - Tüm seçimler temizlenebilir

### 3. Export İşlemi
- "Seçimlerim" modalında:
  - **"🗑️ Tümünü Temizle"** - Tüm seçimleri siler
  - **"Tüm Seçimlerimi Google Sheets'e Aktar"** - CSV olarak indirir
- Export butonuna tıklandığında:
  - Tek bir CSV dosyası indirilir (tüm programlardan seçilenler dahil)
  - Kullanıcıya Google Sheets'e nasıl yükleyeceği anlatılır
  - Seçimler backend'e kaydedilir (isteğe bağlı)

### 3. CSV İçeriği
CSV dosyası şu sütunları içerir:
- Sıra
- Üniversite Adı
- Şehir
- Kampüs
- Bölüm
- Tür (Devlet/Vakıf)
- Taban Sıralama
- Kontenjan

## 💾 Backend Endpoint

### POST /api/save-selections
Seçilen üniversiteleri veritabanına kaydeder.

**Request Body:**
```json
{
  "userEmail": "kullanici@email.com",
  "universities": [
    {
      "name": "İstanbul Teknik Üniversitesi",
      "city": "İstanbul",
      "campus": "Ayazağa Kampüsü",
      "department": "Bilgisayar Mühendisliği",
      "type": "Devlet",
      "ranking": "5000",
      "quota": "120"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 üniversite kaydedildi",
  "savedCount": 5
}
```

## 📊 Veritabanı Tablosu

```sql
CREATE TABLE user_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255),
    university_name VARCHAR(500),
    city VARCHAR(100),
    campus VARCHAR(200),
    department VARCHAR(500),
    type VARCHAR(50),
    ranking VARCHAR(50),
    quota VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_created_at (created_at)
)
```

## 🚀 Kullanım Senaryosu (Gerçek Örnek)

### Senaryo: Ahmet'in TYT: 300.000, AYT: 400.000
Hayali: Bilgisayar Mühendisliği (ama sıralama yetmiyor)

1. **Analiz Yapma:**
   ```
   Ahmet → Bilgilerini Girer → "Analiz Yap"
   Sonuç: Sıralama yetmiyor, 3 alternatif program önerildi
   ```

2. **Bilgisayar Programcılığı'ndan Seçim:**
   ```
   "Detaylar" → Modal açıldı
   ✓ İstanbul Üniversitesi - İstanbul
   ✓ Ankara Üniversitesi - Ankara
   ✓ İzmir Ekonomi Üniversitesi - İzmir
   → "Listeme Ekle" (3 üniversite eklendi)
   ```

3. **Web Tasarımı ve Kodlama'dan Seçim:**
   ```
   "Detaylar" → Modal açıldı
   ✓ Marmara Üniversitesi - İstanbul
   ✓ Ege Üniversitesi - İzmir
   → "Listeme Ekle" (2 üniversite daha eklendi, toplam 5)
   ```

4. **Yazılım Mühendisliği'nden Seçim:**
   ```
   "Detaylar" → Modal açıldı
   ✓ Sabancı Üniversitesi - İstanbul
   → "Listeme Ekle" (1 üniversite daha eklendi, toplam 6)
   ```

5. **Tüm Seçimleri Görüntüleme:**
   ```
   Sağ üst köşe → "📋 Seçimlerim (6)" butonuna tıkla
   
   Modal açıldı:
   ┌─ Bilgisayar Programcılığı (3)
   │  - İstanbul Üniversitesi
   │  - Ankara Üniversitesi  
   │  - İzmir Ekonomi Üniversitesi
   ├─ Web Tasarımı ve Kodlama (2)
   │  - Marmara Üniversitesi
   │  - Ege Üniversitesi
   └─ Yazılım Mühendisliği (1)
      - Sabancı Üniversitesi
   ```

6. **Export:**
   ```
   "Tüm Seçimlerimi Google Sheets'e Aktar" → 
   TEK BİR CSV dosyası indirildi (6 üniversite, 3 farklı program)
   ```

7. **Google Sheets'e Yükleme:**
   ```
   Google Sheets Aç → Dosya → İçe Aktar → Yükle → CSV Seç
   ```

## ⚡ Özellikler

✅ **Global Seçim Sistemi** - Farklı programlardan seçimler tek listede
✅ **Çoklu Program Desteği** - Sınırsız sayıda programdan seçim yapılabilir
✅ **Merkezi Yönetim** - "Seçimlerim" butonundan tüm seçimler yönetilir
✅ **Program Bazlı Gruplama** - Her program ayrı bölümde gösterilir
✅ **Tek Tıkla Kaldırma** - İstenmeyen üniversiteler kolayca kaldırılır
✅ **Tümünü Temizle** - Tüm seçimler tek seferde silinebilir
✅ **Tekil CSV Export** - Tüm seçimler tek CSV dosyasında
✅ **Gerçek Zamanlı Sayaç** - "Seçimlerim (X)" dinamik güncellenir
✅ **Backend'e Otomatik Kayıt** - Seçimler veritabanına kaydedilir
✅ **Responsive Tasarım** - Mobil ve desktop uyumlu

## 🔧 Geliştirme Notları

### Frontend (app.js)
- `globalSelectedUniversities` array'i tüm seçimleri tutar
- Her modal'dan seçim yapıldığında global listeye eklenir
- Duplicate kontrolü yapılır (aynı üniversite+bölüm tekrar eklenmez)
- `updateSelectionButton()` fonksiyonu sayacı günceller
- `showSelectionsModal()` tüm seçimleri gösterir
- Checkbox'lar modal içinde dinamik olarak oluşturulur
- Her üniversiteye özgü `data-*` attribute'ları kullanılır
- CSV formatı Excel ve Google Sheets ile uyumludur
- UTF-8 encoding ile Türkçe karakter desteği

### Backend (server.js)
- `POST /api/save-selections` endpoint'i global seçimleri kaydeder
- Her üniversite ayrı satır olarak `user_selections` tablosuna yazılır
- Kullanıcı giriş yapmamışsa "anonim" olarak kaydedilir

### CSS (style.css)
- `.selections-btn` sınıfı sağ üst köşede yeşil buton
- Mobil responsive (top: 4rem when mobile)
- Hover animasyonları ve shadow efektleri

## 📝 Gelecek Geliştirmeler (İsteğe Bağlı)

- [ ] Doğrudan Google Sheets API entegrasyonu
- [ ] Google Drive'a otomatik upload
- [ ] Kullanıcıya e-posta ile gönderme
- [ ] Önceki seçimleri görüntüleme
- [ ] Karşılaştırma özelliği
- [ ] PDF export
