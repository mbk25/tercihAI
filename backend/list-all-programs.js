/**
 * YÖK Atlas'taki tüm bölüm isimlerini listele
 */

const puppeteer = require('puppeteer');

async function listAllPrograms() {
    console.log('\n📋 YÖK Atlas Bölüm Listesi\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    try {
        // Lisans programları
        console.log('🎓 LİSANS PROGRAMLARI:');
        console.log('═'.repeat(60));

        await page.goto('https://yokatlas.yok.gov.tr/lisans-anasayfa.php', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('#bolum');

        const lisansPrograms = await page.evaluate(() => {
            const bolumSelect = document.querySelector('#bolum');
            if (!bolumSelect) return [];

            const programs = [];
            const options = bolumSelect.querySelectorAll('option');

            options.forEach(option => {
                const value = option.value;
                const text = option.textContent.trim();

                if (value && text && text.length > 3) {
                    programs.push({
                        code: value,
                        name: text
                    });
                }
            });

            return programs;
        });

        // Ebelik içeren programları filtrele
        const ebelikPrograms = lisansPrograms.filter(p =>
            p.name.toLowerCase().includes('ebelik') ||
            p.name.toLowerCase().includes('hemşire') ||
            p.name.toLowerCase().includes('sağlık')
        );

        console.log(`\nEbelik/Hemşirelik/Sağlık içeren programlar (${ebelikPrograms.length} adet):`);
        ebelikPrograms.forEach(p => {
            console.log(`  - ${p.name} (Kod: ${p.code})`);
        });

        // Önlisans programları
        console.log('\n\n🎓 ÖNLİSANS PROGRAMLARI:');
        console.log('═'.repeat(60));

        await page.goto('https://yokatlas.yok.gov.tr/onlisans-anasayfa.php', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('#program');

        const onlisansPrograms = await page.evaluate(() => {
            const programSelect = document.querySelector('#program');
            if (!programSelect) return [];

            const programs = [];
            const options = programSelect.querySelectorAll('option');

            options.forEach(option => {
                const value = option.value;
                const text = option.textContent.trim();

                if (value && text && text.length > 3) {
                    programs.push({
                        code: value,
                        name: text
                    });
                }
            });

            return programs;
        });

        // Ebelik içeren programları filtrele
        const ebelikOnlisansPrograms = onlisansPrograms.filter(p =>
            p.name.toLowerCase().includes('ebelik') ||
            p.name.toLowerCase().includes('hemşire') ||
            p.name.toLowerCase().includes('sağlık')
        );

        console.log(`\nEbelik/Hemşirelik/Sağlık içeren programlar (${ebelikOnlisansPrograms.length} adet):`);
        ebelikOnlisansPrograms.forEach(p => {
            console.log(`  - ${p.name} (Kod: ${p.code})`);
        });

    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    listAllPrograms()
        .then(() => {
            console.log('\n✅ Tamamlandı!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Hata:', error);
            process.exit(1);
        });
}
