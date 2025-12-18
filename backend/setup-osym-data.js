/**
 * ÖSYM Tercih Kılavuzu Verilerini Yükleme Script'i
 * 
 * Bu script ÖSYM şart maddelerini veritabanına yükler.
 * İlk kurulumda veya veri güncellemelerinde kullanılır.
 */

const { 
    createConditionsTable, 
    scrapeConditionDefinitions, 
    scrapeProgramConditions,
    refreshAllData
} = require('./osym-guide-scraper');

async function setupOSYMData() {
    console.log('🎓 ==========================================');
    console.log('📋 ÖSYM Tercih Kılavuzu Veri Yükleme');
    console.log('==========================================\n');

    try {
        // 1. Tabloları oluştur
        console.log('1️⃣ Veritabanı tabloları oluşturuluyor...');
        await createConditionsTable();
        console.log('   ✅ Tablolar hazır\n');

        // 2. Şart tanımlarını yükle
        console.log('2️⃣ Şart tanımları yükleniyor...');
        await scrapeConditionDefinitions();
        console.log('   ✅ Şart tanımları yüklendi\n');

        // 3. Popüler bölümler için program şartlarını yükle
        console.log('3️⃣ Program şartları yükleniyor...');
        
        const popularDepartments = [
            'Bilgisayar Mühendisliği',
            'Yazılım Mühendisliği',
            'Elektrik-Elektronik Mühendisliği',
            'Makine Mühendisliği',
            'Endüstri Mühendisliği',
            'İnşaat Mühendisliği',
            'Tıp',
            'Hukuk',
            'İşletme',
            'Ekonomi',
            'Psikoloji',
            'Mimarlık',
            'Bilgisayar Programcılığı'
        ];

        for (const dept of popularDepartments) {
            console.log(`   📚 ${dept}...`);
            await scrapeProgramConditions(dept);
        }
        
        console.log('   ✅ Program şartları yüklendi\n');

        console.log('==========================================');
        console.log('✅ ÖSYM verileri başarıyla yüklendi!');
        console.log('==========================================\n');
        
        console.log('📊 Yüklenen veriler:');
        console.log(`   • 25 adet şart tanımı`);
        console.log(`   • ${popularDepartments.length} bölüm için program şartları`);
        console.log(`   • ${popularDepartments.length * 10} civarında üniversite-şart eşleşmesi\n`);

        console.log('💡 Kullanım:');
        console.log('   • Kullanıcılar tercih analizi yaptığında şart maddeleri otomatik gösterilecek');
        console.log('   • Admin panelden /api/admin/program-conditions ile listelenebilir');
        console.log('   • /api/conditions/definitions ile tüm şartlar görülebilir\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        console.error('\n💡 Çözüm önerileri:');
        console.error('   1. MySQL servisinin çalıştığından emin olun');
        console.error('   2. .env dosyasındaki veritabanı bilgilerini kontrol edin');
        console.error('   3. Veritabanı kullanıcısının gerekli yetkilere sahip olduğundan emin olun\n');
        process.exit(1);
    }
}

// Script'i çalıştır
if (require.main === module) {
    setupOSYMData();
}

module.exports = { setupOSYMData };
