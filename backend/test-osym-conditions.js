const specialConditionsService = require('./special-conditions-service');

console.log('🧪 ÖSYM Şart Maddesi Servisi Testi\n');

// Test 1: Program koduna göre şart getir
console.log('Test 1: Program koduna göre şart getirme');
console.log('==========================================');

const testProgramCode = '106510090'; // Örnek bir program kodu
const conditions = specialConditionsService.getConditionsByProgramCode(testProgramCode);

if (conditions) {
    console.log(`✅ Program Kodu: ${conditions.programCode}`);
    console.log(`✅ Üniversite: ${conditions.university}`);
    console.log(`✅ Program: ${conditions.programName}`);
    console.log(`✅ Şart Sayısı: ${conditions.specialConditions.length}\n`);
    
    console.log('📋 Şart Maddeleri:');
    conditions.specialConditions.forEach((madde, index) => {
        console.log(`\n${index + 1}. ${madde.madde_kodu} (Madde ${madde.madde_no})`);
        console.log(`   ${madde.icerik.substring(0, 150)}...`);
    });
} else {
    console.log('❌ Program bulunamadı');
}

console.log('\n\n');

// Test 2: Formatlanmış madde numaraları
console.log('Test 2: Formatlanmış madde numaraları');
console.log('==========================================');
if (conditions) {
    const formatted = specialConditionsService.formatArticleNumbers(conditions.specialConditions);
    console.log(`✅ Madde Numaraları: ${formatted}`);
}

console.log('\n✅ Test tamamlandı!');
