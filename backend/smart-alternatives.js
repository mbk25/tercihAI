// Akıllı Alternatif Öneri Sistemi
const istanbulCSData = require('./istanbul-bilgisayar-programciligi-data');

/**
 * Kullanıcının hayalindeki bölüme göre akıllı alternatifler öner
 * 1. Hedef bölüm (örn: Bilgisayar Mühendisliği)
 * 2. AYT sırasına göre 4 yıllık alternatifler
 * 3. TYT sırasına göre 2 yıllık + DGS stratejisi
 */

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
                dgsSuccessRate: 65,
                hasDataset: true // İstanbul verisi var
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
                name: "Bilgisayar Teknolojileri",
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
                dgsSuccessRate: 70,
                hasDataset: true
            }
        ]
    },
    "Elektrik-Elektronik Mühendisliği": {
        twoYearAlternatives: [
            {
                name: "Elektrik",
                threshold: 480000,
                similarity: 65,
                description: "2 yıllık elektrik teknisyenliği, DGS ile mühendisliğe geçiş",
                dgsTarget: "Elektrik-Elektronik Mühendisliği",
                dgsSuccessRate: 50
            }
        ]
    },
    "Makine Mühendisliği": {
        twoYearAlternatives: [
            {
                name: "Makine",
                threshold: 500000,
                similarity: 60,
                description: "2 yıllık makine teknolojisi, DGS ile mühendisliğe",
                dgsTarget: "Makine Mühendisliği",
                dgsSuccessRate: 45
            }
        ]
    }
};

/**
 * Akıllı alternatif öner
 */
function findSmartAlternatives(dreamDept, aytRanking, tytRanking, city = null) {
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
        fourYearOptions: [],
        twoYearOptions: []
    };

    // 4 yıllık alternatifler (AYT bazlı)
    if (alternatives.fourYearAlternatives && aytRanking) {
        result.fourYearOptions = alternatives.fourYearAlternatives
            .filter(alt => aytRanking >= alt.threshold * 0.9) // %10 tolerans
            .map(alt => ({
                ...alt,
                eligible: aytRanking <= alt.threshold,
                rankingGap: aytRanking - alt.threshold,
                confidence: calculateConfidence(aytRanking, alt.threshold)
            }))
            .sort((a, b) => b.similarity - a.similarity);
    }

    // 2 yıllık alternatifler (TYT bazlı)
    if (alternatives.twoYearAlternatives && tytRanking) {
        result.twoYearOptions = alternatives.twoYearAlternatives
            .map(alt => {
                const eligible = tytRanking <= alt.threshold;
                const option = {
                    ...alt,
                    eligible,
                    rankingGap: tytRanking - alt.threshold,
                    confidence: calculateConfidence(tytRanking, alt.threshold)
                };

                // Eğer Bilgisayar Programcılığı ise ve İstanbul verisi varsa ekle
                if (alt.name === "Bilgisayar Programcılığı" && alt.hasDataset) {
                    const istanbulUnis = getIstanbulCSUniversities(tytRanking, city);
                    option.universities = istanbulUnis.eligible;
                    option.nearMiss = istanbulUnis.nearMiss;
                    option.stats = istanbulUnis.stats;
                }

                return option;
            })
            .sort((a, b) => b.similarity - a.similarity);
    }

    return result;
}

/**
 * İstanbul Bilgisayar Programcılığı üniversitelerini getir
 */
function getIstanbulCSUniversities(tytRanking, city = null) {
    const allUnis = istanbulCSData.getAllUniversities();
    
    // Kullanıcı sıralamasına uygun olanlar (kullanıcı sırası >= taban sırası = girebilir)
    const eligible = allUnis.filter(uni => tytRanking >= uni.minRanking);
    
    // Yakın kaçanlar (±10% tolerans)
    const nearMiss = allUnis.filter(uni => {
        const gap = tytRanking - uni.minRanking;
        return gap > 0 && gap <= uni.minRanking * 0.1;
    });

    // Şehir filtresi uygula
    let filteredEligible = eligible;
    
    // Sadece İstanbul verisi var, bu yüzden:
    // - Şehir boş ise veya İstanbul içeriyorsa -> Göster
    // - Başka şehir istiyorsa -> Gösterme
    if (city && city.trim() !== '') {
        const cityLower = city.toLowerCase().trim();
        const istanbulKeywords = ['istanbul', 'İstanbul', 'ıstanbul', 'ISTANBUL'];
        const hasIstanbul = istanbulKeywords.some(keyword => 
            cityLower.includes(keyword.toLowerCase())
        );
        
        if (!hasIstanbul) {
            // Kullanıcı İstanbul dışı şehir istedi, bizim sadece İstanbul verimiz var
            filteredEligible = [];
        }
    }

    return {
        eligible: filteredEligible.map(uni => ({
            name: uni.name,
            type: uni.type,
            campus: uni.campus,
            minRanking: uni.minRanking,
            quota: uni.quota,
            enrolled: uni.enrolled,
            scholarship: uni.scholarship,
            program: uni.program,
            rankingDiff: uni.minRanking - tytRanking,
            safetyLevel: calculateSafetyLevel(tytRanking, uni.minRanking)
        })).sort((a, b) => a.minRanking - b.minRanking),
        
        nearMiss: nearMiss.map(uni => ({
            name: uni.name,
            type: uni.type,
            minRanking: uni.minRanking,
            gap: tytRanking - uni.minRanking
        })),
        
        stats: filteredEligible.length > 0 ? {
            totalEligible: filteredEligible.length,
            devletCount: filteredEligible.filter(u => u.type === 'Devlet').length,
            vakifCount: filteredEligible.filter(u => u.type === 'Vakıf').length,
            averageRanking: Math.round(
                filteredEligible.reduce((sum, u) => sum + u.minRanking, 0) / filteredEligible.length
            ),
            bestRanking: Math.min(...filteredEligible.map(u => u.minRanking)),
            worstRanking: Math.max(...filteredEligible.map(u => u.minRanking))
        } : {
            totalEligible: 0,
            devletCount: 0,
            vakifCount: 0,
            averageRanking: 0,
            bestRanking: 0,
            worstRanking: 0
        }
    };
}

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 4 YILLIK ALTERNATİFLER (AYT Bazlı):
${alternatives.fourYearOptions.slice(0, 3).map((opt, i) => `
${i + 1}. ${opt.name}
   • Benzerlik: %${opt.similarity}
   • Durum: ${opt.eligible ? '✅ YETERLİ' : '❌ YETMİYOR'}
   • Sıralama Farkı: ${opt.rankingGap.toLocaleString()}
   • Güven: ${opt.confidence.label}
   • Açıklama: ${opt.description}
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
   ${opt.universities ? `
   • Uygun Üniversite Sayısı: ${opt.stats.totalEligible} (${opt.stats.devletCount} Devlet, ${opt.stats.vakifCount} Vakıf)
   • En İyi Taban: ${opt.stats.bestRanking?.toLocaleString()}
   
   İlk 5 Seçenek:
   ${opt.universities.slice(0, 5).map((u, idx) => 
     `   ${idx + 1}) ${u.name} (${u.type}) - Taban: ${u.minRanking.toLocaleString()} - ${u.safetyLevel.label}`
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
    findSmartAlternatives,
    getIstanbulCSUniversities,
    generateStrategy,
    formatForAI,
    DEPARTMENT_ALTERNATIVES
};
