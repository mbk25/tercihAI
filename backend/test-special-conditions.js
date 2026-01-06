/**
 * ÖSYM Özel Şartlar Servis Testi
 * special-conditions-service.js fonksiyonlarını test eder
 */

const {
    loadSpecialConditionsData,
    getConditionsByProgramCode,
    getConditionsByUniversityAndProgram,
    getAllProgramsByUniversity,
    formatArticleNumbers
} = require('./special-conditions-service');

console.log('🧪 ÖSYM Özel Şartlar Servis Testi Başlıyor...\n');

// Test 1: Veri yükleme
console.log('📝 Test 1: Veri Yükleme');
const data = loadSpecialConditionsData();
console.log(`   ✅ ${data.length} program verisi yüklendi\n`);

// Test 2: İlk 3 programı göster
console.log('📝 Test 2: İlk 3 Program');
data.slice(0, 3).forEach((program, idx) => {
    console.log(`   ${idx + 1}. ${program.universityName} - ${program.programName}`);
    console.log(`      Program Kodu: ${program.programCode}`);
    console.log(`      Şartlar: ${program.specialConditions}`);
    console.log(`      Madde Numaraları: [${program.articleNumbers.join(', ')}]\n`);
});

// Test 3: Program koduna göre arama
console.log('📝 Test 3: Program Koduna Göre Arama');
const testProgramCode = '106510090'; // Abdullah Gül Üniversitesi - Psikoloji
const programByCode = getConditionsByProgramCode(testProgramCode);
if (programByCode) {
    console.log(`   ✅ Program bulundu: ${programByCode.universityName} - ${programByCode.programName}`);
    console.log(`      Şartlar: ${programByCode.specialConditions}`);
    console.log(`      Madde Numaraları: [${programByCode.articleNumbers.join(', ')}]\n`);
} else {
    console.log(`   ❌ Program bulunamadı: ${testProgramCode}\n`);
}

// Test 4: Üniversite ve program adına göre arama
console.log('📝 Test 4: Üniversite ve Program Adına Göre Arama');
const testUniName = 'ABDULLAH GÜL ÜNİVERSİTESİ';
const testProgName = 'Psikoloji';
const programByName = getConditionsByUniversityAndProgram(testUniName, testProgName);
if (programByName) {
    console.log(`   ✅ Program bulundu: ${programByName.universityName} - ${programByName.programName}`);
    console.log(`      Şartlar: ${programByName.specialConditions}`);
    console.log(`      Madde Numaraları: [${programByName.articleNumbers.join(', ')}]\n`);
} else {
    console.log(`   ❌ Program bulunamadı: ${testUniName} - ${testProgName}\n`);
}

// Test 5: Bir üniversitenin tüm programlarını getir
console.log('📝 Test 5: Bir Üniversitenin Tüm Programları');
const uniPrograms = getAllProgramsByUniversity('ABDULLAH GÜL');
console.log(`   ✅ ${uniPrograms.length} program bulundu`);
uniPrograms.slice(0, 5).forEach((prog, idx) => {
    console.log(`   ${idx + 1}. ${prog.programName}`);
    console.log(`      Madde Numaraları: ${formatArticleNumbers(prog.articleNumbers)}`);
});
console.log();

// Test 6: Formatlanmış madde numaraları
console.log('📝 Test 6: Madde Numarası Formatlama');
const testNumbers = [22, 23, 24, 144];
const formatted = formatArticleNumbers(testNumbers);
console.log(`   Input: [${testNumbers.join(', ')}]`);
console.log(`   Output: "${formatted}"\n`);

// Test 7: Olmayan bir üniversite
console.log('📝 Test 7: Olmayan Üniversite Testi');
const nonExistent = getConditionsByUniversityAndProgram('XYZ ÜNİVERSİTESİ', 'Bilgisayar Mühendisliği');
if (nonExistent) {
    console.log(`   ❌ HATA: Olmayan üniversite bulundu!`);
} else {
    console.log(`   ✅ Doğru: Olmayan üniversite bulunamadı\n`);
}

console.log('✅ Tüm testler tamamlandı!');
