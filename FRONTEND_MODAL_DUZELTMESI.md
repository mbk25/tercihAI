# Frontend Modal ÖSYM Şartları Düzeltmesi

## 🐛 Sorun

Kullanıcı alternatif programlara baktığında:
- **Alternatif Program:** Bilgisayar Programcılığı
- **Modal ÖSYM Şartları:** Bilgisayar Mühendisliği'ne ait! ❌

**Örnek Hatalı Şart:**
```
"Mühendislik programlarına... sırası 300 bininci sırada olan..."
```
→ Bu Bilgisayar Mühendisliği'ne ait bir şart!

**Doğru Olması Gereken:**
Modal'da Bilgisayar Programcılığı'nın kendi şartları görünmeli.

---

## 🔍 Kök Neden

`public/app.js` dosyasında **satır 4232**:

```javascript
// ❌ YANLIŞ
const response = await fetch(
    `${API_URL}/api/conditions/${uniName}/${window.currentDepartment}`
);
```

**Sorun:**
- `window.currentDepartment` = **Hayali bölüm** (Bilgisayar Mühendisliği)
- Ama modal **alternatif bölüm** (Bilgisayar Programcılığı) için açılıyor!

---

## ✅ Çözüm

### 1. Butonlara `data-uni-dept` Attribute Eklendi

**Satır 3448 (Devlet Üniversiteleri):**
```javascript
// ÖNCEDEN ❌
<button data-uni-name="${uni.name}" ... onclick="showDetailedConditionsModal(...)">

// SONRA ✅
<button data-uni-name="${uni.name}" ... data-uni-dept="${deptName}" 
    onclick="const btn = event.currentTarget; 
             showDetailedConditionsModal(..., btn.dataset.uniDept)">
```

**Satır 3489 (Vakıf Üniversiteleri):**
```javascript
// Aynı düzeltme
<button ... data-uni-dept="${deptName}" 
    onclick="const btn = event.currentTarget; 
             showDetailedConditionsModal(..., btn.dataset.uniDept)">
```

**Satır 4067 (Büyük Modal İçi Buton):**
```javascript
// ÖNCEDEN ❌
<button data-uni-name="${uni.name}" ... 
    onclick="showDetailedConditionsModal(...)">

// SONRA ✅
<button data-uni-name="${uni.name}" ... 
    data-uni-dept="${program && program.name ? program.name : window.currentDepartment}"
    onclick="const btn = event.currentTarget; 
             showDetailedConditionsModal(..., btn.dataset.uniDept)">
```

---

### 2. `showDetailedConditionsModal` Fonksiyonu Güncellendi

**Satır 4218:**
```javascript
// ÖNCEDEN ❌
async function showDetailedConditionsModal(uniName, conditions, conditionNumbers, city, campus, uniType, uni = null) {
    const response = await fetch(
        `${API_URL}/api/conditions/${uniName}/${window.currentDepartment}`
    );
}

// SONRA ✅
async function showDetailedConditionsModal(uniName, conditions, conditionNumbers, city, campus, uniType, uni = null, deptName = null) {
    // Doğru bölüm adını kullan
    const departmentToUse = deptName || window.currentDepartment || 'Bilgisayar Mühendisliği';
    console.log(`🎯 ÖSYM şartları çekiliyor: Üniversite="${uniName}", Bölüm="${departmentToUse}"`);
    
    const response = await fetch(
        `${API_URL}/api/conditions/${uniName}/${departmentToUse}`
    );
}
```

---

## 🎯 Veri Akışı (Düzeltilmiş)

### Alternatif Program Kartı Tıklandığında:

1. **Buton Oluşturulurken:**
   ```html
   <button data-uni-dept="Bilgisayar Programcılığı" ...>
   ```

2. **Buton Tıklandığında:**
   ```javascript
   showDetailedConditionsModal(..., "Bilgisayar Programcılığı")
   ```

3. **API Çağrısı:**
   ```
   GET /api/conditions/Nişantaşı%20Üniversitesi/Bilgisayar%20Programcılığı
   ```

4. **Backend Yanıtı:**
   ```json
   {
     "conditions": [
       {
         "madde_no": 18,
         "icerik": "Taahhütname... (Bilgisayar Programcılığı için)"
       }
     ]
   }
   ```

5. **Modal Gösterir:**
   ```
   ÖSYM 2025 Tercih Şartları
   Madde 18: Taahhütname... (Bilgisayar Programcılığı için) ✅
   ```

---

## 🧪 Test Adımları

1. **Frontend'i aç**
2. **Test girdisi:**
   - TYT: 300.000
   - AYT: 400.000
   - Hayali: Bilgisayar Mühendisliği

3. **Alternatif gösterilecek:**
   - Bilgisayar Programcılığı

4. **Bilgisayar Programcılığı kartındaki bir üniversiteye tıkla:**
   - Örn: Nişantaşı Üniversitesi

5. **"ÖSYM Şartları ve Harita Detayı" butonuna tıkla**

6. **Modal açılır, kontrol et:**
   - ✅ Şartlar "Bilgisayar Programcılığı" için mi?
   - ❌ "Mühendislik programlarına..." gibi şart var mı? (olmamalı!)

7. **Browser Console'da log kontrol et:**
   ```
   🎯 ÖSYM şartları çekiliyor: Üniversite="Nişantaşı Üniversitesi", Bölüm="Bilgisayar Programcılığı"
   ```

---

## 📝 Değiştirilen Dosya

**Dosya:** `public/app.js`

**Değişiklikler:**
1. Satır 3448 - Devlet üniversiteleri butonuna `data-uni-dept` eklendi
2. Satır 3489 - Vakıf üniversiteleri butonuna `data-uni-dept` eklendi
3. Satır 4067 - Büyük modal butonuna `data-uni-dept` eklendi
4. Satır 4218 - `showDetailedConditionsModal` fonksiyonuna `deptName` parametresi eklendi
5. Satır 4232 - API çağrısı `deptName` parametresini kullanacak şekilde güncellendi

---

## ✅ Sonuç

**Artık:**
- ✅ Alternatif programların modal'ları kendi ÖSYM şartlarını gösteriyor
- ✅ Hayali bölümün şartları karışmıyor
- ✅ Her program için doğru şartlar API'den çekiliyor

**Önceden (YANLIŞ ❌):**
```
Bilgisayar Programcılığı kartı → Modal açılıyor → 
API: /api/conditions/Nişantaşı/Bilgisayar%20Mühendisliği ❌
```

**Şimdi (DOĞRU ✅):**
```
Bilgisayar Programcılığı kartı → Modal açılıyor → 
API: /api/conditions/Nişantaşı/Bilgisayar%20Programcılığı ✅
```

---

**Tarih:** 2026-01-06  
**Düzeltme:** Frontend modal ÖSYM şartları  
**Dosya:** public/app.js  
**Satırlar:** 3448, 3489, 4067, 4218, 4232  
**Statü:** ✅ Tamamlandı
