/**
 * ÖSYM Verilerini Hızlı Yenileme Script'i
 */

const { refreshAllData } = require('./osym-guide-scraper');

async function reload() {
    console.log('🔄 ÖSYM verileri yenileniyor...\n');
    
    try {
        await refreshAllData();
        console.log('\n✅ Veriler başarıyla yenilendi!');
        console.log('\n💡 Şimdi sunucuyu yeniden başlatın:');
        console.log('   node server.js\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

reload();
