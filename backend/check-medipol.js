const specialConditionsService = require('./special-conditions-service');

console.log('🏥 İstanbul Medipol Tıp - ÖSYM Şartları\n');
console.log('='.repeat(80));

const data = specialConditionsService.getConditionsByProgramCode('203110477');

if (data) {
    console.log(`Program Kodu: ${data.programCode}`);
    console.log(`Üniversite: ${data.university}`);
    console.log(`Program: ${data.programName}\n`);
    console.log('📋 Şart Maddeleri:\n');
    
    data.specialConditions.forEach((madde, index) => {
        console.log(`${index + 1}. MADDE ${madde.madde_no} (${madde.madde_kodu})`);
        console.log(`   ${madde.icerik.substring(0, 150)}...`);
        console.log('');
    });
} else {
    console.log('❌ Program bulunamadı');
}
