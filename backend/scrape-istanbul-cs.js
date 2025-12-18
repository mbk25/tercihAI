// İstanbul Bilgisayar Programcılığı Verisi Çekme
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// YÖK Atlas bölüm kodu - Bilgisayar Programcılığı (Önlisans - 2 yıllık)
const DEPARTMENT_CODE = '104810158'; // Bilgisayar Programcılığı
const YOK_ATLAS_BASE_URL = 'https://yokatlas.yok.gov.tr';
const YEAR = 2024;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * YÖK Atlas'tan Bilgisayar Programcılığı verilerini çek
 */
async function scrapeIstanbulCS() {
    console.log('🔍 İstanbul - Bilgisayar Programcılığı verileri çekiliyor...\n');
    
    try {
        // Önlisans (2 yıllık) programlar için URL farklı
        const url = `${YOK_ATLAS_BASE_URL}/onlisans-univ.php?y=${YEAR}&k=${DEPARTMENT_CODE}`;
        
        console.log(`📡 URL: ${url}\n`);
        console.log('⏳ İstek gönderiliyor...\n');
        
        // Retry mekanizması
        let response;
        let lastError;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`🔄 Deneme ${attempt}/3...`);
                
                response = await axios.get(url, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'tr-TR,tr;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Referer': 'https://yokatlas.yok.gov.tr/',
                    },
                    httpsAgent: new https.Agent({  
                        rejectUnauthorized: false
                    }),
                    maxRedirects: 5
                });
                
                console.log(`✅ İstek başarılı (Status: ${response.status})\n`);
                break;
                
            } catch (err) {
                lastError = err;
                console.log(`❌ Hata: ${err.message}`);
                
                if (attempt < 3) {
                    const waitTime = attempt * 3000;
                    console.log(`⏳ ${waitTime/1000} saniye bekleniyor...\n`);
                    await sleep(waitTime);
                }
            }
        }
        
        if (!response) {
            throw lastError || new Error('Tüm denemeler başarısız');
        }

        // HTML parse et
        const $ = cheerio.load(response.data);
        const allUniversities = [];
        const istanbulUniversities = [];

        console.log('📊 Veri analiz ediliyor...\n');
        console.log('='.repeat(100) + '\n');

        // Tablo satırlarını parse et
        $('table tbody tr').each((index, element) => {
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length >= 6) {
                const universityName = $(cells[1]).text().trim();
                const cityName = $(cells[2]).text().trim();
                const programName = $(cells[3]).text().trim();
                const quota = parseInt($(cells[4]).text().trim()) || 0;
                const enrolledCount = parseInt($(cells[5]).text().trim()) || 0;
                const minRankingText = $(cells[6]).text().trim().replace(/\./g, '');
                const minRanking = parseInt(minRankingText) || 0;

                if (universityName && minRanking > 0) {
                    const university = {
                        name: universityName,
                        city: cityName,
                        program: programName,
                        department: 'Bilgisayar Programcılığı',
                        quota: quota,
                        enrolled: enrolledCount,
                        minRanking: minRanking,
                        type: universityName.toLowerCase().includes('vakıf') || 
                              universityName.toLowerCase().includes('vakif') ? 'Vakıf' : 'Devlet',
                        year: YEAR
                    };
                    
                    allUniversities.push(university);
                    
                    // Sadece İstanbul'dakileri filtrele
                    if (cityName.toLowerCase().includes('istanbul') || 
                        cityName.toLowerCase().includes('İstanbul')) {
                        istanbulUniversities.push(university);
                    }
                }
            }
        });

        // Sonuçları göster
        console.log(`📍 TOPLAM ÜNIVERSITE: ${allUniversities.length}`);
        console.log(`📍 İSTANBUL ÜNİVERSİTELERİ: ${istanbulUniversities.length}\n`);
        console.log('='.repeat(100) + '\n');

        if (istanbulUniversities.length === 0) {
            console.log('⚠️ İstanbul\'da Bilgisayar Programcılığı bulunamadı!\n');
            console.log('🔍 Tüm şehirlerdeki üniversiteler gösteriliyor:\n');
            
            allUniversities.forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name}`);
                console.log(`   📍 Şehir: ${uni.city}`);
                console.log(`   📚 Program: ${uni.program}`);
                console.log(`   🎓 Tür: ${uni.type}`);
                console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
                console.log('   ' + '-'.repeat(90));
            });
        } else {
            // İstanbul üniversitelerini göster
            console.log('🎓 İSTANBUL - BİLGİSAYAR PROGRAMCILIĞI ÜNİVERSİTELERİ\n');
            
            // Devlet ve Vakıf olarak ayır
            const devletUnis = istanbulUniversities.filter(u => u.type === 'Devlet');
            const vakifUnis = istanbulUniversities.filter(u => u.type === 'Vakıf');
            
            console.log(`🏛️  DEVLET ÜNİVERSİTELERİ (${devletUnis.length})\n`);
            devletUnis.forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name}`);
                console.log(`   📚 Program: ${uni.program}`);
                console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
                console.log('   ' + '-'.repeat(90));
            });
            
            console.log(`\n🏢 VAKIF ÜNİVERSİTELERİ (${vakifUnis.length})\n`);
            vakifUnis.forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name}`);
                console.log(`   📚 Program: ${uni.program}`);
                console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
                console.log('   ' + '-'.repeat(90));
            });

            // JSON formatında da kaydet
            console.log('\n\n📄 JSON FORMAT:\n');
            console.log(JSON.stringify(istanbulUniversities, null, 2));
        }

        return istanbulUniversities;

    } catch (error) {
        console.error('\n❌ HATA:', error.message);
        console.error('\n🔍 Hata detayları:', error);
        return [];
    }
}

// Çalıştır
scrapeIstanbulCS().then(data => {
    console.log('\n\n✅ İşlem tamamlandı!');
    console.log(`📊 Toplam ${data.length} üniversite verisi çekildi.`);
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Fatal hata:', err);
    process.exit(1);
});
