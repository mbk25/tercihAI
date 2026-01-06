const scs = require('./special-conditions-service');

console.log('📊 Special Conditions Data Analizi\n');

const data = scs.loadSpecialConditionsData();

console.log(`Toplam Program: ${data.length}\n`);
console.log('İlk 10 Program:');
console.log('='.repeat(80));

data.slice(0, 10).forEach((p, index) => {
    const conditionCount = Array.isArray(p.specialConditions) ? p.specialConditions.length : 0;
    console.log(`${index + 1}. ${p.university} - ${p.program}`);
    console.log(`   Program Kodu: ${p.programCode}`);
    console.log(`   Şart Sayısı: ${conditionCount}`);
    console.log('-'.repeat(80));
});

// Abdullah Gül Üniversitesi'ni ara
console.log('\n🔍 "ABDULLAH" içeren programlar:');
const abdullah = data.filter(p => p.university && p.university.includes('ABDULLAH'));
abdullah.forEach(p => {
    console.log(`- ${p.university} - ${p.program} (${p.programCode})`);
});
