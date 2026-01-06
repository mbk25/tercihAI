// Test getSpecialConditionsForUniversity fonksiyonunu

const fs = require('fs');
const path = require('path');

// loadSpecialConditions fonksiyonu
let specialConditionsCache = null;
function loadSpecialConditions() {
    if (specialConditionsCache) {
        console.log(`📦 Cache'den ${specialConditionsCache.length} özel şart kaydı kullanılıyor`);
        return specialConditionsCache;
    }
    
    try {
        const filePath = path.join(__dirname, 'special_conditions.json');
        console.log(`📂 Dosya yolu: ${filePath}`);
        const data = fs.readFileSync(filePath, 'utf8');
        specialConditionsCache = JSON.parse(data);
        console.log(`✅ ${specialConditionsCache.length} özel şart kaydı special_conditions.json'dan yüklendi`);
        return specialConditionsCache;
    } catch (error) {
        console.error('❌ special_conditions.json yüklenirken hata:', error.message);
        return [];
    }
}

// normalizeTurkish fonksiyonu
function normalizeTurkish(str) {
    return str
        .toUpperCase()
        .trim()
        .replace(/İ/g, 'I')
        .replace(/I/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C');
}

// getSpecialConditionsForUniversity fonksiyonu
function getSpecialConditionsForUniversity(universityName, programName) {
    const allConditions = loadSpecialConditions();
    
    console.log(`🔍 Özel şart aranıyor: "${universityName}" - "${programName}"`);
    
    const normalizedUniName = normalizeTurkish(universityName);
    const normalizedProgramName = normalizeTurkish(programName);
    
    const matches = allConditions.filter(cond => {
        const condUniName = normalizeTurkish(cond.universityName);
        const condProgName = normalizeTurkish(cond.programName);
        
        const uniMatch = condUniName === normalizedUniName || condUniName.includes(normalizedUniName) || normalizedUniName.includes(condUniName);
        const progMatch = condProgName === normalizedProgramName || condProgName.includes(normalizedProgramName) || normalizedProgramName.includes(condProgName);
        
        return uniMatch && progMatch;
    });
    
    if (matches.length > 0) {
        const allArticleNumbers = new Set();
        matches.forEach(match => {
            if (match.articleNumbers && Array.isArray(match.articleNumbers)) {
                match.articleNumbers.forEach(num => allArticleNumbers.add(num));
            }
        });
        
        const articleNumbersArray = Array.from(allArticleNumbers).sort((a, b) => a - b);
        console.log(`✅ Özel şart bulundu: Madde ${articleNumbersArray.join(', ')}`);
        return {
            found: true,
            conditionNumbers: articleNumbersArray.join(', '),
            articleNumbers: articleNumbersArray
        };
    } else {
        console.log(`⚠️ Özel şart bulunamadı`);
        return {
            found: false,
            conditionNumbers: '',
            articleNumbers: []
        };
    }
}

// Test et
console.log('\n===== TEST 1: Bezmialem =====');
const result1 = getSpecialConditionsForUniversity('Bezmialem Vakıf Üniversitesi', 'Bilgisayar Programcılığı');
console.log('Sonuç:', result1);

console.log('\n===== TEST 2: İstanbul Atlas =====');
const result2 = getSpecialConditionsForUniversity('İstanbul Atlas Üniversitesi', 'Bilgisayar Programcılığı');
console.log('Sonuç:', result2);
