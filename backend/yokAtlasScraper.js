let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.warn('⚠️ Puppeteer yüklenemedi - Sadece mock data kullanılacak');
}

const axios = require('axios');
const cheerio = require('cheerio');

// Gerçek YÖK Atlas Scraper
async function scrapeYokAtlasReal(department, year = 2024) {
    console.log(`📡 YÖK Atlas'tan veri çekiliyor: ${department} - ${year}`);
    
    if (!puppeteer) {
        console.warn('⚠️ Puppeteer kullanılamıyor - Mock data döndürülüyor');
        return generateMockData(department, year);
    }
    
    try {
        // Puppeteer ile tarayıcı başlat
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // YÖK Atlas arama sayfasına git
        await page.goto('https://yokatlas.yok.gov.tr/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Bölüm ara
        await page.waitForSelector('#search-input', { timeout: 10000 });
        await page.type('#search-input', department);
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(2000);
        
        // Sonuçları çek
        const universities = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.university-item');
            
            items.forEach(item => {
                const name = item.querySelector('.university-name')?.textContent?.trim();
                const city = item.querySelector('.city')?.textContent?.trim();
                const ranking = item.querySelector('.ranking')?.textContent?.trim();
                const quota = item.querySelector('.quota')?.textContent?.trim();
                
                if (name) {
                    results.push({
                        name,
                        city: city || 'Bilinmiyor',
                        ranking: parseInt(ranking) || 0,
                        quota: parseInt(quota) || 0
                    });
                }
            });
            
            return results;
        });
        
        await browser.close();
        
        if (universities.length > 0) {
            console.log(`✅ ${universities.length} üniversite verisi çekildi`);
            return universities;
        } else {
            console.log('⚠️ Veri bulunamadı, mock data kullanılıyor');
            return generateMockData(department, year);
        }
        
    } catch (error) {
        console.error('❌ YÖK Atlas scraping hatası:', error.message);
        console.log('⚠️ Mock data kullanılıyor');
        return generateMockData(department, year);
    }
}

// Alternatif: Axios ile basit scraping
async function scrapeYokAtlasSimple(department, year = 2024) {
    try {
        // YÖK Atlas'ın basit API endpoint'i (varsa)
        const url = `https://yokatlas.yok.gov.tr/lisans-univ.php?y=${year}`;
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const universities = [];
        
        // HTML parse et
        $('table tr').each((i, elem) => {
            const name = $(elem).find('td:nth-child(1)').text().trim();
            const city = $(elem).find('td:nth-child(2)').text().trim();
            const ranking = $(elem).find('td:nth-child(3)').text().trim();
            const quota = $(elem).find('td:nth-child(4)').text().trim();
            
            if (name && name.toLowerCase().includes(department.toLowerCase())) {
                universities.push({
                    name,
                    city: city || 'Bilinmiyor',
                    ranking: parseInt(ranking.replace(/\D/g, '')) || 0,
                    quota: parseInt(quota.replace(/\D/g, '')) || 0,
                    department,
                    year
                });
            }
        });
        
        if (universities.length > 0) {
            console.log(`✅ ${universities.length} üniversite verisi çekildi (Simple)`);
            return universities;
        } else {
            return generateMockData(department, year);
        }
        
    } catch (error) {
        console.error('❌ Simple scraping hatası:', error.message);
        return generateMockData(department, year);
    }
}

// Mock data generator - GENİŞLETİLMİŞ VERSİYON
function generateMockData(department, year) {
    const universities = [
        // İSTANBUL - Devlet
        { name: "Boğaziçi Üniversitesi", city: "İstanbul", campus: "Bebek Kampüsü", type: "Devlet" },
        { name: "İstanbul Teknik Üniversitesi", city: "İstanbul", campus: "Maslak Kampüsü", type: "Devlet" },
        { name: "Yıldız Teknik Üniversitesi", city: "İstanbul", campus: "Davutpaşa Kampüsü", type: "Devlet" },
        { name: "İstanbul Üniversitesi", city: "İstanbul", campus: "Beyazıt Kampüsü", type: "Devlet" },
        { name: "İstanbul Üniversitesi-Cerrahpaşa", city: "İstanbul", campus: "Cerrahpaşa Kampüsü", type: "Devlet" },
        { name: "Marmara Üniversitesi", city: "İstanbul", campus: "Göztepe Kampüsü", type: "Devlet" },
        { name: "Marmara Üniversitesi", city: "İstanbul", campus: "Anadolu Hisarı Kampüsü", type: "Devlet" },
        { name: "İstanbul Medeniyet Üniversitesi", city: "İstanbul", campus: "Göztepe Kampüsü", type: "Devlet" },
        { name: "İstanbul Sabahattin Zaim Üniversitesi", city: "İstanbul", campus: "Halkalı Kampüsü", type: "Devlet" },
        { name: "Beykoz Üniversitesi", city: "İstanbul", campus: "Beykoz Kampüsü", type: "Devlet" },
        
        // İSTANBUL - Vakıf
        { name: "Koç Üniversitesi", city: "İstanbul", campus: "Rumeli Feneri Kampüsü", type: "Vakıf" },
        { name: "Sabancı Üniversitesi", city: "İstanbul", campus: "Tuzla Kampüsü", type: "Vakıf" },
        { name: "İstanbul Gelişim Üniversitesi", city: "İstanbul", campus: "Avcılar Kampüsü", type: "Vakıf" },
        { name: "İstanbul Medipol Üniversitesi", city: "İstanbul", campus: "Kavacık Kampüsü", type: "Vakıf" },
        { name: "Beykent Üniversitesi", city: "İstanbul", campus: "Büyükçekmece Kampüsü", type: "Vakıf" },
        { name: "İstanbul Aydın Üniversitesi", city: "İstanbul", campus: "Florya Kampüsü", type: "Vakıf" },
        { name: "Bahçeşehir Üniversitesi", city: "İstanbul", campus: "Beşiktaş Kampüsü", type: "Vakıf" },
        { name: "İstanbul Bilgi Üniversitesi", city: "İstanbul", campus: "Dolapdere Kampüsü", type: "Vakıf" },
        { name: "İstanbul Kültür Üniversitesi", city: "İstanbul", campus: "Ataköy Kampüsü", type: "Vakıf" },
        { name: "İstanbul Ticaret Üniversitesi", city: "İstanbul", campus: "Küçükyalı Kampüsü", type: "Vakıf" },
        { name: "İstanbul Okan Üniversitesi", city: "İstanbul", campus: "Akfirat Kampüsü", type: "Vakıf" },
        { name: "İstanbul Esenyurt Üniversitesi", city: "İstanbul", campus: "Esenyurt Kampüsü", type: "Vakıf" },
        { name: "İstanbul Rumeli Üniversitesi", city: "İstanbul", campus: "Silivri Kampüsü", type: "Vakıf" },
        { name: "İstanbul Topkapı Üniversitesi", city: "İstanbul", campus: "Topkapı Kampüsü", type: "Vakıf" },
        { name: "İstanbul Atlas Üniversitesi", city: "İstanbul", campus: "Kağıthane Kampüsü", type: "Vakıf" },
        { name: "İstanbul Beykent Üniversitesi", city: "İstanbul", campus: "Hadımköy Kampüsü", type: "Vakıf" },
        { name: "İstanbul Nişantaşı Üniversitesi", city: "İstanbul", campus: "Maslak Kampüsü", type: "Vakıf" },
        { name: "İstanbul Yenı Yüzyıl Üniversitesi", city: "İstanbul", campus: "Topkapı Kampüsü", type: "Vakıf" },
        { name: "Fenerbahçe Üniversitesi", city: "İstanbul", campus: "Ataşehir Kampüsü", type: "Vakıf" },
        { name: "İstinye Üniversitesi", city: "İstanbul", campus: "Zekeriyaköy Kampüsü", type: "Vakıf" },
        { name: "İstanbul Kent Üniversitesi", city: "İstanbul", campus: "Şişli Kampüsü", type: "Vakıf" },
        { name: "İstanbul Gedik Üniversitesi", city: "İstanbul", campus: "Pendik Kampüsü", type: "Vakıf" },
        { name: "İstanbul Arel Üniversitesi", city: "İstanbul", campus: "Tepekent Kampüsü", type: "Vakıf" },
        { name: "İstanbul Galata Üniversitesi", city: "İstanbul", campus: "Beyoğlu Kampüsü", type: "Vakıf" },
        { name: "Üsküdar Üniversitesi", city: "İstanbul", campus: "Altunizade Kampüsü", type: "Vakıf" },
        { name: "İstanbul 29 Mayıs Üniversitesi", city: "İstanbul", campus: "Topkapı Kampüsü", type: "Vakıf" },
        { name: "İstanbul Kemerburgaz Üniversitesi", city: "İstanbul", campus: "Mahmutbey Kampüsü", type: "Vakıf" },
        { name: "İstanbul Şişli Üniversitesi", city: "İstanbul", campus: "Şişli Kampüsü", type: "Vakıf" },
        { name: "İstanbul Sağlık ve Teknoloji Üniversitesi", city: "İstanbul", campus: "Sultanbeyli Kampüsü", type: "Vakıf" },
        { name: "İstanbul Ticaret Üniversitesi", city: "İstanbul", campus: "Sütlüce Kampüsü", type: "Vakıf" },
        { name: "Maltepe Üniversitesi", city: "İstanbul", campus: "Maltepe Kampüsü", type: "Vakıf" },
        { name: "Haliç Üniversitesi", city: "İstanbul", campus: "Eyüpsultan Kampüsü", type: "Vakıf" },
        { name: "Doğuş Üniversitesi", city: "İstanbul", campus: "Acıbadem Kampüsü", type: "Vakıf" },
        { name: "Piri Reis Üniversitesi", city: "İstanbul", campus: "Tuzla Kampüsü", type: "Vakıf" },
        { name: "İstanbul Kavram Meslek Yüksekokulu", city: "İstanbul", campus: "Fatih Kampüsü", type: "Vakıf" },
        
        // ANKARA
        { name: "Orta Doğu Teknik Üniversitesi", city: "Ankara", campus: "Merkez Kampüs", type: "Devlet" },
        { name: "Hacettepe Üniversitesi", city: "Ankara", campus: "Beytepe Kampüsü", type: "Devlet" },
        { name: "Ankara Üniversitesi", city: "Ankara", campus: "Tandoğan Kampüsü", type: "Devlet" },
        { name: "Gazi Üniversitesi", city: "Ankara", campus: "Maltepe Kampüsü", type: "Devlet" },
        { name: "Ankara Hacı Bayram Veli Üniversitesi", city: "Ankara", campus: "Polatlı Kampüsü", type: "Devlet" },
        { name: "Bilkent Üniversitesi", city: "Ankara", campus: "Merkez Kampüs", type: "Vakıf" },
        { name: "Çankaya Üniversitesi", city: "Ankara", campus: "Merkez Kampüs", type: "Vakıf" },
        { name: "Atılım Üniversitesi", city: "Ankara", campus: "İncek Kampüsü", type: "Vakıf" },
        { name: "Başkent Üniversitesi", city: "Ankara", campus: "Bağlıca Kampüsü", type: "Vakıf" },
        
        // İZMİR
        { name: "Ege Üniversitesi", city: "İzmir", campus: "Bornova Kampüsü", type: "Devlet" },
        { name: "Dokuz Eylül Üniversitesi", city: "İzmir", campus: "Tınaztepe Kampüsü", type: "Devlet" },
        { name: "İzmir Yüksek Teknoloji Enstitüsü", city: "İzmir", campus: "Urla Kampüsü", type: "Devlet" },
        { name: "İzmir Katip Çelebi Üniversitesi", city: "İzmir", campus: "Çiğli Kampüsü", type: "Devlet" },
        { name: "İzmir Ekonomi Üniversitesi", city: "İzmir", campus: "Balçova Kampüsü", type: "Vakıf" },
        { name: "Yaşar Üniversitesi", city: "İzmir", campus: "Bornova Kampüsü", type: "Vakıf" },
        
        // DİĞER ŞEHİRLER
        { name: "Bursa Teknik Üniversitesi", city: "Bursa", campus: "Yıldırım Kampüsü", type: "Devlet" },
        { name: "Uludağ Üniversitesi", city: "Bursa", campus: "Görükle Kampüsü", type: "Devlet" },
        { name: "Kocaeli Üniversitesi", city: "Kocaeli", campus: "Umuttepe Kampüsü", type: "Devlet" },
        { name: "Sakarya Üniversitesi", city: "Sakarya", campus: "Esentepe Kampüsü", type: "Devlet" },
        { name: "Gebze Teknik Üniversitesi", city: "Kocaeli", campus: "Gebze Kampüsü", type: "Devlet" },
        { name: "Eskişehir Teknik Üniversitesi", city: "Eskişehir", campus: "İki Eylül Kampüsü", type: "Devlet" },
        { name: "Anadolu Üniversitesi", city: "Eskişehir", campus: "Yunus Emre Kampüsü", type: "Devlet" },
        { name: "Konya Teknik Üniversitesi", city: "Konya", campus: "Merkez Kampüs", type: "Devlet" },
        { name: "Selçuk Üniversitesi", city: "Konya", campus: "Alaeddin Keykubat Kampüsü", type: "Devlet" },
        { name: "Erciyes Üniversitesi", city: "Kayseri", campus: "Merkez Kampüs", type: "Devlet" },
        { name: "Karadeniz Teknik Üniversitesi", city: "Trabzon", campus: "Kanuni Kampüsü", type: "Devlet" }
    ];

    const deptRankings = {
        "Bilgisayar Mühendisliği": [3000, 5000, 8000, 12000, 15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 68000, 70000, 72000, 75000, 78000, 80000, 85000, 2000, 4000, 7000, 10000, 13000, 16000, 20000, 24000, 30000, 33000, 36000, 43000, 46000, 53000, 56000, 63000, 66000, 73000, 76000, 82000, 87000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000],
        "Yazılım Mühendisliği": [5000, 8000, 12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000, 43000, 45000, 48000, 50000, 53000, 55000, 58000, 60000, 63000, 65000, 68000, 70000, 73000, 75000, 78000, 80000, 4000, 7000, 10000, 13000, 16000, 19000, 23000, 26000, 29000, 33000, 36000, 41000, 46000, 51000, 56000, 61000, 66000, 71000, 76000, 81000, 85000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000],
        "Bilgisayar Programcılığı": [150000, 155000, 160000, 165000, 170000, 175000, 180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000, 225000, 230000, 235000, 240000, 245000, 250000, 255000, 260000, 265000, 270000, 275000, 280000, 285000, 290000, 295000, 300000, 305000, 310000, 315000, 320000, 325000, 330000, 335000, 340000, 345000, 350000, 360000, 370000, 380000, 390000, 400000, 420000, 440000, 460000, 480000, 500000, 520000, 540000, 560000, 580000, 600000, 620000, 640000, 660000, 680000, 700000, 720000, 740000, 760000, 780000, 800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000],
        "Web Tasarım ve Kodlama": [180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000, 225000, 230000, 235000, 240000, 245000, 250000, 255000, 260000, 265000, 270000, 275000, 280000, 285000, 290000, 295000, 300000, 310000, 320000, 330000, 340000, 350000, 360000, 370000, 380000, 390000, 400000, 420000, 440000, 460000, 480000, 500000, 520000, 540000, 560000, 580000, 600000, 620000, 640000, 660000, 680000, 700000, 720000, 740000, 760000, 780000, 800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1350000, 1400000, 1450000, 1500000, 1550000, 1600000, 1650000, 1700000, 1750000, 1800000],
        "Bilgisayar Teknolojisi": [170000, 175000, 180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000, 225000, 230000, 235000, 240000, 245000, 250000, 255000, 260000, 265000, 270000, 275000, 280000, 285000, 290000, 295000, 300000, 310000, 320000, 330000, 340000, 350000, 360000, 370000, 380000, 390000, 400000, 420000, 440000, 460000, 480000, 500000, 520000, 540000, 560000, 580000, 600000, 620000, 640000, 660000, 680000, 700000, 750000, 800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1350000, 1400000, 1450000, 1500000, 1550000, 1600000, 1650000, 1700000, 1750000, 1800000, 1850000],
        "Bilişim Sistemleri ve Teknolojileri": [85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000, 150000, 155000, 160000, 165000, 170000, 175000, 180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000, 225000, 230000, 235000, 240000, 245000, 250000, 255000, 260000, 265000, 270000, 275000, 280000, 285000, 290000, 295000, 300000, 310000, 320000, 330000, 340000, 350000, 360000, 370000, 380000, 390000, 400000, 420000, 440000, 460000, 480000, 500000, 520000],
        "Makine Mühendisliği": [12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 68000, 70000, 10000, 13000, 16000, 19000, 23000, 26000, 29000, 33000, 36000, 43000, 46000, 53000, 56000, 63000, 66000, 73000, 76000, 80000, 85000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000, 280000],
        "Tıp": [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 150, 250, 350, 450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350, 1450, 1550, 1650, 1750, 1850, 1950, 2050, 2150, 2250, 2350, 2450, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000, 4500, 5000, 5500, 6000],
        "Hukuk": [5000, 8000, 10000, 12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 52000, 55000, 58000, 60000, 62000, 4000, 6000, 9000, 11000, 14000, 17000, 19000, 23000, 26000, 29000, 33000, 36000, 43000, 46000, 53000, 56000, 63000, 66000, 70000, 75000, 80000, 85000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000],
        "İşletme": [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000, 130000, 12000, 18000, 22000, 28000, 32000, 38000, 42000, 48000, 52000, 58000, 62000, 68000, 72000, 78000, 82000, 88000, 92000, 98000, 102000, 108000, 112000, 118000, 122000, 128000, 135000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000, 280000],
        "Elektrik-Elektronik Mühendisliği": [10000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 68000, 70000, 72000, 75000, 8000, 12000, 16000, 19000, 23000, 26000, 29000, 33000, 36000, 43000, 46000, 53000, 56000, 63000, 66000, 73000, 76000, 80000, 85000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000],
        "Mimarlık": [8000, 12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 68000, 7000, 10000, 14000, 17000, 19000, 23000, 26000, 29000, 33000, 36000, 43000, 46000, 53000, 56000, 63000, 66000, 70000, 75000, 80000, 85000, 90000, 95000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000],
        "Psikoloji": [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000, 9000, 14000, 18000, 22000, 28000, 32000, 38000, 42000, 48000, 52000, 58000, 62000, 68000, 72000, 78000, 82000, 88000, 92000, 98000, 102000, 108000, 112000, 118000, 122000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000, 280000]
    };

    const rankings = deptRankings[department] || Array.from({ length: 60 }, (_, i) => (i + 1) * 10000);

    return universities.map((uni, index) => {
        return {
            name: uni.name,
            city: uni.city,
            department: department,
            campus: uni.campus,
            ranking: rankings[index] || (index + 1) * 10000,
            quota: Math.floor(Math.random() * 80) + 20,
            type: uni.type,
            year: year,
            updatedAt: new Date()
        };
    });
}

module.exports = {
    scrapeYokAtlasReal,
    scrapeYokAtlasSimple,
    generateMockData
};
