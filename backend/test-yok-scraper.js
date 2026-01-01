/**
 * YÖK ATLAS TEST SCRIPT
 * 
 * Scraper'ı test etmek için küçük bir örnek
 * Sadece birkaç bölüm için veri çeker
 */

const { scrapeAllPrograms } = require('./yok-atlas-comprehensive-scraper');

async function testScraper() {
    console.log('🧪 YÖK Atlas Scraper Test Başlatılıyor...\n');

    // Test parametreleri:
    // - İlk 5 bölümü çek
    // - Her program arası 3 saniye bekle
    // - Her üniversite arası 1 saniye bekle
    // - Hem DB'ye hem JSON'a kaydet

    await scrapeAllPrograms({
        startFrom: 0,
        limit: 5,
        delayBetweenPrograms: 3000,
        delayBetweenUniversities: 1000,
        saveToDb: true,
        saveJson: true
    });

    console.log('\n✅ Test tamamlandı!');
    console.log('🔍 Sonuçları kontrol edin:');
    console.log('   - MySQL: SELECT * FROM universities ORDER BY id DESC LIMIT 20;');
    console.log('   - JSON: ./scraped-data/ klasörünü kontrol edin\n');
}

testScraper().catch(error => {
    console.error('❌ Test hatası:', error);
    process.exit(1);
});
