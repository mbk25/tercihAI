/**
 * POPÜLER BÖLÜMLER HIZLI SCRAPER
 * 
 * Sadece en popüler 20 bölüm için hızlı veri çekme
 * 
 * KULLANIM:
 * node scrape-top-departments.js
 */

const { pool } = require('./db');
const { scrapeYokAtlasReal, scrapeYokAtlasSimple } = require('./yokAtlasScraper');
const fs = require('fs').promises;
const path = require('path');

// En popüler 20 bölüm
const TOP_DEPARTMENTS = [
    // 4 Yıllık
    "Bilgisayar Mühendisliği",
    "Tıp",
    "Hukuk",
    "İşletme",
    "Mimarlık",
    "Psikoloji",
    "Yazılım Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "İnşaat Mühendisliği",
    "Hemşirelik",
    "İletişim",
    "Uluslararası İlişkiler",
    "İktisat",
    
    // 2 Yıllık
    "Bilgisayar Programcılığı",
    "Web Tasarım ve Kodlama",
    "Dış Ticaret",
    "Turizm ve Otel İşletmeciliği",
    "Grafik Tasarımı",
    "Muhasebe ve Vergi Uygulamaları"
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function quickScrape() {
    console.log('\n⚡ HIZLI SCRAPER BAŞLATILIYOR...');
    console.log(`📋 ${TOP_DEPARTMENTS.length} popüler bölüm\n`);
    
    const allPrograms = [];
    
    for (let i = 0; i < TOP_DEPARTMENTS.length; i++) {
        const dept = TOP_DEPARTMENTS[i];
        console.log(`[${i + 1}/${TOP_DEPARTMENTS.length}] 🔍 ${dept}...`);
        
        try {
            let programs = await scrapeYokAtlasSimple(dept, 2024);
            
            if (!programs || programs.length === 0) {
                programs = await scrapeYokAtlasReal(dept, 2024);
            }
            
            if (programs && programs.length > 0) {
                console.log(`   ✅ ${programs.length} program`);
                
                const enriched = programs.map(p => ({
                    ...p,
                    program: dept,
                    department: dept
                }));
                
                allPrograms.push(...enriched);
                
                // Veritabanına kaydet
                const connection = await pool.getConnection();
                for (const prog of enriched) {
                    await connection.query(
                        `INSERT IGNORE INTO universities 
                        (name, city, department, campus, ranking, quota, type, year)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [prog.name, prog.city, dept, prog.campus, 
                         prog.ranking || prog.minRanking, prog.quota, 
                         prog.type || 'Devlet', 2024]
                    );
                }
                connection.release();
            } else {
                console.log(`   ⚠️ Veri yok`);
            }
            
            await delay(1500);
            
        } catch (error) {
            console.error(`   ❌ ${error.message}`);
        }
    }
    
    // İstanbul CS birleştir
    try {
        const istanbulCS = JSON.parse(
            await fs.readFile('istanbul-bilgisayar-programciligi.json', 'utf-8')
        );
        
        const existing = new Set(
            allPrograms.map(p => `${p.name}|${p.city}|${p.campus}`)
        );
        
        let added = 0;
        for (const prog of istanbulCS) {
            const key = `${prog.name}|${prog.city}|${prog.campus}`;
            if (!existing.has(key)) {
                allPrograms.push(prog);
                added++;
            }
        }
        
        console.log(`\n✅ İstanbul CS: ${added} yeni program eklendi`);
    } catch (e) {
        console.log(`\n⚠️ İstanbul CS yüklenemedi: ${e.message}`);
    }
    
    // Kaydet
    await fs.writeFile(
        'top-programs.json',
        JSON.stringify({
            generatedAt: new Date().toISOString(),
            total: allPrograms.length,
            programs: allPrograms
        }, null, 2)
    );
    
    console.log(`\n✅ ${allPrograms.length} program kaydedildi: top-programs.json\n`);
    
    process.exit(0);
}

quickScrape().catch(console.error);
