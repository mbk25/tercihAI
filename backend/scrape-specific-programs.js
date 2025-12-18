const puppeteer = require('puppeteer');
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

async function scrapeYokAtlasDetailed(departmentName) {
    console.log(`\n🔍 "${departmentName}" için detaylı scraping başlıyor...`);
    
    const browser = await puppeteer.launch({ 
        headless: false, // Debug için görünür
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // YÖK Atlas ana sayfa
        await page.goto('https://yokatlas.yok.gov.tr/', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        console.log('✅ Ana sayfa yüklendi');
        await page.screenshot({ path: 'yok-homepage.png' });
        
        // Arama kutusunu bul ve yaz
        await page.waitForSelector('input[type="text"], input.search, #search', { timeout: 10000 });
        
        const searchInput = await page.$('input[type="text"]');
        if (searchInput) {
            await searchInput.type(departmentName, { delay: 100 });
            console.log(`✅ "${departmentName}" yazıldı`);
            await new Promise(r => setTimeout(r, 2000));
            
            // Otomatik tamamlama önerilerini bekle
            await page.waitForSelector('.ui-menu-item, .autocomplete-item, li', { timeout: 5000 });
            
            // İlk öneriyi tıkla
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            console.log('✅ Arama yapıldı');
            
            await new Promise(r => setTimeout(r, 5000));
            await page.screenshot({ path: `yok-${departmentName.replace(/\s+/g, '-')}.png` });
            
            // Sonuç tablosunu bekle
            await page.waitForSelector('table, .table, .data-table', { timeout: 10000 });
            
            // Tüm programları çek
            const programs = await page.evaluate(() => {
                const results = [];
                
                // Tüm satırları tara
                const rows = document.querySelectorAll('tr');
                
                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td, th');
                    
                    if (cells.length >= 3) {
                        const text0 = cells[0]?.innerText?.trim() || '';
                        const text1 = cells[1]?.innerText?.trim() || '';
                        const text2 = cells[2]?.innerText?.trim() || '';
                        const text3 = cells[3]?.innerText?.trim() || '';
                        
                        // Üniversite adı genelde ilk sütunda
                        if (text0.length > 10 && !text0.includes('Sıra')) {
                            // Sıralamayı bul
                            let ranking = 0;
                            [text1, text2, text3].forEach(t => {
                                const num = parseInt(t.replace(/\D/g, ''));
                                if (num > 1000 && num < 10000000) {
                                    ranking = num;
                                }
                            });
                            
                            if (ranking > 0) {
                                results.push({
                                    university: text0,
                                    city: text1,
                                    ranking: ranking,
                                    quota: parseInt(text2?.replace(/\D/g, '')) || 0
                                });
                            }
                        }
                    }
                });
                
                return results;
            });
            
            console.log(`✅ ${programs.length} program bulundu`);
            
            if (programs.length > 0) {
                // Veritabanına kaydet
                const connection = await pool.getConnection();
                
                for (const prog of programs) {
                    try {
                        await connection.query(`
                            INSERT INTO universities 
                            (name, city, department, ranking, minRanking, quota, type, year, campus)
                            VALUES (?, ?, ?, ?, ?, ?, 'Devlet', 2024, 'Merkez')
                            ON DUPLICATE KEY UPDATE
                            ranking = VALUES(ranking),
                            minRanking = VALUES(minRanking),
                            quota = VALUES(quota)
                        `, [
                            prog.university,
                            prog.city || 'İstanbul',
                            departmentName,
                            prog.ranking,
                            prog.ranking,
                            prog.quota
                        ]);
                    } catch (err) {
                        console.log(`⚠️  Kayıt hatası: ${prog.university}`);
                    }
                }
                
                connection.release();
                console.log(`💾 ${programs.length} kayıt veritabanına eklendi`);
                
                // İlk 5'i göster
                console.log('\n📊 İlk 5 Program:');
                programs.slice(0, 5).forEach(p => {
                    console.log(`   ${p.university} - ${p.city} - ${p.ranking}`);
                });
            }
            
            return programs;
        }
        
    } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
        await page.screenshot({ path: 'yok-error.png' });
        return [];
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('🚀 YÖK ATLAS MANUEL SCRAPING\n');
    
    const programs = [
        'Bilgisayar Programcılığı',
        'Bilgisayar Teknolojisi',
        'Web Tasarım ve Kodlama'
    ];
    
    for (const program of programs) {
        await scrapeYokAtlasDetailed(program);
        await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('\n✅ SCRAPING TAMAMLANDI!');
    
    // Özet
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
        SELECT department, COUNT(*) as total 
        FROM universities 
        WHERE department IN (?, ?, ?)
        GROUP BY department
    `, programs);
    connection.release();
    
    console.log('\n📊 ÖZET:');
    rows.forEach(row => {
        console.log(`   ${row.department}: ${row.total} üniversite`);
    });
    
    await pool.end();
    process.exit(0);
}

main().catch(console.error);
