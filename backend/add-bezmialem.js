const fs = require('fs');
const path = require('path');

// Mevcut veriyi yükle
const jsonPath = path.join(__dirname, 'special_conditions.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`📊 Mevcut kayıt sayısı: ${data.length}`);

// Bezmialem verilerini ekle
const bezmialemData = [
    {
        "universityName": "BEZMİALEM VAKIF ÜNİVERSİTESİ",
        "faculty": "Sağlık Bilimleri Fakültesi",
        "programCode": "201310001",
        "programName": "Bilgisayar Programcılığı",
        "specialConditions": "16, 17, 24",
        "articleNumbers": [16, 17, 24],
        "degreeType": "Önlisans"
    },
    {
        "universityName": "BEZMİALEM VAKIF ÜNİVERSİTESİ",
        "faculty": "Tıp Fakültesi",
        "programCode": "201310002",
        "programName": "Tıp",
        "specialConditions": "16, 17, 155",
        "articleNumbers": [16, 17, 155],
        "degreeType": "Lisans"
    },
    {
        "universityName": "BEZMİALEM VAKIF ÜNİVERSİTESİ",
        "faculty": "Diş Hekimliği Fakültesi",
        "programCode": "201310003",
        "programName": "Diş Hekimliği",
        "specialConditions": "16, 17, 147",
        "articleNumbers": [16, 17, 147],
        "degreeType": "Lisans"
    },
    {
        "universityName": "BEZMİALEM VAKIF ÜNİVERSİTESİ",
        "faculty": "Eczacılık Fakültesi",
        "programCode": "201310004",
        "programName": "Eczacılık",
        "specialConditions": "16, 17, 148, 149",
        "articleNumbers": [16, 17, 148, 149],
        "degreeType": "Lisans"
    },
    {
        "universityName": "BEZMİALEM VAKIF ÜNİVERSİTESİ",
        "faculty": "Sağlık Bilimleri Fakültesi",
        "programCode": "201310005",
        "programName": "Hemşirelik",
        "specialConditions": "16, 17",
        "articleNumbers": [16, 17],
        "degreeType": "Lisans"
    }
];

// Verileri ekle
data.push(...bezmialemData);

console.log(`✅ ${bezmialemData.length} Bezmialem programı eklendi`);
console.log(`📊 Yeni toplam kayıt sayısı: ${data.length}`);

// JSON dosyasına kaydet
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ JSON dosyası güncellendi!');

// Doğrulama
const verify = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const bezmialem = verify.filter(v => v.universityName.includes('BEZMİALEM'));
console.log(`\n✅ Doğrulama: ${bezmialem.length} Bezmialem programı bulundu`);
bezmialem.forEach(b => {
    console.log(`  - ${b.programName} (Madde: ${b.articleNumbers.join(', ')})`);
});
