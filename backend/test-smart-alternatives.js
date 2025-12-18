// Akıllı Alternatif Sistemi Test
const { findSmartAlternatives, generateStrategy, formatForAI } = require('./smart-alternatives');

console.log('🧪 AKILLI ALTERNATİF SİSTEMİ TEST\n');
console.log('='.repeat(80) + '\n');

// Test Senaryoları
const scenarios = [
    {
        name: 'Senaryo 1: Bilgisayar Mühendisliği (AYT Yetmiyor, TYT Yetiyor)',
        aytRanking: 350000, // 4 yıllığa yetmiyor
        tytRanking: 450000, // 2 yıllığa yetiyor
        dreamDept: 'Bilgisayar Mühendisliği',
        city: 'İstanbul'
    },
    {
        name: 'Senaryo 2: Bilgisayar Mühendisliği (Her İkisi de Yetmiyor)',
        aytRanking: 500000,
        tytRanking: 600000,
        dreamDept: 'Bilgisayar Mühendisliği',
        city: 'İstanbul'
    },
    {
        name: 'Senaryo 3: Yazılım Mühendisliği (AYT Yetmiyor, TYT Yetiyor)',
        aytRanking: 200000,
        tytRanking: 400000,
        dreamDept: 'Yazılım Mühendisliği',
        city: 'İstanbul'
    },
    {
        name: 'Senaryo 4: Bilgisayar Mühendisliği (İyi Sıralama)',
        aytRanking: 100000,
        tytRanking: 350000,
        dreamDept: 'Bilgisayar Mühendisliği',
        city: 'İstanbul'
    }
];

scenarios.forEach((scenario, index) => {
    console.log(`\n📋 ${scenario.name}\n`);
    console.log('-'.repeat(80));
    console.log(`AYT Sıralaması: ${scenario.aytRanking.toLocaleString()}`);
    console.log(`TYT Sıralaması: ${scenario.tytRanking.toLocaleString()}`);
    console.log(`Hedef Bölüm: ${scenario.dreamDept}`);
    console.log(`Şehir: ${scenario.city}`);
    console.log('-'.repeat(80) + '\n');

    // Alternatifler bul
    const alternatives = findSmartAlternatives(
        scenario.dreamDept,
        scenario.aytRanking,
        scenario.tytRanking,
        scenario.city
    );

    if (!alternatives.found) {
        console.log('❌ Alternatif bulunamadı:', alternatives.message);
        return;
    }

    // 4 Yıllık Alternatifler
    console.log('🎓 4 YILLIK ALTERNATİFLER (AYT Bazlı):\n');
    if (alternatives.fourYearOptions.length === 0) {
        console.log('   ⚠️ 4 yıllık alternatif bulunamadı\n');
    } else {
        alternatives.fourYearOptions.forEach((alt, i) => {
            console.log(`${i + 1}. ${alt.name}`);
            console.log(`   • Benzerlik: %${alt.similarity}`);
            console.log(`   • Durum: ${alt.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}`);
            console.log(`   • Taban Eşik: ${alt.threshold.toLocaleString()}`);
            console.log(`   • Sıralama Farkı: ${alt.rankingGap.toLocaleString()}`);
            console.log(`   • Güven: ${alt.confidence.label} (%${alt.confidence.percentage})`);
            console.log(`   • Açıklama: ${alt.description}\n`);
        });
    }

    // 2 Yıllık Alternatifler
    console.log('🎯 2 YILLIK ALTERNATİFLER + DGS (TYT Bazlı):\n');
    if (alternatives.twoYearOptions.length === 0) {
        console.log('   ⚠️ 2 yıllık alternatif bulunamadı\n');
    } else {
        alternatives.twoYearOptions.forEach((alt, i) => {
            console.log(`${i + 1}. ${alt.name}`);
            console.log(`   • Benzerlik: %${alt.similarity}`);
            console.log(`   • Durum: ${alt.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}`);
            console.log(`   • Taban Eşik: ${alt.threshold.toLocaleString()}`);
            console.log(`   • Sıralama Farkı: ${alt.rankingGap.toLocaleString()}`);
            console.log(`   • DGS Hedef: ${alt.dgsTarget}`);
            console.log(`   • DGS Başarı: ~%${alt.dgsSuccessRate}`);
            console.log(`   • Güven: ${alt.confidence.label} (%${alt.confidence.percentage})`);
            
            if (alt.universities && alt.universities.length > 0) {
                console.log(`\n   📊 İSTANBUL ÜNİVERSİTELERİ (${alt.stats.totalEligible} adet):`);
                console.log(`   • Devlet: ${alt.stats.devletCount} | Vakıf: ${alt.stats.vakifCount}`);
                console.log(`   • En İyi Taban: ${alt.stats.bestRanking?.toLocaleString()}`);
                console.log(`   • Ortalama: ${alt.stats.averageRanking?.toLocaleString()}`);
                console.log(`\n   En İyi 5 Seçenek:`);
                alt.universities.slice(0, 5).forEach((uni, idx) => {
                    console.log(`   ${idx + 1}) ${uni.name} (${uni.type})`);
                    console.log(`      📈 Taban: ${uni.minRanking.toLocaleString()}`);
                    console.log(`      📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                    console.log(`      ${uni.safetyLevel.label} - ${uni.safetyLevel.description}`);
                    if (uni.scholarship) {
                        console.log(`      💰 ${uni.scholarship}`);
                    }
                });
            }
            console.log('');
        });
    }

    // Strateji
    const strategy = generateStrategy(alternatives);
    console.log('📋 TERCİH STRATEJİSİ:\n');
    
    if (strategy.recommended.length > 0) {
        console.log('🟢 ÖNCELİKLİ TERCİHLER (1-6):');
        strategy.recommended.forEach(s => {
            console.log(`   • ${s.department}`);
            console.log(`     ${s.reason}`);
            console.log(`     ➡️  ${s.action}\n`);
        });
    }

    if (strategy.safe.length > 0) {
        console.log('🟡 GÜVENLİ TERCİHLER (7-12):');
        strategy.safe.forEach(s => {
            console.log(`   • ${s.department}`);
            console.log(`     ${s.reason}`);
            console.log(`     ➡️  ${s.action}\n`);
        });
    }

    if (strategy.dgsPath.length > 0) {
        console.log('🎓 DGS YOLU (13-24):');
        strategy.dgsPath.forEach(s => {
            console.log(`   • ${s.department} → ${s.dgsTarget}`);
            console.log(`     ${s.reason}`);
            console.log(`     Başarı Oranı: ${s.successRate}`);
            console.log(`     ➡️  ${s.action}`);
            if (s.universities && s.universities.length > 0) {
                console.log(`     İlk 3 Üniversite:`);
                s.universities.slice(0, 3).forEach((u, i) => {
                    console.log(`       ${i + 1}) ${u.name} - ${u.safetyLevel.label}`);
                });
            }
            console.log('');
        });
    }

    if (strategy.recommended.length === 0 && strategy.safe.length === 0 && strategy.dgsPath.length === 0) {
        console.log('   ⚠️ Uygun alternatif bulunamadı. Sıralama çok düşük olabilir.\n');
    }

    console.log('\n' + '='.repeat(80) + '\n');
});

// AI formatını test et
console.log('\n🤖 AI FORMAT ÖRNEĞİ:\n');
console.log('='.repeat(80) + '\n');

const sampleAlternatives = findSmartAlternatives(
    'Bilgisayar Mühendisliği',
    350000,
    450000,
    'İstanbul'
);

const sampleStrategy = generateStrategy(sampleAlternatives);
const aiFormat = formatForAI(sampleAlternatives, sampleStrategy);

console.log(aiFormat);

console.log('\n✅ Test tamamlandı!\n');
