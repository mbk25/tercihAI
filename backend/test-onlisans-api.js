/**
 * Basit YÖK Atlas Önlisans Test
 * Bilgisayar Programcılığı verilerini çekmeyi dene
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

async function testOnlisansSearch() {
    console.log('🧪 YÖK Atlas Önlisans API Test\n');
    
    const programNames = [
        'Bilgisayar Programcılığı',
        'Bilgisayar',
        'programcılığı',
        'bilgisayar programcılığı'
    ];
    
    for (const programName of programNames) {
        console.log(`\n🔍 Test: "${programName}"`);
        console.log('─'.repeat(60));
        
        try {
            // Lisans endpoint'i ile dene
            const lisansUrl = `https://yokatlas.yok.gov.tr/lisans-ajax.php?q=${encodeURIComponent(programName)}`;
            console.log(`📡 Lisans URL: ${lisansUrl}`);
            
            const lisansResponse = await axios.get(lisansUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                httpsAgent,
                timeout: 10000
            });
            
            console.log(`✅ Lisans Response (${typeof lisansResponse.data}):`);
            if (Array.isArray(lisansResponse.data)) {
                console.log(`   📊 ${lisansResponse.data.length} sonuç`);
                if (lisansResponse.data.length > 0) {
                    console.log(`   İlk 3 sonuç:`);
                    lisansResponse.data.slice(0, 3).forEach((item, i) => {
                        console.log(`      ${i + 1}. ${item.label || item.value || JSON.stringify(item)}`);
                    });
                }
            } else {
                console.log(`   Response: ${JSON.stringify(lisansResponse.data).substring(0, 200)}`);
            }
            
        } catch (error) {
            console.log(`❌ Hata: ${error.message}`);
        }
        
        // Önlisans endpoint'i ile dene
        try {
            const onlisansUrl = `https://yokatlas.yok.gov.tr/onlisans-ajax.php?q=${encodeURIComponent(programName)}`;
            console.log(`\n📡 Önlisans URL: ${onlisansUrl}`);
            
            const onlisansResponse = await axios.get(onlisansUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                httpsAgent,
                timeout: 10000
            });
            
            console.log(`✅ Önlisans Response (${typeof onlisansResponse.data}):`);
            if (Array.isArray(onlisansResponse.data)) {
                console.log(`   📊 ${onlisansResponse.data.length} sonuç`);
                if (onlisansResponse.data.length > 0) {
                    console.log(`   İlk 3 sonuç:`);
                    onlisansResponse.data.slice(0, 3).forEach((item, i) => {
                        console.log(`      ${i + 1}. ${item.label || item.value || JSON.stringify(item)}`);
                    });
                }
            } else {
                console.log(`   Response: ${JSON.stringify(onlisansResponse.data).substring(0, 200)}`);
            }
            
        } catch (error) {
            console.log(`❌ Hata: ${error.message}`);
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n\n✅ Test tamamlandı!');
}

testOnlisansSearch().catch(error => {
    console.error('\n❌ Fatal hata:', error);
    process.exit(1);
});
