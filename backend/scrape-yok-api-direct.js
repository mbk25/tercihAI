const axios = require('axios');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12991453B',
    database: 'tercihai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * YÖK Atlas API'den bölüm kodlarını çek
 */
async function searchDepartment(departmentName) {
    console.log(`\n🔍 "${departmentName}" aranıyor...`);
    
    try {
        // YÖK Atlas arama API'si
        const response = await axios.get('https://yokatlas.yok.gov.tr/lisans-univ.php', {
            params: {
                b: departmentName
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 30000
        });
        
        const html = response.data;
        
        // Program kodlarını bul (lisans.php?y=XXXXX formatında)
        const programCodes = [];
        const regex = /lisans\.php\?y=(\d+)/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            programCodes.push(match[1]);
        }
        
        // Tekrarları kaldır
        const uniqueCodes = [...new Set(programCodes)];
        console.log(`   ✅ ${uniqueCodes.length} program kodu bulundu`);
        
        return uniqueCodes;
        
    } catch (error) {
        console.error(`   ❌ Arama hatası: ${error.message}`);
        return [];
    }
}

/**
 * Program detaylarını çek
 */
async function getProgramDetails(programCode) {
    try {
        const url = `https://yokatlas.yok.gov.tr/lisans.php?y=${programCode}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const html = response.data;
        
        // Basit regex ile bilgileri çıkar
        const details = {
            university: null,
            department: null,
            city: null,
            ranking: null,
            quota: null,
            type: 'Devlet'
        };
        
        // Üniversite adı
        const uniMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (uniMatch) {
            const fullTitle = uniMatch[1].replace(/<[^>]*>/g, '').trim();
            const parts = fullTitle.split('-').map(p => p.trim());
            
            if (parts.length >= 2) {
                details.university = parts[0];
                details.department = parts[1];
            }
            if (parts.length >= 3) {
                details.city = parts[2];
            }
        }
        
        // Taban puan sıralaması
        const rankingMatch = html.match(/Taban\s+Sıralama[:\s]*<[^>]*>([0-9.]+)/i) ||
                            html.match(/En\s+Küçük\s+Sıralama[:\s]*<[^>]*>([0-9.]+)/i);
        if (rankingMatch) {
            details.ranking = parseInt(rankingMatch[1].replace(/\./g, ''));
        }
        
        // Kontenjan
        const quotaMatch = html.match(/Kontenjan[:\s]*<[^>]*>(\d+)/i);
        if (quotaMatch) {
            details.quota = parseInt(quotaMatch[1]);
        }
        
        // Şehir
        if (!details.city) {
            const cityMatch = html.match(/Şehir[:\s]*<[^>]*>([^<]+)/i) ||
                             html.match(/İl[:\s]*<[^>]*>([^<]+)/i);
            if (cityMatch) {
                details.city = cityMatch[1].trim();
            }
        }
        
        // Vakıf mı devlet mi?
        if (html.includes('Vakıf') || html.includes('VAKIF')) {
            details.type = 'Vakıf';
        }
        
        return details;
        
    } catch (error) {
        return null;
    }
}

/**
 * Veritabanına kaydet
 */
async function saveToDatabase(details, departmentName) {
    if (!details || !details.university) {
        return false;
    }
    
    try {
        const connection = await pool.getConnection();
        
        await connection.query(`
            INSERT INTO universities 
            (name, city, campus, department, ranking, minRanking, quota, type, year)
            VALUES (?, ?, 'Merkez', ?, ?, ?, ?, ?, 2024)
            ON DUPLICATE KEY UPDATE
            ranking = VALUES(ranking),
            minRanking = VALUES(minRanking),
            quota = VALUES(quota),
            updatedAt = CURRENT_TIMESTAMP
        `, [
            details.university,
            details.city || 'İstanbul',
            departmentName,
            details.ranking || 999999,
            details.ranking || 999999,
            details.quota || 0,
            details.type
        ]);
        
        connection.release();
        return true;
        
    } catch (error) {
        console.error(`   ⚠️  Kayıt hatası: ${error.message}`);
        return false;
    }
}

/**
 * Ana fonksiyon
 */
async function scrapeProgram(departmentName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 ${departmentName}`);
    console.log('='.repeat(60));
    
    // 1. Program kodlarını bul
    const codes = await searchDepartment(departmentName);
    
    if (codes.length === 0) {
        console.log('   ⚠️  Hiç program bulunamadı');
        return 0;
    }
    
    console.log(`\n📥 ${codes.length} program detayı çekiliyor...`);
    
    // 2. Her program için detay çek
    let savedCount = 0;
    const istanbulPrograms = [];
    
    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        
        process.stdout.write(`\r   İşleniyor: ${i + 1}/${codes.length} (${savedCount} İstanbul)`);
        
        try {
            const details = await getProgramDetails(code);
            
            if (details && details.university) {
                // İstanbul filtresi
                if (details.city && details.city.toLowerCase().includes('istanbul')) {
                    istanbulPrograms.push(details);
                    const saved = await saveToDatabase(details, departmentName);
                    if (saved) savedCount++;
                }
            }
            
            // Rate limiting
            await new Promise(r => setTimeout(r, 300));
            
        } catch (error) {
            // Sessizce devam et
        }
    }
    
    console.log(`\n\n✅ ${savedCount} İstanbul programı kaydedildi`);
    
    // İlk 10'u göster
    if (istanbulPrograms.length > 0) {
        console.log('\n📊 İstanbul\'daki İlk 10 Program:');
        istanbulPrograms.slice(0, 10).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.university} - ${p.type} - Sıralama: ${p.ranking || 'N/A'}`);
        });
    }
    
    return savedCount;
}

/**
 * Ana çalıştırıcı
 */
async function main() {
    console.log('\n🚀 YÖK ATLAS VERİ ÇEKME BAŞLADI');
    console.log('⏱️  Tahm ini süre: 15-20 dakika\n');
    
    const programs = [
        'Bilgisayar Programcılığı',
        'Bilgisayar Teknolojisi',
        'Web Tasarım ve Kodlama'
    ];
    
    const results = {};
    
    for (const program of programs) {
        const count = await scrapeProgram(program);
        results[program] = count;
        
        // Bölümler arası mola
        await new Promise(r => setTimeout(r, 2000));
    }
    
    // Özet
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ SCRAPING TAMAMLANDI!');
    console.log('='.repeat(60));
    console.log('\n📊 ÖZET:');
    
    let total = 0;
    for (const [program, count] of Object.entries(results)) {
        console.log(`   ${program}: ${count} üniversite`);
        total += count;
    }
    console.log(`\n   TOPLAM: ${total} üniversite`);
    
    // Veritabanı kontrolü
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
        SELECT department, COUNT(*) as total, COUNT(DISTINCT name) as unis
        FROM universities 
        WHERE department IN (?, ?, ?) AND city LIKE '%İstanbul%'
        GROUP BY department
    `, programs);
    connection.release();
    
    console.log('\n💾 VERİTABANI KONTROLÜ:');
    rows.forEach(row => {
        console.log(`   ${row.department}: ${row.total} kayıt (${row.unis} farklı üniversite)`);
    });
    
    await pool.end();
    console.log('\n✅ İşlem tamamlandı!\n');
    process.exit(0);
}

// Çalıştır
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Fatal hata:', error);
        process.exit(1);
    });
}

module.exports = { scrapeProgram };
