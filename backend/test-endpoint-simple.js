// Simple API test - No AI
const { findSmartAlternatives, generateStrategy } = require('./smart-alternatives');

console.log('\n🧪 API ENDPOINT SIMULATION (NO AI)\n');
console.log('='.repeat(80) + '\n');

const testData = {
    aytRanking: 350000,
    tytRanking: 450000,
    dreamDept: 'Bilgisayar Mühendisliği',
    city: 'İstanbul',
    gender: 'Erkek',
    educationType: 'Tümü'
};

console.log('📥 Request Body:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n' + '-'.repeat(80) + '\n');

try {
    // 1. Alternatifleri bul
    const alternatives = findSmartAlternatives(
        testData.dreamDept,
        testData.aytRanking,
        testData.tytRanking,
        testData.city
    );

    // 2. Strateji oluştur
    const strategy = generateStrategy(alternatives);

    // 3. Response oluştur
    const result = {
        status: 'success',
        dreamDepartment: testData.dreamDept,
        userProfile: testData,
        alternatives: {
            fourYear: alternatives.fourYearOptions,
            twoYear: alternatives.twoYearOptions
        },
        strategy,
        summary: {
            total4Year: alternatives.fourYearOptions.length,
            eligible4Year: alternatives.fourYearOptions.filter(a => a.eligible).length,
            total2Year: alternatives.twoYearOptions.length,
            eligible2Year: alternatives.twoYearOptions.filter(a => a.eligible).length,
            hasDetailedData: alternatives.twoYearOptions.some(a => a.universities && a.universities.length > 0)
        }
    };

    console.log('✅ API Response Generated\n');
    console.log('📊 Summary:');
    console.log(`   4 Yıllık Alternatifler: ${result.summary.total4Year} (Uygun: ${result.summary.eligible4Year})`);
    console.log(`   2 Yıllık Alternatifler: ${result.summary.total2Year} (Uygun: ${result.summary.eligible2Year})`);
    console.log(`   Detaylı Veri Var mı? ${result.summary.hasDetailedData ? 'EVET' : 'HAYIR'}\n`);

    // Bilgisayar Programcılığı detayı
    const csProgram = result.alternatives.twoYear.find(a => a.name === 'Bilgisayar Programcılığı');
    if (csProgram) {
        console.log('🎓 BİLGİSAYAR PROGRAMCILIĞI DETAY:');
        console.log(`   Durum: ${csProgram.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}`);
        console.log(`   Üniversite Sayısı: ${csProgram.universities?.length || 0}`);
        if (csProgram.stats) {
            console.log(`   Devlet: ${csProgram.stats.devletCount}`);
            console.log(`   Vakıf: ${csProgram.stats.vakifCount}`);
            console.log(`   En İyi Taban: ${csProgram.stats.bestRanking?.toLocaleString()}`);
        }

        if (csProgram.universities && csProgram.universities.length > 0) {
            console.log(`\n   İlk 5 Üniversite:`);
            csProgram.universities.slice(0, 5).forEach((uni, idx) => {
                console.log(`   ${idx + 1}. ${uni.name} (${uni.type}) - ${uni.minRanking.toLocaleString()}`);
            });
        }
    } else {
        console.log('❌ Bilgisayar Programcılığı bulunamadı!');
    }

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('✅ Test Başarılı!\n');

} catch (error) {
    console.error('\n❌ HATA:', error.message);
    console.error(error.stack);
}
