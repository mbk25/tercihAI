const {
    getConditionsByProgramCode,
    getConditionsByUniversityAndProgram,
    getAllProgramsByUniversity,
    formatArticleNumbers,
    getConditionDescriptions,
    getLegend
} = require('./special-conditions-service');

console.log('🧪 special_conditions2.json Test Başlatıldı\n');

// Test 1: Program koduna göre şart getir
console.log('📋 Test 1: Program Koduna Göre Şart Getir');
const conditions1 = getConditionsByProgramCode('203110477');
if (conditions1) {
    console.log('✅ Program:', conditions1.university, '-', conditions1.programName);
    console.log('📝 Şart Kodları:', formatArticleNumbers(conditions1.specialConditions));
    console.log('📄 Şart Detayları:', getConditionDescriptions(conditions1.specialConditions));
} else {
    console.log('❌ Program bulunamadı');
}

console.log('\n' + '='.repeat(80) + '\n');

// Test 2: Üniversite ve program adına göre şart getir
console.log('📋 Test 2: Üniversite ve Program Adına Göre Şart Getir');
const conditions2 = getConditionsByUniversityAndProgram('KOÇ', 'Bilgisayar Mühendisliği');
if (conditions2) {
    console.log('✅ Program:', conditions2.university, '-', conditions2.programName);
    console.log('📝 Şart Kodları:', formatArticleNumbers(conditions2.specialConditions));
    console.log('📄 Şart Sayısı:', conditions2.specialConditions.length);
} else {
    console.log('❌ Program bulunamadı');
}

console.log('\n' + '='.repeat(80) + '\n');

// Test 3: Bir üniversitenin tüm programlarını getir
console.log('📋 Test 3: Bir Üniversitenin Tüm Programlarını Getir');
const programs = getAllProgramsByUniversity('İSTANBUL MEDİPOL');
console.log(`✅ ${programs.length} program bulundu:`);
programs.slice(0, 3).forEach(p => {
    console.log(`   - ${p.programName} (${p.specialConditions.length} şart)`);
});

console.log('\n' + '='.repeat(80) + '\n');

// Test 4: Legend verisini getir
console.log('📋 Test 4: Legend Verilerini Getir');
const legend = getLegend();
const legendKeys = Object.keys(legend);
console.log(`✅ Toplam ${legendKeys.length} şart maddesi tanımı var`);
console.log('📝 İlk 5 madde:');
legendKeys.slice(0, 5).forEach(key => {
    console.log(`   ${key}: ${legend[key].substring(0, 60)}...`);
});

console.log('\n🎉 Tüm testler tamamlandı!\n');
