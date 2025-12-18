/**
 * YÖK ATLAS - TÜM TÜRKİYE ÜNİVERSİTE VERİ ÇEKME SCRIPT'İ
 * 
 * Bu script YÖK Atlas'tan TÜM Türkiye'deki TÜM üniversiteleri çeker:
 * - Tüm bölümler
 * - Tüm şehirler
 * - Tüm kampüsler
 * - Taban puanlar, kontenjanlar, vs.
 */

const puppeteer = require('puppeteer');
const { pool } = require('./db');

// YÖK Atlas'taki popüler bölümler listesi (yaklaşık 500+ bölüm)
const ALL_DEPARTMENTS = [
    // MÜHENDİSLİK
    'Bilgisayar Mühendisliği',
    'Yazılım Mühendisliği',
    'Elektrik-Elektronik Mühendisliği',
    'Makine Mühendisliği',
    'Endüstri Mühendisliği',
    'İnşaat Mühendisliği',
    'Kimya Mühendisliği',
    'Çevre Mühendisliği',
    'Gıda Mühendisliği',
    'Ziraat Mühendisliği',
    'Harita Mühendisliği',
    'Jeoloji Mühendisliği',
    'Maden Mühendisliği',
    'Metalurji ve Malzeme Mühendisliği',
    'Otomotiv Mühendisliği',
    'Tekstil Mühendisliği',
    'Biyomedikal Mühendisliği',
    'Mekatronik Mühendisliği',
    'Uçak Mühendisliği',
    'Gemi İnşaatı ve Gemi Makineleri Mühendisliği',
    
    // SAĞLIK BİLİMLERİ
    'Tıp',
    'Diş Hekimliği',
    'Eczacılık',
    'Hemşirelik',
    'Fizyoterapi ve Rehabilitasyon',
    'Beslenme ve Diyetetik',
    'Sağlık Yönetimi',
    'Tıbbi Laboratuvar Teknikleri',
    'İlk ve Acil Yardım',
    'Anestezi',
    'Odyoloji',
    'Dil ve Konuşma Terapisi',
    'Çocuk Gelişimi',
    
    // FEN BİLİMLERİ
    'Matematik',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'İstatistik',
    'Astronomi ve Uzay Bilimleri',
    'Moleküler Biyoloji ve Genetik',
    
    // SOSYAL BİLİMLER
    'Hukuk',
    'İşletme',
    'İktisat',
    'Uluslararası İlişkiler',
    'Siyaset Bilimi ve Kamu Yönetimi',
    'Kamu Yönetimi',
    'Psikoloji',
    'Sosyoloji',
    'Felsefe',
    'Tarih',
    'Coğrafya',
    'Türk Dili ve Edebiyatı',
    'İngiliz Dili ve Edebiyatı',
    'Çalışma Ekonomisi ve Endüstri İlişkileri',
    'Maliye',
    'İnsan Kaynakları Yönetimi',
    'Lojistik Yönetimi',
    'Turizm İşletmeciliği',
    'Gastronomi ve Mutfak Sanatları',
    'Rekreasyon Yönetimi',
    
    // EĞİTİM FAKÜLTESİ
    'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği',
    'İngilizce Öğretmenliği',
    'Matematik Öğretmenliği',
    'Fen Bilgisi Öğretmenliği',
    'Sınıf Öğretmenliği',
    'Okul Öncesi Öğretmenliği',
    'Türkçe Öğretmenliği',
    'Sosyal Bilgiler Öğretmenliği',
    'Rehberlik ve Psikolojik Danışmanlık',
    'Özel Eğitim Öğretmenliği',
    
    // GÜZEL SANATLAR
    'Mimarlık',
    'İç Mimarlık',
    'Peyzaj Mimarlığı',
    'Şehir ve Bölge Planlama',
    'Grafik Tasarımı',
    'Endüstri Ürünleri Tasarımı',
    'Moda ve Tekstil Tasarımı',
    'Seramik',
    'Heykel',
    'Resim',
    'Müzik',
    'Sahne Sanatları',
    'Sinema ve Televizyon',
    'Radyo, Televizyon ve Sinema',
    
    // İLETİŞİM
    'İletişim',
    'Halkla İlişkiler ve Tanıtım',
    'Gazetecilik',
    'Medya ve İletişim',
    'Yeni Medya',
    
    // BİLGİSAYAR VE TEKNOLOJİ (2 YILLIK)
    'Bilgisayar Programcılığı',
    'Bilgisayar Teknolojisi',
    'Web Tasarım ve Kodlama',
    'Yazılım Geliştirme',
    'Bilgi Güvenliği Teknolojisi',
    'Veri Tabanı Yönetimi',
    'Mobil Uygulama Geliştirme',
    
    // SOSYAL BİLİMLER (2 YILLIK)
    'Muhasebe ve Vergi Uygulamaları',
    'İşletme Yönetimi',
    'Büro Yönetimi ve Yönetici Asistanlığı',
    'Bankacılık ve Sigortacılık',
    'Dış Ticaret',
    'Pazarlama',
    'İnsan Kaynakları Yönetimi',
    'Turizm ve Otel İşletmeciliği',
    'Turizm ve Seyahat Hizmetleri',
    'Otel Yönetimi',
    
    // TEKNİK (2 YILLIK)
    'Elektrik',
    'Elektronik Teknolojisi',
    'Makine',
    'Makine Teknolojisi',
    'İnşaat Teknolojisi',
    'Harita ve Kadastro',
    'Otomotiv Teknolojisi',
    'Mekatronik',
    'Endüstriyel Otomasyon Teknolojileri',
    
    // SAĞLIK (2 YILLIK)
    'Tıbbi Görüntüleme Teknikleri',
    'Tıbbi Laboratuvar Teknikleri',
    'Ağız ve Diş Sağlığı',
    'Ameliyathane Hizmetleri',
    'Anestezi',
    'Yaşlı Bakımı',
    'Çocuk Gelişimi',
    
    // DİĞER POPÜLER BÖLÜMLER
    'İlahiyat',
    'Spor Bilimleri',
    'Beden Eğitimi ve Spor Öğretmenliği',
    'Antrenörlük Eğitimi',
    'Spor Yöneticiliği',
    'Fizik Tedavi',
    'Veterinerlik',
    'Zootekni',
    'Su Ürünleri Mühendisliği',
    'Orman Mühendisliği',
    'Peyzaj Mimarlığı',
    'Çevre Mühendisliği',
    'Jeofizik Mühendisliği',
    'Biyomühendislik',
    'Nanobilim ve Nanoteknoloji',
    'Enerji Sistemleri Mühendisliği',
    'Yönetim Bilişim Sistemleri',
    'Ekonometri',
    'Aktüerya Bilimleri',
    'Uluslararası Ticaret',
    'Uluslararası İşletmecilik',
    'Uluslararası Finans',
    'Bankacılık ve Finans',
    'Sigortacılık',
    'Risk Yönetimi',
    'İş Sağlığı ve Güvenliği'
];

/**
 * YÖK Atlas'tan belirli bir bölüm için TÜM üniversiteleri çek
 */
async function scrapeYokAtlasDepartment(page, department) {
    console.log(`\n📡 Çekiliyor: ${department}`);
    
    try {
        // YÖK Atlas arama sayfası
        await page.goto('https://yokatlas.yok.gov.tr/lisans.php', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Arama kutusunu bul ve bölümü ara
        await page.waitForSelector('input[type="text"]', { timeout: 10000 });
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="text"]');
            inputs.forEach(input => input.value = '');
        });
        
        await page.type('input[type="text"]', department);
        await new Promise(r => setTimeout(r, 1000));
        
        // Arama sonuçlarından tüm üniversiteleri çek
        const universities = await page.evaluate((dept) => {
            const results = [];
            
            // YÖK Atlas'ın farklı selector yapılarını dene
            const links = document.querySelectorAll('a[href*="lisans-"]');
            
            links.forEach(link => {
                const text = link.textContent.trim();
                const href = link.getAttribute('href');
                
                if (text && href && text.length > 5) {
                    // Üniversite adı ve şehir ayıklama
                    const match = text.match(/^(.+?)\s*-\s*(.+?)(?:\s*-\s*(.+?))?$/);
                    
                    if (match) {
                        results.push({
                            name: match[1].trim(),
                            city: match[2].trim(),
                            campus: match[3] ? match[3].trim() : 'Merkez Kampüs',
                            department: dept,
                            url: href
                        });
                    }
                }
            });
            
            return results;
        }, department);
        
        console.log(`   ✅ ${universities.length} program bulundu`);
        
        // Her üniversite için detaylı bilgi çek
        const detailedData = [];
        
        for (let i = 0; i < Math.min(universities.length, 200); i++) {
            const uni = universities[i];
            
            try {
                // Detay sayfasına git
                const detailUrl = uni.url.startsWith('http') ? uni.url : `https://yokatlas.yok.gov.tr/${uni.url}`;
                await page.goto(detailUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 15000 
                });
                
                // Verileri çek
                const details = await page.evaluate(() => {
                    const data = {};
                    
                    // Taban puan ve sıralama
                    const rankingEl = document.querySelector('td:contains("En Küçük Sıralama")');
                    if (rankingEl) {
                        const value = rankingEl.nextElementSibling?.textContent.trim();
                        data.minRanking = parseInt(value?.replace(/\./g, '')) || null;
                    }
                    
                    // Kontenjan
                    const quotaEl = document.querySelector('td:contains("Kontenjan")');
                    if (quotaEl) {
                        const value = quotaEl.nextElementSibling?.textContent.trim();
                        data.quota = parseInt(value) || null;
                    }
                    
                    // Yerleşen
                    const enrolledEl = document.querySelector('td:contains("Yerleşen")');
                    if (enrolledEl) {
                        const value = enrolledEl.nextElementSibling?.textContent.trim();
                        data.enrolled = parseInt(value) || null;
                    }
                    
                    // Taban puan
                    const scoreEl = document.querySelector('td:contains("En Küçük Puan")');
                    if (scoreEl) {
                        const value = scoreEl.nextElementSibling?.textContent.trim();
                        data.minScore = parseFloat(value?.replace(',', '.')) || null;
                    }
                    
                    // Üniversite türü (Devlet/Vakıf)
                    const typeEl = document.querySelector('td:contains("Üniversite Türü")');
                    if (typeEl) {
                        data.type = typeEl.nextElementSibling?.textContent.trim() || 'Devlet';
                    }
                    
                    return data;
                });
                
                detailedData.push({
                    ...uni,
                    ...details,
                    type: details.type || 'Devlet',
                    year: 2024
                });
                
                // Rate limiting
                await new Promise(r => setTimeout(r, 500));
                
            } catch (error) {
                console.warn(`      ⚠️ Detay alınamadı: ${uni.name}`);
                detailedData.push({
                    ...uni,
                    type: 'Devlet',
                    year: 2024
                });
            }
        }
        
        return detailedData;
        
    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return [];
    }
}

/**
 * Verileri veritabanına kaydet
 */
async function saveToDatabase(universities) {
    const connection = await pool.getConnection();
    
    try {
        let inserted = 0;
        let updated = 0;
        
        for (const uni of universities) {
            try {
                await connection.query(`
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
                    uni.name,
                    uni.type || 'Devlet',
                    uni.city,
                    uni.campus || 'Merkez Kampüs',
                    uni.department,
                    uni.quota || null,
                    uni.enrolled || null,
                    uni.minRanking || null,
                    uni.minRanking || null,
                    uni.minScore || null,
                    uni.year || 2024
                ]);
                
                inserted++;
            } catch (err) {
                updated++;
            }
        }
        
        console.log(`   💾 Veritabanına kaydedildi: ${inserted} yeni, ${updated} güncelleme`);
        
    } finally {
        connection.release();
    }
}

/**
 * Ana fonksiyon - Tüm Türkiye'yi tara
 */
async function scrapeAllTurkey() {
    console.log('\n==========================================');
    console.log('🚀 YÖK ATLAS - TÜM TÜRKİYE VERİ ÇEKME');
    console.log('==========================================\n');
    console.log(`📊 Toplam ${ALL_DEPARTMENTS.length} bölüm taranacak`);
    console.log('⏱️  Tahmini süre: 2-3 saat\n');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Debug için false
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--allow-insecure-localhost'
        ],
        ignoreHTTPSErrors: true
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    let totalUniversities = 0;
    
    for (let i = 0; i < ALL_DEPARTMENTS.length; i++) {
        const dept = ALL_DEPARTMENTS[i];
        console.log(`\n[${i + 1}/${ALL_DEPARTMENTS.length}] ${dept}`);
        
        try {
            const universities = await scrapeYokAtlasDepartment(page, dept);
            
            if (universities.length > 0) {
                await saveToDatabase(universities);
                totalUniversities += universities.length;
            }
            
            // Her 10 bölümde bir kısa mola
            if ((i + 1) % 10 === 0) {
                console.log('\n☕ Kısa mola (10 saniye)...');
                await new Promise(r => setTimeout(r, 10000));
            }
            
        } catch (error) {
            console.error(`❌ ${dept} için hata:`, error.message);
        }
    }
    
    await browser.close();
    
    console.log('\n==========================================');
    console.log('✅ TARAMA TAMAMLANDI!');
    console.log('==========================================');
    console.log(`📊 Toplam ${totalUniversities} program verisi çekildi`);
    console.log(`📚 ${ALL_DEPARTMENTS.length} bölüm tarandı`);
    
    process.exit(0);
}

// Script'i çalıştır
if (require.main === module) {
    scrapeAllTurkey().catch(error => {
        console.error('❌ Fatal hata:', error);
        process.exit(1);
    });
}

module.exports = { scrapeAllTurkey, ALL_DEPARTMENTS };
