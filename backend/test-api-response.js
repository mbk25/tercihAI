/**
 * Backend API Test - Alternatif Programlar conditionNumbers Test
 */

const API_URL = 'http://localhost:3000';

async function testAlternativePrograms() {
    console.log('🧪 Alternatif programlar API testi başlıyor...\n');

    const testData = {
        aytRanking: 400000,
        tytRanking: 300000,
        gender: 'Erkek',
        dreamDept: 'Bilgisayar Mühendisliği',
        city: 'İstanbul',
        educationType: 'Tümü'
    };

    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        console.log('📊 API Response Status:', response.status);
        console.log('📊 isEligible:', data.isEligible);

        if (data.alternatives) {
            console.log('\n✅ Alternatif programlar bulundu:', data.alternatives.length);

            // İlk alternatif programı detaylı incele
            const firstAlt = data.alternatives[0];
            console.log('\n📚 İlk Alternatif Program:');
            console.log('   Bölüm:', firstAlt.dept);
            console.log('   Tür:', firstAlt.type);
            console.log('   Üniversite sayısı:', firstAlt.universities?.length || 0);

            if (firstAlt.universities && firstAlt.universities.length > 0) {
                const firstUni = firstAlt.universities[0];
                console.log('\n🏛️ İlk Üniversite:');
                console.log('   Ad:', firstUni.name);
                console.log('   Şehir:', firstUni.city);
                console.log('   Kampüs:', firstUni.campus);
                console.log('   Kontenjan:', firstUni.quota);
                console.log('   📋 conditionNumbers:', firstUni.conditionNumbers || 'BOŞ!');
                console.log('   📋 conditions array:', firstUni.conditions?.length || 0, 'item');

                if (!firstUni.conditionNumbers || firstUni.conditionNumbers.trim() === '') {
                    console.log('\n❌ SORUN BULUNDU: conditionNumbers alanı boş!');
                } else {
                    console.log('\n✅ conditionNumbers başarıyla dolu:', firstUni.conditionNumbers);
                }

                // İlk 3 üniversiteyi kontrol et
                console.log('\n📊 İlk 3 Üniversite conditionNumbers Kontrolü:');
                firstAlt.universities.slice(0, 3).forEach((uni, idx) => {
                    console.log(`   ${idx + 1}. ${uni.name}`);
                    console.log(`      conditionNumbers: "${uni.conditionNumbers || 'BOŞ'}"`);
                });
            }
        }

        // Tüm response'u dosyaya kaydet
        const fs = require('fs');
        fs.writeFileSync('api-response-test.json', JSON.stringify(data, null, 2));
        console.log('\n💾 Tam API response api-response-test.json dosyasına kaydedildi');

    } catch (error) {
        console.error('❌ Test hatası:', error.message);
    }
}

testAlternativePrograms();
