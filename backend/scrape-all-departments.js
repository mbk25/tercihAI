/**
 * TÜRKİYE GENELİ ÜNİVERSİTE PROGRAMLARI SCRAPER
 * 
 * Bu script popüler bölümler için Türkiye genelindeki tüm üniversite
 * programlarını YÖK Atlas'tan çeker ve JSON dosyasına kaydeder.
 * 
 * KULLANIM:
 * node scrape-all-departments.js
 * 
 * ÇIKIŞ:
 * - all-university-programs.json (tüm veriler)
 * - Veritabanına otomatik kayıt
 */

const { pool } = require('./db');
const { scrapeYokAtlasReal, scrapeYokAtlasSimple } = require('./yokAtlasScraper');
const fs = require('fs').promises;
const path = require('path');

// Popüler bölümler listesi (YÖK Atlas'ta en çok arananlar)
const POPULAR_DEPARTMENTS = [
    // 4 YILLIK LİSANS PROGRAMLARI
    
    // Mühendislik
    "Bilgisayar Mühendisliği",
    "Yazılım Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "Endüstri Mühendisliği",
    "İnşaat Mühendisliği",
    "Mekatronik Mühendisliği",
    "Otomotiv Mühendisliği",
    "Biyomedikal Mühendisliği",
    "Çevre Mühendisliği",
    "Harita Mühendisliği",
    "Kimya Mühendisliği",
    "Gıda Mühendisliği",
    
    // Sağlık Bilimleri
    "Tıp",
    "Diş Hekimliği",
    "Eczacılık",
    "Hemşirelik",
    "Fizyoterapi ve Rehabilitasyon",
    "Beslenme ve Diyetetik",
    "Odyoloji",
    
    // Sosyal Bilimler
    "Hukuk",
    "İşletme",
    "İktisat",
    "Psikoloji",
    "Sosyoloji",
    "Siyaset Bilimi ve Uluslararası İlişkiler",
    "Kamu Yönetimi",
    "Uluslararası Ticaret",
    "Uluslararası İlişkiler",
    
    // Fen Bilimleri
    "Mimarlık",
    "İç Mimarlık",
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "İstatistik",
    
    // Eğitim
    "Bilgisayar ve Öğretim Teknolojileri Öğretmenliği",
    "İngilizce Öğretmenliği",
    "Matematik Öğretmenliği",
    "Okul Öncesi Öğretmenliği",
    "Sınıf Öğretmenliği",
    
    // İletişim
    "İletişim",
    "Gazetecilik",
    "Halkla İlişkiler ve Tanıtım",
    "Radyo, Televizyon ve Sinema",
    
    // 2 YILLIK ÖNLISANS PROGRAMLARI
    
    // Bilgisayar ve Teknoloji
    "Bilgisayar Programcılığı",
    "Bilgisayar Teknolojisi",
    "Web Tasarım ve Kodlama",
    "Yazılım Geliştirme",
    "Bilişim Güvenliği Teknolojisi",
    
    // Sağlık
    "Tıbbi Laboratuvar Teknikleri",
    "Tıbbi Görüntüleme Teknikleri",
    "Anestezi",
    "Ameliyathane Hizmetleri",
    "İlk ve Acil Yardım",
    
    // İş ve Yönetim
    "Dış Ticaret",
    "Büro Yönetimi ve Yönetici Asistanlığı",
    "Muhasebe ve Vergi Uygulamaları",
    "İnsan Kaynakları Yönetimi",
    "Lojistik",
    
    // Tasarım
    "Grafik Tasarımı",
    "İç Mekan Tasarımı",
    "Moda Tasarımı",
    
    // Turizm
    "Turizm ve Otel İşletmeciliği",
    "Aşçılık",
    "Turist Rehberliği"
];

const OUTPUT_FILE = 'all-university-programs.json';
const ISTANBUL_CS_FILE = 'istanbul-bilgisayar-programciligi.json';

// Gecikme fonksiyonu (rate limiting için)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeAllDepartments() {
    console.log('\n🎓 ================================================');
    console.log('📚 TÜRKİYE GENELİ ÜNİVERSİTE PROGRAMLARI SCRAPER');
    console.log('================================================\n');
    
    const allPrograms = [];
    let successCount = 0;
    let failCount = 0;
    
    console.log(`📋 ${POPULAR_DEPARTMENTS.length} bölüm için veri çekilecek...\n`);
    
    for (let i = 0; i < POPULAR_DEPARTMENTS.length; i++) {
        const dept = POPULAR_DEPARTMENTS[i];
        const progress = `[${i + 1}/${POPULAR_DEPARTMENTS.length}]`;
        
        console.log(`\n${progress} 🔍 "${dept}" bölümü işleniyor...`);
        
        try {
            // Önce basit scraper'ı dene
            let programs = await scrapeYokAtlasSimple(dept, 2024);
            
            // Başarısızsa Puppeteer ile dene
            if (!programs || programs.length === 0) {
                console.log(`   ⚙️ Puppeteer ile deneniyor...`);
                programs = await scrapeYokAtlasReal(dept, 2024);
            }
            
            if (programs && programs.length > 0) {
                console.log(`   ✅ ${programs.length} program bulundu`);
                
                // Program bilgisini ekle
                const enrichedPrograms = programs.map(p => ({
                    ...p,
                    program: dept,
                    department: dept,
                    scrapedAt: new Date().toISOString()
                }));
                
                allPrograms.push(...enrichedPrograms);
                successCount++;
                
                // Veritabanına kaydet
                await saveToDatabase(enrichedPrograms);
                
            } else {
                console.log(`   ⚠️ Veri bulunamadı`);
                failCount++;
            }
            
            // Rate limiting - YÖK'ü yormayalım
            if (i < POPULAR_DEPARTMENTS.length - 1) {
                await delay(2000); // 2 saniye bekle
            }
            
        } catch (error) {
            console.error(`   ❌ Hata: ${error.message}`);
            failCount++;
        }
    }
    
    console.log('\n\n🎯 ================================================');
    console.log('📊 SONUÇLAR');
    console.log('================================================');
    console.log(`✅ Başarılı: ${successCount} bölüm`);
    console.log(`❌ Başarısız: ${failCount} bölüm`);
    console.log(`📚 Toplam Program: ${allPrograms.length}`);
    console.log('================================================\n');
    
    return allPrograms;
}

async function saveToDatabase(programs) {
    const connection = await pool.getConnection();
    
    try {
        for (const prog of programs) {
            await connection.query(
                `INSERT IGNORE INTO universities 
                (name, city, department, campus, ranking, quota, type, year, minScore, language, educationType, scholarship)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    prog.name,
                    prog.city,
                    prog.department || prog.program,
                    prog.campus,
                    prog.ranking || prog.minRanking,
                    prog.quota,
                    prog.type || 'Devlet',
                    prog.year || 2024,
                    prog.minScore,
                    prog.language || 'Türkçe',
                    prog.educationType || 'Örgün Öğretim',
                    prog.scholarship
                ]
            );
        }
        
        console.log(`   💾 ${programs.length} program veritabanına kaydedildi`);
        
    } catch (error) {
        console.error(`   ⚠️ Veritabanı hatası: ${error.message}`);
    } finally {
        connection.release();
    }
}

async function mergeWithIstanbulCSData(allPrograms) {
    console.log('\n🔄 İstanbul Bilgisayar Programcılığı verileri birleştiriliyor...');
    
    try {
        const istanbulCSPath = path.join(__dirname, ISTANBUL_CS_FILE);
        const istanbulCSData = JSON.parse(await fs.readFile(istanbulCSPath, 'utf-8'));
        
        console.log(`   📂 ${istanbulCSData.length} İstanbul BP programı bulundu`);
        
        // Tekrar kontrolü - aynı üniversite ve program varsa üzerine yazma
        const existingKeys = new Set(
            allPrograms.map(p => `${p.name}|${p.city}|${p.program}|${p.campus}`)
        );
        
        let addedCount = 0;
        for (const prog of istanbulCSData) {
            const key = `${prog.name}|${prog.city}|${prog.program}|${prog.campus}`;
            
            if (!existingKeys.has(key)) {
                allPrograms.push({
                    ...prog,
                    mergedFrom: 'istanbul-cs-data',
                    scrapedAt: new Date().toISOString()
                });
                addedCount++;
            }
        }
        
        console.log(`   ✅ ${addedCount} yeni program eklendi`);
        console.log(`   ℹ️ ${istanbulCSData.length - addedCount} program zaten mevcuttu\n`);
        
    } catch (error) {
        console.error(`   ⚠️ Birleştirme hatası: ${error.message}\n`);
    }
    
    return allPrograms;
}

async function saveToJSON(programs) {
    console.log('\n💾 JSON dosyasına kaydediliyor...');
    
    const outputPath = path.join(__dirname, OUTPUT_FILE);
    
    const data = {
        generatedAt: new Date().toISOString(),
        totalPrograms: programs.length,
        totalDepartments: [...new Set(programs.map(p => p.program || p.department))].length,
        totalUniversities: [...new Set(programs.map(p => p.name))].length,
        programs: programs
    };
    
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ Kaydedildi: ${outputPath}`);
    console.log(`📊 Toplam: ${programs.length} program\n`);
}

async function generateStatistics(programs) {
    console.log('\n📈 ================================================');
    console.log('📊 İSTATİSTİKLER');
    console.log('================================================\n');
    
    // Bölüm başına program sayısı
    const deptCounts = {};
    programs.forEach(p => {
        const dept = p.program || p.department;
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    console.log('🏆 EN ÇOK PROGRAMA SAHİP BÖLÜMLER:');
    Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([dept, count], i) => {
            console.log(`   ${i + 1}. ${dept}: ${count} program`);
        });
    
    // Şehir bazında
    const cityCounts = {};
    programs.forEach(p => {
        cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    });
    
    console.log('\n🌆 EN ÇOK PROGRAM SUNAN ŞEHİRLER:');
    Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([city, count], i) => {
            console.log(`   ${i + 1}. ${city}: ${count} program`);
        });
    
    // Devlet vs Vakıf
    const devletCount = programs.filter(p => p.type === 'Devlet').length;
    const vakifCount = programs.filter(p => p.type === 'Vakıf').length;
    
    console.log('\n🏛️ ÜNİVERSİTE TİPLERİ:');
    console.log(`   Devlet: ${devletCount} program (%${((devletCount / programs.length) * 100).toFixed(1)})`);
    console.log(`   Vakıf: ${vakifCount} program (%${((vakifCount / programs.length) * 100).toFixed(1)})`);
    
    console.log('\n================================================\n');
}

// Ana fonksiyon
async function main() {
    try {
        const startTime = Date.now();
        
        // 1. Tüm bölümleri scrape et
        let allPrograms = await scrapeAllDepartments();
        
        // 2. İstanbul CS verilerini birleştir
        allPrograms = await mergeWithIstanbulCSData(allPrograms);
        
        // 3. JSON'a kaydet
        await saveToJSON(allPrograms);
        
        // 4. İstatistikleri göster
        await generateStatistics(allPrograms);
        
        const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        console.log(`⏱️ Toplam Süre: ${elapsedTime} dakika\n`);
        
        console.log('🎉 İşlem tamamlandı!\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ HATA:', error);
        process.exit(1);
    }
}

// Script çalıştırıldığında
if (require.main === module) {
    main();
}

module.exports = { scrapeAllDepartments, mergeWithIstanbulCSData };
