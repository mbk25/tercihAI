const specialConditionsService = require('./special-conditions-service');

console.log('🧪 API Test - Üniversite Adıyla Arama\n');

const testCases = [
    { uni: 'ABDULLAH GÜL', prog: 'Psikoloji' },
    { uni: 'Abdullah Gül Üniversitesi', prog: 'Psikoloji' },
    { uni: 'İSTANBUL MEDİPOL', prog: 'Tıp' },
    { uni: 'KOÇ', prog: 'Ekonomi' }
];

testCases.forEach(test => {
    console.log(`\n🔍 Test: "${test.uni}" - "${test.prog}"`);
    console.log('='.repeat(80));
    
    const result = specialConditionsService.getConditionsByUniversityAndProgram(test.uni, test.prog);
    
    if (result) {
        console.log(`✅ BULUNDU!`);
        console.log(`   Program Kodu: ${result.programCode}`);
        console.log(`   Üniversite: ${result.university}`);
        console.log(`   Program: ${result.programName}`);
        console.log(`   Şart Sayısı: ${result.specialConditions.length}`);
        
        if (result.specialConditions.length > 0) {
            console.log(`\n   İlk şart:`);
            const first = result.specialConditions[0];
            console.log(`   - Madde No: ${first.madde_no}`);
            console.log(`   - Madde Kodu: ${first.madde_kodu}`);
            console.log(`   - İçerik: ${first.icerik.substring(0, 100)}...`);
        }
    } else {
        console.log(`❌ BULUNAMADI`);
    }
});
