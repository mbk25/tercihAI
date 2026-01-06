const specialConditionsService = require('./special-conditions-service');

console.log('🏥 TIP PROGRAMI - ÖSYM ŞART TESTİ\n');
console.log('='.repeat(80));

// İstanbul Medipol Tıp programı
const tipProgram = specialConditionsService.getConditionsByProgramCode('203110477');

if (tipProgram) {
    console.log(`\n🎓 ÜNİVERSİTE: ${tipProgram.university}`);
    console.log(`📚 PROGRAM: ${tipProgram.programName}`);
    console.log(`🔢 PROGRAM KODU: ${tipProgram.programCode}`);
    console.log(`📋 ŞART SAYISI: ${tipProgram.specialConditions.length}\n`);
    console.log('='.repeat(80));
    
    tipProgram.specialConditions.forEach((madde, index) => {
        console.log(`\n${index + 1}. ${madde.madde_kodu}`);
        console.log(`   Madde No: ${madde.madde_no}`);
        console.log(`   İçerik: ${madde.icerik.substring(0, 200)}${madde.icerik.length > 200 ? '...' : ''}`);
        console.log('-'.repeat(80));
    });
} else {
    console.log('❌ Program bulunamadı');
}

console.log('\n\n✅ Test tamamlandı!');
