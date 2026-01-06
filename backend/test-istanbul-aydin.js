const {
    getConditionsByUniversityAndProgram,
    formatArticleNumbers
} = require('./special-conditions-service');

console.log('🔍 İstanbul Aydın Üniversitesi - Bilgisayar Mühendisliği Şartları:\n');

const result = getConditionsByUniversityAndProgram('İSTANBUL AYDIN', 'Bilgisayar Mühendisliği');

if (result) {
    console.log('✅ Program bulundu!');
    console.log('Üniversite:', result.university);
    console.log('Program:', result.programName);
    console.log('Madde Sayısı:', result.specialConditions.length);
    console.log('Madde Numaraları:', formatArticleNumbers(result.specialConditions));
    console.log('\nDetaylar:');
    result.specialConditions.forEach(c => {
        console.log(`  - ${c.code}: ${c.description.substring(0, 80)}...`);
    });
} else {
    console.log('❌ Program bulunamadı!');
    console.log('\nİstanbul Aydın programlarını arıyorum...');
    
    const { getAllProgramsByUniversity } = require('./special-conditions-service');
    const programs = getAllProgramsByUniversity('AYDIN');
    
    console.log(`\n${programs.length} program bulundu:`);
    programs.slice(0, 10).forEach(p => {
        console.log(`  - ${p.programName}`);
    });
}
