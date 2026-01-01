/**
 * İstanbul'daki Ebelik bölümlerini YÖK Atlas'tan çeker
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function scrapeEbelikIstanbul() {
    console.log('\n🎓 YÖK Atlas - İstanbul Ebelik Bölümleri Scraper');
    console.log('═'.repeat(60) + '\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
        // 1. Önce lisans sayfasından dene
        console.log('📋 Ebelik bölüm kodu aranıyor (Lisans)...');
        await page.goto('https://yokatlas.yok.gov.tr/lisans-anasayfa.php', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('#bolum', { timeout: 10000 });

        let ebelikCode = await page.evaluate(() => {
            const bolumSelect = document.querySelector('#bolum');
            if (!bolumSelect) return null;

            const options = bolumSelect.querySelectorAll('option');
            for (let option of options) {
                const text = option.textContent.trim().toLowerCase();
                if (text.includes('ebelik')) {
                    return {
                        code: option.value,
                        name: option.textContent.trim(),
                        type: 'lisans'
                    };
                }
            }
            return null;
        });

        // Eğer lisansta bulunamadıysa önlisans sayfasından dene
        if (!ebelikCode) {
            console.log('📋 Lisansta bulunamadı, Önlisans sayfasında aranıyor...');
            await page.goto('https://yokatlas.yok.gov.tr/onlisans-anasayfa.php', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await page.waitForSelector('#program', { timeout: 10000 });

            ebelikCode = await page.evaluate(() => {
                const programSelect = document.querySelector('#program');
                if (!programSelect) return null;

                const options = programSelect.querySelectorAll('option');
                for (let option of options) {
                    const text = option.textContent.trim().toLowerCase();
                    if (text.includes('ebelik')) {
                        return {
                            code: option.value,
                            name: option.textContent.trim(),
                            type: 'onlisans'
                        };
                    }
                }
                return null;
            });
        }

        if (!ebelikCode) {
            console.log('❌ Ebelik bölümü bulunamadı!');
            await browser.close();
            return;
        }

        console.log(`✅ Bölüm bulundu: ${ebelikCode.name} (Kod: ${ebelikCode.code}, Tür: ${ebelikCode.type})\n`);

        // 2. Ebelik bölümüne git
        const pageType = ebelikCode.type === 'onlisans' ? 'onlisans-bolum.php' : 'lisans-bolum.php';
        const url = `https://yokatlas.yok.gov.tr/${pageType}?b=${ebelikCode.code}`;
        console.log(`🔗 Bölüm sayfasına gidiliyor: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        await new Promise(r => setTimeout(r, 2000));

        // 3. Tüm üniversite linklerini çek
        const linkSelector = ebelikCode.type === 'onlisans' ? 'a[href*="onlisans.php?y="]' : 'a[href*="lisans.php?y="]';
        const universityLinks = await page.evaluate((selector) => {
            const links = [];
            const anchors = document.querySelectorAll(selector);

            anchors.forEach(a => {
                const href = a.getAttribute('href');
                const text = a.textContent.trim();
                const match = href.match(/y=(\d+)/);

                if (match) {
                    links.push({
                        programId: match[1],
                        text: text,
                        url: href.startsWith('http') ? href : `https://yokatlas.yok.gov.tr/${href}`
                    });
                }
            });

            return links;
        }, linkSelector);

        console.log(`📊 Toplam ${universityLinks.length} üniversite bulundu\n`);

        // 4. İstanbul'daki üniversiteleri filtrele ve detaylarını çek
        const istanbulUniversities = [];
        let processedCount = 0;

        for (const link of universityLinks) {
            processedCount++;

            // Sadece İstanbul'u içerenleri işle (ön filtreleme)
            if (!link.text.toLowerCase().includes('istanbul') &&
                !link.text.toLowerCase().includes('İSTANBUL')) {
                console.log(`[${processedCount}/${universityLinks.length}] Atlandı: ${link.text.substring(0, 50)}...`);
                continue;
            }

            console.log(`[${processedCount}/${universityLinks.length}] İşleniyor: ${link.text.substring(0, 50)}...`);

            try {
                const detailPageType = ebelikCode.type === 'onlisans' ? 'onlisans.php' : 'lisans.php';
                await page.goto(`https://yokatlas.yok.gov.tr/${detailPageType}?y=${link.programId}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                await new Promise(r => setTimeout(r, 1500));

                // Accordion'ı aç
                try {
                    await page.click('a[href="#c1000_1"]');
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e) {
                    // Accordion yoksa devam et
                }

                // Veriyi çek
                const programData = await page.evaluate((progName) => {
                    const data = {
                        name: null,
                        type: null,
                        city: null,
                        campus: null,
                        program: progName,
                        quota: null,
                        enrolled: null,
                        minRanking: null,
                        minScore: null,
                        language: 'Türkçe',
                        educationType: 'Örgün Öğretim',
                        scholarship: null
                    };

                    function getValueFromAccordion(accordionId, rowText, returnNumber = false) {
                        const accordion = document.querySelector(accordionId);
                        if (!accordion) return null;

                        const tables = accordion.querySelectorAll('table');
                        for (let table of tables) {
                            const rows = table.querySelectorAll('tr');
                            for (let row of rows) {
                                const cells = row.querySelectorAll('td');
                                if (cells.length >= 2) {
                                    const label = cells[0].textContent.trim().toLowerCase();
                                    if (label.includes(rowText.toLowerCase())) {
                                        const value = cells[1].textContent.trim();
                                        if (returnNumber) {
                                            const cleaned = value.replace(/[\*\.\s]/g, '').replace(',', '.');
                                            return parseFloat(cleaned) || null;
                                        }
                                        return value.replace(/[\*]/g, '').trim() || null;
                                    }
                                }
                            }
                        }
                        return null;
                    }

                    // Üniversite adı ve şehir
                    const h3 = document.querySelector('h3.panel-title.pull-left');
                    if (h3) {
                        const headerText = h3.textContent.trim();
                        const match = headerText.match(/(.*?)\s*\((.*?)\)/);
                        if (match) {
                            data.name = match[1].trim();
                            data.city = match[2].trim();
                        }
                    }

                    // Üniversite türü
                    const typeLabel = document.querySelector('.label-success, .label-info');
                    if (typeLabel) {
                        const typeText = typeLabel.textContent.trim().toLowerCase();
                        data.type = typeText.includes('vakıf') || typeText.includes('özel') ? 'Vakıf' : 'Devlet';
                    }

                    // Fakülte/Kampüs
                    const fakulte = getValueFromAccordion('#c1000_1', 'fakülte');
                    if (fakulte) {
                        data.campus = fakulte;
                    }

                    // Kontenjan
                    data.quota = getValueFromAccordion('#c1000_1', 'toplam kontenjan', true);

                    // Yerleşen
                    data.enrolled = getValueFromAccordion('#c1000_1', 'toplam yerleşen', true);

                    // En küçük sıralama
                    data.minRanking = getValueFromAccordion('#c1000_1', 'en küçük sıralama', true) ||
                        getValueFromAccordion('#c1000_1', '0,12 katsayı', true);

                    // En küçük puan
                    data.minScore = getValueFromAccordion('#c1000_1', 'en küçük puan', true) ||
                        getValueFromAccordion('#c1000_1', '0,12 puan', true);

                    return data;
                }, ebelikCode.name);

                // İstanbul'da olduğunu doğrula
                if (programData && programData.city &&
                    (programData.city.toLowerCase().includes('istanbul') ||
                        programData.city.toLowerCase().includes('İstanbul'))) {
                    istanbulUniversities.push(programData);
                    console.log(`   ✅ ${programData.name} - ${programData.city}`);
                    console.log(`      📊 Kontenjan: ${programData.quota} | Sıralama: ${programData.minRanking?.toLocaleString('tr-TR') || 'N/A'}`);
                }

                // İlk 5 üniversite bulununca dur
                if (istanbulUniversities.length >= 5) {
                    console.log('\n✅ 5 üniversite bulundu, tarama durduruluyor...\n');
                    break;
                }

                await new Promise(r => setTimeout(r, 500));

            } catch (error) {
                console.log(`   ⚠️ Hata: ${error.message}`);
            }
        }

        // 5. Sonuçları göster ve kaydet
        console.log('\n' + '═'.repeat(60));
        console.log('📊 SONUÇLAR - İSTANBUL EBELİK BÖLÜMLERİ');
        console.log('═'.repeat(60) + '\n');

        istanbulUniversities.forEach((uni, index) => {
            console.log(`${index + 1}. ${uni.name}`);
            console.log(`   📍 Şehir: ${uni.city}`);
            console.log(`   🏫 Kampüs/Fakülte: ${uni.campus || 'Belirtilmemiş'}`);
            console.log(`   🏛️ Tür: ${uni.type}`);
            console.log(`   👥 Kontenjan: ${uni.quota}`);
            console.log(`   📈 Yerleşen: ${uni.enrolled}`);
            console.log(`   🎯 En Küçük Sıralama: ${uni.minRanking?.toLocaleString('tr-TR') || 'N/A'}`);
            console.log(`   📊 En Küçük Puan: ${uni.minScore || 'N/A'}`);
            console.log('');
        });

        // JSON'a kaydet
        await fs.writeFile(
            './istanbul-ebelik-universities.json',
            JSON.stringify(istanbulUniversities, null, 2),
            'utf8'
        );

        console.log('💾 Veriler istanbul-ebelik-universities.json dosyasına kaydedildi\n');

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await browser.close();
    }
}

// Çalıştır
if (require.main === module) {
    scrapeEbelikIstanbul()
        .then(() => {
            console.log('✅ İşlem tamamlandı!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Fatal hata:', error);
            process.exit(1);
        });
}

module.exports = { scrapeEbelikIstanbul };
