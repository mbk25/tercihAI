/**
 * TOPLU VERİ ÇEKME SCRIPT'İ
 * 
 * Tüm Türkiye'deki tüm bölümler için veri çeker
 * 
 * KULLANIM:
 * 
 * 1. Tamamını çek (2-3 saat sürer):
 *    node batch-scrape-all-programs.js
 * 
 * 2. Belirli bir aralıktaki bölümleri çek:
 *    node batch-scrape-all-programs.js --start=0 --limit=50
 * 
 * 3. Sadece JSON'a kaydet (DB'ye kaydetme):
 *    node batch-scrape-all-programs.js --no-db
 * 
 * 4. Hız ayarı (milisaniye):
 *    node batch-scrape-all-programs.js --delay=1000
 */

const { scrapeAllPrograms } = require('./yok-atlas-comprehensive-scraper');

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║         YÖK ATLAS TOPLU VERİ ÇEKME BAŞLIYOR          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Komut satırı argümanlarını parse et
    const args = process.argv.slice(2);
    const options = {
        startFrom: 0,
        limit: null, // Tümünü çek
        delayBetweenPrograms: 2000, // 2 saniye
        delayBetweenUniversities: 500, // 0.5 saniye
        saveToDb: true,
        saveJson: true
    };

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        if (key === '--start') options.startFrom = parseInt(value);
        if (key === '--limit') options.limit = parseInt(value);
        if (key === '--delay') options.delayBetweenPrograms = parseInt(value);
        if (key === '--no-db') options.saveToDb = false;
        if (key === '--no-json') options.saveJson = false;
    });

    console.log('⚙️  AYARLAR:');
    console.log(`   Başlangıç: Bölüm #${options.startFrom}`);
    console.log(`   Limit: ${options.limit || 'Tümü'}`);
    console.log(`   Bölüm arası gecikme: ${options.delayBetweenPrograms}ms`);
    console.log(`   Üniversite arası gecikme: ${options.delayBetweenUniversities}ms`);
    console.log(`   Veritabanına kaydet: ${options.saveToDb ? 'Evet' : 'Hayır'}`);
    console.log(`   JSON'a kaydet: ${options.saveJson ? 'Evet' : 'Hayır'}`);
    console.log('\n' + '═'.repeat(60) + '\n');

    // Başlat
    await scrapeAllPrograms(options);

    console.log('\n🎉 İşlem tamamlandı!');
}

main().catch(error => {
    console.error('\n❌ Fatal hata:', error);
    process.exit(1);
});
