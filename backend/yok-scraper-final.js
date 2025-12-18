/**
 * YÖK ATLAS FINAL SCRAPER
 * 
 * Axios + Cheerio ile YÖK Atlas'tan tüm üniversiteleri çeker
 * Puppeteer'dan daha hızlı ve hafif
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { pool } = require('./db');

// SSL sertifika doğrulamasını kapat (YÖK Atlas sertifika sorunu için)
const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

// Çekilecek tüm bölümler
const ALL_DEPARTMENTS = [
    // MÜHENDİSLİK (4 yıllık)
    'Bilgisayar Mühendisliği',
    'Yazılım Mühendisliği',
    'Elektrik-Elektronik Mühendisliği',
    'Makine Mühendisliği',
    'Endüstri Mühendisliği',
    'İnşaat Mühendisliği',
    'Kimya Mühendisliği',
    'Çevre Mühendisliği',
    'Gıda Mühendisliği',
    'Mekatronik Mühendisliği',
    'Biyomedikal Mühendisliği',
    'Otomotiv Mühendisliği',
    'Harita Mühendisliği',
    'Jeoloji Mühendisliği',
    'Maden Mühendisliği',
    'Metalurji ve Malzeme Mühendisliği',
    
    // SAĞLIK (4 yıllık)
    'Tıp',
    'Diş Hekimliği',
    'Eczacılık',
    'Hemşirelik',
    'Fizyoterapi ve Rehabilitasyon',
    'Beslenme ve Diyetetik',
    'Sağlık Yönetimi',
    
    // SOSYAL (4 yıllık)
    'Hukuk',
    'İşletme',
    'İktisat',
    'Uluslararası İlişkiler',
    'Siyaset Bilimi ve Kamu Yönetimi',
    'Psikoloji',
    'Sosyoloji',
    'Maliye',
    'İnsan Kaynakları Yönetimi',
    'Lojistik Yönetimi',
    'Bankacılık ve Finans',
    
    // EĞİTİM (4 yıllık)
    'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği',
    'İngilizce Öğretmenliği',
    'Matematik Öğretmenliği',
    'Fen Bilgisi Öğretmenliği',
    'Sınıf Öğretmenliği',
    'Okul Öncesi Öğretmenliği',
    'Rehberlik ve Psikolojik Danışmanlık',
    
    // GÜZEL SANATLAR (4 yıllık)
    'Mimarlık',
    'İç Mimarlık',
    'Şehir ve Bölge Planlama',
    'Grafik Tasarımı',
    'Endüstri Ürünleri Tasarımı',
    'Radyo, Televizyon ve Sinema',
    
    // İLETİŞİM (4 yıllık)
    'İletişim',
    'Halkla İlişkiler ve Tanıtım',
    'Gazetecilik',
    
    // BİLGİSAYAR (2 yıllık)
    'Bilgisayar Programcılığı',
    'Bilgisayar Teknolojisi',
    'Web Tasarım ve Kodlama',
    
    // SOSYAL (2 yıllık)
    'Muhasebe ve Vergi Uygulamaları',
    'İşletme Yönetimi',
    'Büro Yönetimi ve Yönetici Asistanlığı',
    'Dış Ticaret',
    'Turizm ve Otel İşletmeciliği',
    'Pazarlama',
    
    // SAĞLIK (2 yıllık)
    'Tıbbi Laboratuvar Teknikleri',
    'Tıbbi Görüntüleme Teknikleri',
    'Anestezi',
    'İlk ve Acil Yardım',
    
    // DİĞER
    'İlahiyat',
    'Spor Bilimleri',
    'Yönetim Bilişim Sistemleri',
    'Matematik',
    'Fizik',
    'Kimya',
    'Biyoloji'
];

/**
 * YÖK Atlas lisans arama API'si
 */
async function searchPrograms(department) {
    console.log(`\n🔍 ${department}`);
    
    try {
        const url = `https://yokatlas.yok.gov.tr/lisans-ajax.php?q=${encodeURIComponent(department)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            },
            httpsAgent,
            timeout: 30000
        });
        
        let programs = [];
        
        // JSON response varsa
        if (typeof response.data === 'object' && Array.isArray(response.data)) {
            programs = response.data;
        } else if (typeof response.data === 'string') {
            // HTML response ise parse et
            const $ = cheerio.load(response.data);
            
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                
                if (href && href.includes('lisans-') && text.length > 5) {
                    const match = href.match(/y=(\d+)/);
                    if (match) {
                        programs.push({
                            id: match[1],
                            label: text,
                            value: href
                        });
                    }
                }
            });
        }
        
        console.log(`   ✅ ${programs.length} program`);
        return programs;
        
    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return [];
    }
}

/**
 * Program detayını çek
 */
async function getProgramDetails(programId) {
    try {
        const url = `https://yokatlas.yok.gov.tr/lisans-4.html?y=${programId}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            httpsAgent,
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Temel bilgiler
        const details = {
            university: null,
            department: null,
            city: null,
            campus: null,
            type: 'Devlet',
            quota: null,
            enrolled: null,
            minRanking: null,
            minScore: null
        };
        
        // Başlık parse et
        const h1 = $('h1').first().text().trim();
        const parts = h1.split(/\s+-\s+/);
        if (parts.length >= 2) {
            details.university = parts[0].trim();
            details.department = parts[1].trim();
            if (parts.length >= 3) {
                details.city = parts[2].trim();
            }
        }
        
        // Tablo verilerini çek
        $('table td').each((i, elem) => {
            const text = $(elem).text().trim().toLowerCase();
            const nextValue = $(elem).next('td').text().trim();
            
            if (text.includes('şehir') || text.includes('il:')) {
                details.city = nextValue;
            } else if (text.includes('kontenjan')) {
                details.quota = parseInt(nextValue) || null;
            } else if (text.includes('yerleşen')) {
                details.enrolled = parseInt(nextValue) || null;
            } else if (text.includes('en küçük sıralama') || text.includes('tavan sıralama')) {
                details.minRanking = parseInt(nextValue.replace(/\./g, '')) || null;
            } else if (text.includes('en küçük puan') || text.includes('taban puan')) {
                details.minScore = parseFloat(nextValue.replace(',', '.')) || null;
            } else if (text.includes('üniversite türü')) {
                if (nextValue.toLowerCase().includes('vakıf')) {
                    details.type = 'Vakıf';
                }
            }
        });
        
        return details;
        
    } catch (error) {
        return null;
    }
}

/**
 * Veritabanına kaydet
 */
async function saveProgram(details) {
    if (!details || !details.university || !details.department) {
        return false;
    }
    
    try {
        await pool.query(`
            INSERT INTO universities 
            (name, type, city, campus, department, quota, enrolled, ranking, minRanking, minScore, year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quota = VALUES(quota),
            enrolled = VALUES(enrolled),
            ranking = VALUES(ranking),
            minRanking = VALUES(minRanking),
            minScore = VALUES(minScore),
            updatedAt = CURRENT_TIMESTAMP
        `, [
            details.university,
            details.type,
            details.city || 'Bilinmiyor',
            details.campus || 'Merkez Kampüs',
            details.department,
            details.quota,
            details.enrolled,
            details.minRanking,
            details.minRanking,
            details.minScore,
            2024
        ]);
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Ana scraping fonksiyonu
 */
async function scrapeAllYokAtlas() {
    console.log('\n==========================================');
    console.log('🚀 YÖK ATLAS - TÜM TÜRKİYE SCRAPING');
    console.log('==========================================');
    console.log(`📚 ${ALL_DEPARTMENTS.length} bölüm taranacak`);
    console.log('⏱️  Tahmini süre: 1-2 saat\n');
    console.log('💡 İptal etmek için Ctrl+C\n');
    
    const startTime = Date.now();
    let totalPrograms = 0;
    let totalSaved = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < ALL_DEPARTMENTS.length; i++) {
        const dept = ALL_DEPARTMENTS[i];
        const progress = ((i + 1) / ALL_DEPARTMENTS.length * 100).toFixed(1);
        
        console.log(`\n[${ i + 1}/${ALL_DEPARTMENTS.length}] (${progress}%) ${dept}`);
        
        try {
            // 1. Programları ara
            const programs = await searchPrograms(dept);
            totalPrograms += programs.length;
            
            if (programs.length === 0) {
                console.log('   ⚠️  Program bulunamadı');
                continue;
            }
            
            // 2. Her program için detay çek
            let savedCount = 0;
            
            for (let j = 0; j < Math.min(programs.length, 100); j++) {
                const prog = programs[j];
                
                try {
                    const details = await getProgramDetails(prog.id || prog.value);
                    
                    if (details && details.university) {
                        const saved = await saveProgram(details);
                        if (saved) {
                            savedCount++;
                            totalSaved++;
                            
                            if (savedCount % 10 === 0) {
                                console.log(`      💾 ${savedCount}/${programs.length} kaydedildi...`);
                            }
                        }
                    }
                    
                    // Rate limiting
                    await new Promise(r => setTimeout(r, 500));
                    
                } catch (err) {
                    totalErrors++;
                }
            }
            
            console.log(`   ✅ ${savedCount} program kaydedildi`);
            
            // Bölüm arası mola
            await new Promise(r => setTimeout(r, 2000));
            
        } catch (error) {
            console.error(`   ❌ Hata: ${error.message}`);
            totalErrors++;
        }
        
        // İlerleme özeti (her 10 bölümde bir)
        if ((i + 1) % 10 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const remaining = (elapsed / (i + 1) * (ALL_DEPARTMENTS.length - i - 1)).toFixed(1);
            console.log(`\n📊 Ara Özet:`);
            console.log(`   Geçen süre: ${elapsed} dakika`);
            console.log(`   Kalan süre: ~${remaining} dakika`);
            console.log(`   Toplam program: ${totalPrograms}`);
            console.log(`   Kaydedilen: ${totalSaved}`);
            console.log(`   Hata: ${totalErrors}\n`);
        }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n==========================================');
    console.log('✅ SCRAPING TAMAMLANDI!');
    console.log('==========================================');
    console.log(`⏱️  Toplam süre: ${totalTime} dakika`);
    console.log(`📊 Toplam program: ${totalPrograms}`);
    console.log(`💾 Kaydedilen: ${totalSaved}`);
    console.log(`❌ Hata: ${totalErrors}`);
    console.log(`📈 Başarı oranı: ${((totalSaved / totalPrograms) * 100).toFixed(1)}%\n`);
    
    // Veritabanı istatistikleri
    const [stats] = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT city) as cities,
            COUNT(DISTINCT department) as departments,
            COUNT(DISTINCT name) as universities
        FROM universities
    `);
    
    console.log('📊 Veritabanı İstatistikleri:');
    console.log(`   Toplam program: ${stats[0].total}`);
    console.log(`   Üniversite: ${stats[0].universities}`);
    console.log(`   Bölüm: ${stats[0].departments}`);
    console.log(`   Şehir: ${stats[0].cities}\n`);
    
    await pool.end();
    process.exit(0);
}

// Çalıştır
if (require.main === module) {
    scrapeAllYokAtlas().catch(error => {
        console.error('\n❌ Fatal Hata:', error);
        process.exit(1);
    });
}

module.exports = { scrapeAllYokAtlas, searchPrograms, getProgramDetails };
