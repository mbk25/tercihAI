// Akıllı Alternatif Öneri Sistemi V2
// Tüm Türkiye için çalışır, veritabanından veri çeker

const fs = require('fs');
const path = require('path');

// special-conditions-service.js modülünü import et
const specialConditionsService = require('./special-conditions-service');

// Üniversite için özel şartları bul - special-conditions-service kullan
function getSpecialConditionsForUniversity(universityName, programName) {
    const conditionData = specialConditionsService.getConditionsByUniversityAndProgram(universityName, programName);
    
    if (conditionData && conditionData.specialConditions && conditionData.specialConditions.length > 0) {
        const maddeNumbers = conditionData.specialConditions.map(c => c.madde_no).sort((a, b) => a - b);
        return {
            found: true,
            conditionNumbers: maddeNumbers.join(', '),
            articleNumbers: maddeNumbers
        };
    }

    return {
        found: false,
        conditionNumbers: '',
        articleNumbers: []
    };
}

// Bölüm alternatif haritası
const DEPARTMENT_ALTERNATIVES = {
    "Bilgisayar Mühendisliği": {
        fourYearAlternatives: [
            {
                name: "Yazılım Mühendisliği",
                threshold: 50000,
                similarity: 95,
                description: "Yazılım geliştirme odaklı, Bilgisayar Mühendisliğine çok benzer kariyer fırsatları"
            },
            {
                name: "Bilgisayar ve Öğretim Teknolojileri",
                threshold: 120000,
                similarity: 80,
                description: "Teknoloji ve eğitim, hem yazılım hem öğretmenlik seçeneği"
            },
            {
                name: "Yönetim Bilişim Sistemleri",
                threshold: 150000,
                similarity: 75,
                description: "İş dünyası + teknoloji, yönetim ve yazılım birleşimi"
            },
            {
                name: "Bilgisayar Teknolojisi ve Bilişim Sistemleri",
                threshold: 180000,
                similarity: 85,
                description: "Uygulamalı bilgisayar teknolojileri, sistem yönetimi"
            }
        ],
        twoYearAlternatives: [
            {
                name: "Bilgisayar Programcılığı",
                threshold: 450000,
                similarity: 70,
                description: "2 yıllık programcılık eğitimi, DGS ile Bilgisayar Mühendisliğine geçiş",
                dgsTarget: "Bilgisayar Mühendisliği, Yazılım Mühendisliği",
                dgsSuccessRate: 65
            },
            {
                name: "Web Tasarım ve Kodlama",
                threshold: 500000,
                similarity: 60,
                description: "Frontend ve backend web geliştirme, DGS ile 4 yıllığa geçiş",
                dgsTarget: "Bilgisayar Mühendisliği, Yazılım Mühendisliği",
                dgsSuccessRate: 55
            },
            {
                name: "Bilgisayar Teknolojisi",
                threshold: 520000,
                similarity: 65,
                description: "Genel bilgisayar teknolojileri, DGS fırsatı",
                dgsTarget: "Bilgisayar ve Öğretim Teknolojileri",
                dgsSuccessRate: 60
            }
        ]
    },
    "Yazılım Mühendisliği": {
        fourYearAlternatives: [
            {
                name: "Bilgisayar Mühendisliği",
                threshold: 45000,
                similarity: 95,
                description: "Daha geniş kapsamlı, hem donanım hem yazılım"
            },
            {
                name: "Bilgisayar Teknolojisi ve Bilişim Sistemleri",
                threshold: 180000,
                similarity: 80,
                description: "Uygulamalı teknoloji ve sistem geliştirme"
            }
        ],
        twoYearAlternatives: [
            {
                name: "Bilgisayar Programcılığı",
                threshold: 450000,
                similarity: 75,
                description: "Yazılım geliştirme temelleri, DGS ile Yazılım Mühendisliğine geçiş",
                dgsTarget: "Yazılım Mühendisliği, Bilgisayar Mühendisliği",
                dgsSuccessRate: 70
            }
        ]
    }
};

/**
 * Güven seviyesi hesapla
 */
function calculateConfidence(userRanking, threshold) {
    const diff = threshold - userRanking;
    const percentage = (diff / threshold) * 100;

    if (percentage >= 20) return { level: 'very_high', label: '🟢 Çok Yüksek', percentage: 95 };
    if (percentage >= 10) return { level: 'high', label: '🟢 Yüksek', percentage: 85 };
    if (percentage >= 0) return { level: 'medium', label: '🟡 Orta', percentage: 65 };
    if (percentage >= -5) return { level: 'low', label: '🟠 Düşük', percentage: 40 };
    return { level: 'very_low', label: '🔴 Çok Düşük', percentage: 15 };
}

/**
 * Güvenlik seviyesi hesapla (tercih için)
 */
function calculateSafetyLevel(userRanking, uniRanking) {
    const diff = uniRanking - userRanking;

    if (diff > 100000) return { level: 'very_safe', label: '🟢🟢 Çok Güvenli', description: 'Kesinlikle kazanırsınız' };
    if (diff > 50000) return { level: 'safe', label: '🟢 Güvenli', description: 'Yüksek kazanma şansı' };
    if (diff > 20000) return { level: 'moderate', label: '🟡 Makul', description: 'İyi bir şans' };
    if (diff > 5000) return { level: 'risky', label: '🟠 Riskli', description: 'Dikkatli tercih yapın' };
    return { level: 'very_risky', label: '🔴 Çok Riskli', description: 'Alternatif tercihler ekleyin' };
}

/**
 * Akıllı alternatif öner - YENİ VERSİYON: Veritabanından veri çeker
 * Tüm Türkiye için çalışır, şehir filtrelemesi yapar
 */
async function findSmartAlternativesV2(dreamDept, aytRanking, tytRanking, city = null, scrapeYokAtlas) {
    const alternatives = DEPARTMENT_ALTERNATIVES[dreamDept];

    if (!alternatives) {
        return {
            found: false,
            message: `${dreamDept} için henüz alternatif haritası oluşturulmamış.`
        };
    }

    const result = {
        found: true,
        dreamDepartment: dreamDept,
        aytRanking,
        tytRanking,
        selectedCities: city ? city.split(',').map(c => c.trim()) : [],
        fourYearOptions: [],
        twoYearOptions: []
    };

    // Şehir filtresi için normalize edilmiş şehir listesi
    const normalizedCities = result.selectedCities.map(c => c.toLocaleLowerCase('tr-TR'));

    console.log(`🎯 Alternatif arama başladı: ${dreamDept}`);
    console.log(`   Şehirler: ${normalizedCities.length > 0 ? normalizedCities.join(', ') : 'Tüm Türkiye'}`);

    // 4 yıllık alternatifler (AYT bazlı) - Veritabanından çek
    if (alternatives.fourYearAlternatives && aytRanking && scrapeYokAtlas) {
        console.log(`🔍 4 yıllık alternatifler aranıyor...`);
        const fourYearOptions = await Promise.all(
            alternatives.fourYearAlternatives.map(async (alt) => {
                try {
                    // ÖNCE THRESHOLD KONTROLÜ YAP!
                    if (aytRanking > alt.threshold) {
                        console.log(`   ⏭️  ${alt.name} atlanıyor - Threshold: ${alt.threshold}, Kullanıcı AYT: ${aytRanking} (${aytRanking - alt.threshold} puan fark)`);
                        return {
                            ...alt,
                            eligible: false,
                            rankingGap: aytRanking - alt.threshold,
                            confidence: 0,
                            universities: [],
                            stats: { totalEligible: 0, devletCount: 0, vakifCount: 0, bestRanking: 0, worstRanking: 0 }
                        };
                    }
                    
                    console.log(`   ✅ ${alt.name} uygun - Threshold: ${alt.threshold}, Kullanıcı AYT: ${aytRanking}`);
                    console.log(`   📚 ${alt.name} için veriler çekiliyor...`);
                    // Veritabanından bu program için üniversiteleri çek (şehir filtresi ile)
                    const allUnis = await scrapeYokAtlas(alt.name, 2024, null, result.selectedCities.length > 0 ? result.selectedCities : null);
                    console.log(`   ✅ ${allUnis.length} üniversite bulundu`);

                    // Kullanıcının sıralamasına uygun olanları filtrele
                    console.log(`   🔍 Sıralama kontrolü: Kullanıcı AYT = ${aytRanking}`);
                    const eligibleUnis = allUnis.filter(uni => {
                        const uniRank = uni.ranking || uni.minRanking || 999999;
                        const isEligible = aytRanking <= uniRank;
                        if (allUnis.indexOf(uni) < 3) { // İlk 3 üniversite için log
                            console.log(`      ${uni.name}: Taban ${uniRank}, ${aytRanking} <= ${uniRank} ? ${isEligible ? '✅ UYGUN' : '❌ UYGUN DEĞİL'}`);
                        }
                        return isEligible;
                    });
                    console.log(`   ✅ Sıralama filtresi sonrası: ${eligibleUnis.length} üniversite`);

                    return {
                        ...alt,
                        eligible: eligibleUnis.length > 0,
                        rankingGap: aytRanking - alt.threshold,
                        confidence: calculateConfidence(aytRanking, alt.threshold),
                        universities: eligibleUnis.slice(0, 20).map(uni => ({
                            name: uni.name,
                            city: uni.city || 'Bilinmiyor',
                            type: uni.type,
                            campus: uni.campus,
                            ranking: uni.ranking || uni.minRanking,
                            quota: uni.quota,
                            conditionNumbers: getSpecialConditionsForUniversity(uni.name, alt.name).conditionNumbers
                        })),
                        stats: {
                            totalEligible: eligibleUnis.length,
                            devletCount: eligibleUnis.filter(u => u.type === 'Devlet').length,
                            vakifCount: eligibleUnis.filter(u => u.type === 'Vakıf' || u.type === 'Özel').length,
                            bestRanking: eligibleUnis.length > 0 ? Math.min(...eligibleUnis.map(u => u.ranking || u.minRanking || 999999)) : 0,
                            worstRanking: eligibleUnis.length > 0 ? Math.max(...eligibleUnis.map(u => u.ranking || u.minRanking || 0)) : 0
                        }
                    };
                } catch (error) {
                    console.error(`❌ ${alt.name} için veri çekme hatası:`, error.message);
                    return {
                        ...alt,
                        eligible: false,
                        rankingGap: aytRanking - alt.threshold,
                        confidence: calculateConfidence(aytRanking, alt.threshold),
                        universities: [],
                        stats: { totalEligible: 0, devletCount: 0, vakifCount: 0, bestRanking: 0, worstRanking: 0 }
                    };
                }
            })
        );

        result.fourYearOptions = fourYearOptions.sort((a, b) => b.similarity - a.similarity);
    }

    // 2 yıllık alternatifler (TYT bazlı) - Veritabanından çek
    if (alternatives.twoYearAlternatives && tytRanking && scrapeYokAtlas) {
        console.log(`🔍 2 yıllık alternatifler aranıyor...`);
        const twoYearOptions = await Promise.all(
            alternatives.twoYearAlternatives.map(async (alt) => {
                try {
                    // ÖNCE THRESHOLD KONTROLÜ YAP!
                    if (tytRanking > alt.threshold) {
                        console.log(`   ⏭️  ${alt.name} atlanıyor - Threshold: ${alt.threshold}, Kullanıcı TYT: ${tytRanking} (${tytRanking - alt.threshold} puan fark)`);
                        return {
                            ...alt,
                            eligible: false,
                            rankingGap: tytRanking - alt.threshold,
                            confidence: 0,
                            universities: [],
                            stats: { totalEligible: 0, devletCount: 0, vakifCount: 0, bestRanking: 0, worstRanking: 0 }
                        };
                    }
                    
                    console.log(`   ✅ ${alt.name} uygun - Threshold: ${alt.threshold}, Kullanıcı TYT: ${tytRanking}`);
                    console.log(`   📚 ${alt.name} için veriler çekiliyor...`);
                    // Veritabanından bu program için üniversiteleri çek (Önlisans + şehir filtresi ile)
                    const allUnis = await scrapeYokAtlas(alt.name, 2024, 'Önlisans', result.selectedCities.length > 0 ? result.selectedCities : null);
                    console.log(`   ✅ ${allUnis.length} üniversite bulundu`);

                    // Kullanıcının sıralamasına uygun olanları filtrele
                    console.log(`   🔍 Sıralama kontrolü: Kullanıcı TYT = ${tytRanking}`);
                    const eligibleUnis = allUnis.filter(uni => {
                        const uniRank = uni.ranking || uni.minRanking || 999999;
                        const isEligible = tytRanking <= uniRank;
                        if (allUnis.indexOf(uni) < 3) { // İlk 3 üniversite için log
                            console.log(`      ${uni.name}: Taban ${uniRank}, ${tytRanking} <= ${uniRank} ? ${isEligible ? '✅ UYGUN' : '❌ UYGUN DEĞİL'}`);
                        }
                        return isEligible;
                    });
                    console.log(`   ✅ Sıralama filtresi sonrası: ${eligibleUnis.length} üniversite`);

                    return {
                        ...alt,
                        eligible: eligibleUnis.length > 0,
                        rankingGap: tytRanking - alt.threshold,
                        confidence: calculateConfidence(tytRanking, alt.threshold),
                        universities: eligibleUnis.slice(0, 20).map(uni => ({
                            name: uni.name,
                            city: uni.city || 'Bilinmiyor',
                            type: uni.type,
                            campus: uni.campus,
                            ranking: uni.ranking || uni.minRanking,
                            quota: uni.quota,
                            safetyLevel: calculateSafetyLevel(tytRanking, uni.ranking || uni.minRanking),
                            conditionNumbers: getSpecialConditionsForUniversity(uni.name, alt.name).conditionNumbers
                        })),
                        stats: {
                            totalEligible: eligibleUnis.length,
                            devletCount: eligibleUnis.filter(u => u.type === 'Devlet').length,
                            vakifCount: eligibleUnis.filter(u => u.type === 'Vakıf' || u.type === 'Özel').length,
                            bestRanking: eligibleUnis.length > 0 ? Math.min(...eligibleUnis.map(u => u.ranking || u.minRanking || 999999)) : 0,
                            worstRanking: eligibleUnis.length > 0 ? Math.max(...eligibleUnis.map(u => u.ranking || u.minRanking || 0)) : 0
                        }
                    };
                } catch (error) {
                    console.error(`❌ ${alt.name} için veri çekme hatası:`, error.message);
                    return {
                        ...alt,
                        eligible: false,
                        rankingGap: tytRanking - alt.threshold,
                        confidence: calculateConfidence(tytRanking, alt.threshold),
                        universities: [],
                        stats: { totalEligible: 0, devletCount: 0, vakifCount: 0, bestRanking: 0, worstRanking: 0 }
                    };
                }
            })
        );

        result.twoYearOptions = twoYearOptions.sort((a, b) => b.similarity - a.similarity);
    }

    console.log(`✅ Alternatif arama tamamlandı: ${result.fourYearOptions.filter(o => o.eligible).length} 4 yıllık, ${result.twoYearOptions.filter(o => o.eligible).length} 2 yıllık`);

    return result;
}

/**
 * Detaylı tercih stratejisi oluştur
 */
function generateStrategy(alternatives) {
    const strategy = {
        recommended: [],
        safe: [],
        risky: [],
        dgsPath: []
    };

    // 4 yıllık öneriler
    alternatives.fourYearOptions.forEach(opt => {
        if (opt.eligible && opt.confidence.level === 'very_high') {
            strategy.recommended.push({
                type: '4 Yıllık',
                department: opt.name,
                reason: `${opt.similarity}% benzerlik, yüksek güven seviyesi`,
                action: 'İlk 6 tercihte mutlaka ekleyin'
            });
        } else if (opt.eligible) {
            strategy.safe.push({
                type: '4 Yıllık',
                department: opt.name,
                reason: `${opt.similarity}% benzerlik`,
                action: '7-12 tercih aralığında değerlendirin'
            });
        }
    });

    // 2 yıllık + DGS öneriler
    alternatives.twoYearOptions.forEach(opt => {
        if (opt.eligible) {
            strategy.dgsPath.push({
                type: '2 Yıllık (DGS)',
                department: opt.name,
                dgsTarget: opt.dgsTarget,
                successRate: `~%${opt.dgsSuccessRate}`,
                reason: `${opt.similarity}% benzerlik, DGS ile ${opt.dgsTarget}`,
                action: 'Son 6-8 tercihte güvenli seçenek olarak ekleyin',
                universities: opt.universities ? opt.universities.slice(0, 5) : []
            });
        }
    });

    return strategy;
}

/**
 * AI için formatlı özet
 */
function formatForAI(alternatives, strategy) {
    return `
🎯 AKILLI ALTERNATİF ANALİZ SONUÇLARI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 KULLANICI DURUMU:
• Hedef Bölüm: ${alternatives.dreamDepartment}
• AYT Sırası: ${alternatives.aytRanking?.toLocaleString() || 'N/A'}
• TYT Sırası: ${alternatives.tytRanking?.toLocaleString() || 'N/A'}
• Seçilen Şehirler: ${alternatives.selectedCities.length > 0 ? alternatives.selectedCities.join(', ') : 'Tüm Türkiye'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 4 YILLIK ALTERNATİFLER (AYT Bazlı):
${alternatives.fourYearOptions.slice(0, 3).map((opt, i) => `
${i + 1}. ${opt.name}
   • Benzerlik: %${opt.similarity}
   • Durum: ${opt.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}
   • Sıralama Farkı: ${opt.rankingGap.toLocaleString()}
   • Güven: ${opt.confidence.label}
   • Açıklama: ${opt.description}
   ${opt.eligible ? `• Uygun Üniversite: ${opt.stats.totalEligible} (${opt.stats.devletCount} Devlet, ${opt.stats.vakifCount} Vakıf)` : ''}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎓 2 YILLIK + DGS STRATEJİSİ (TYT Bazlı):
${alternatives.twoYearOptions.map((opt, i) => `
${i + 1}. ${opt.name}
   • Benzerlik: %${opt.similarity}
   • Durum: ${opt.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}
   • DGS Hedef: ${opt.dgsTarget}
   • DGS Başarı Oranı: ~%${opt.dgsSuccessRate}
   • Açıklama: ${opt.description}
   ${opt.eligible ? `
   • Uygun Üniversite Sayısı: ${opt.stats.totalEligible} (${opt.stats.devletCount} Devlet, ${opt.stats.vakifCount} Vakıf)
   • En İyi Taban: ${opt.stats.bestRanking?.toLocaleString()}
   
   İlk 5 Seçenek:
   ${opt.universities.slice(0, 5).map((u, idx) =>
        `   ${idx + 1}) ${u.name} (${u.city}) - ${u.type} - Taban: ${u.ranking.toLocaleString()} - ${u.safetyLevel.label}`
    ).join('\n')}` : ''}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TERCİH STRATEJİSİ:
${strategy.recommended.length > 0 ? `
🟢 ÖNCELİKLİ TERCİHLER (1-6):
${strategy.recommended.map(s => `   • ${s.department}: ${s.reason}`).join('\n')}
` : ''}

${strategy.safe.length > 0 ? `
🟡 GÜVENLİ TERCİHLER (7-12):
${strategy.safe.map(s => `   • ${s.department}: ${s.reason}`).join('\n')}
` : ''}

${strategy.dgsPath.length > 0 ? `
🎓 DGS YOLU (13-24):
${strategy.dgsPath.map(s => `   • ${s.department} → ${s.dgsTarget} (Başarı: ${s.successRate})`).join('\n')}
` : ''}
`;
}

module.exports = {
    findSmartAlternativesV2,
    generateStrategy,
    formatForAI,
    DEPARTMENT_ALTERNATIVES,
    getSpecialConditionsForUniversity
};
