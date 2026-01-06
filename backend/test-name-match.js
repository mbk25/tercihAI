const fs = require('fs');
const data = JSON.parse(fs.readFileSync('special_conditions.json', 'utf8'));

// Bezmialem'i kontrol et
const bezmialem = data.filter(c => c.universityName.includes('BEZMIALEM') || c.universityName.includes('Bezmialem'));
console.log('JSONdaki Bezmialem kayıtları:', bezmialem.length);
if (bezmialem.length > 0) {
    console.log('İlk kayıt:');
    console.log('  Üniversite Adı:', bezmialem[0].universityName);
    console.log('  Program Adı:', bezmialem[0].programName);
    console.log('  Madde Numaraları:', bezmialem[0].articleNumbers);
}

// İsim karşılaştırma testi
const testName1 = 'Bezmialem Vakıf Üniversitesi';
const testName2 = 'BEZMİALEM VAKIF ÜNİVERSİTESİ';
const normalized1 = testName1.toUpperCase().trim();
const normalized2 = testName2.toUpperCase().trim();

console.log('\nİsim Karşılaştırma:');
console.log('Database den gelen:', normalized1);
console.log('JSON daki:', normalized2);
console.log('Eşit mi?', normalized1 === normalized2);
console.log('İçeriyor mu?', normalized2.includes(normalized1) || normalized1.includes(normalized2));

// Türkçe karakter dönüşümü
const turkishToEnglish = (str) => {
    return str
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'u')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 's')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'o')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'c');
};

const converted1 = turkishToEnglish(normalized1);
const converted2 = turkishToEnglish(normalized2);

console.log('\nTürkçe Karakter Olmadan:');
console.log('Database:', converted1);
console.log('JSON:', converted2);
console.log('Eşit mi?', converted1 === converted2);
