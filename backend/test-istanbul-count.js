// İstanbul Bilgisayar Programcılığı Sayısını Test Et
const { findSmartAlternatives } = require('./smart-alternatives');

console.log('\n🧪 İSTANBUL BİLGİSAYAR PROGRAMCILIĞI TEST\n');
console.log('='.repeat(80) + '\n');

// Test et
const alternatives = findSmartAlternatives(
    'Bilgisayar Mühendisliği',
    350000,  // AYT
    450000,  // TYT
    'İstanbul'
);

const csProgram = alternatives.twoYearOptions.find(o => o.name === 'Bilgisayar Programcılığı');

if (csProgram && csProgram.universities) {
    console.log('✅ Bilgisayar Programcılığı Bulundu!\n');
    console.log(`📊 İSTATİSTİKLER:`);
    console.log(`   • Toplam Uygun: ${csProgram.stats.totalEligible} üniversite`);
    console.log(`   • Devlet: ${csProgram.stats.devletCount}`);
    console.log(`   • Vakıf: ${csProgram.stats.vakifCount}`);
    console.log(`   • En İyi Taban: ${csProgram.stats.bestRanking.toLocaleString()}`);
    console.log(`   • Ortalama Taban: ${csProgram.stats.averageRanking.toLocaleString()}\n`);

    console.log('🎓 İLK 15 ÜNİVERSİTE (Taban Sırasına Göre):\n');
    csProgram.universities.slice(0, 15).forEach((uni, idx) => {
        console.log(`${idx + 1}. ${uni.name}`);
        console.log(`   • Tür: ${uni.type}`);
        console.log(`   • Taban Sırası: ${uni.minRanking.toLocaleString()}`);
        console.log(`   • Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
        console.log(`   • Güvenlik: ${uni.safetyLevel.label} - ${uni.safetyLevel.description}`);
        if (uni.scholarship) {
            console.log(`   • Burs: ${uni.scholarship}`);
        }
        console.log('');
    });

    console.log(`\n📋 Gösterilmeyen: ${csProgram.universities.length - 15} üniversite daha\n`);

} else {
    console.log('❌ Bilgisayar Programcılığı bulunamadı veya üniversite yok!\n');
}

console.log('='.repeat(80) + '\n');
