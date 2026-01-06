const axios = require('axios');

async function testAnalyze() {
    console.log('🧪 /api/analyze endpoint test ediliyor...\n');
    
    // Backend'in başlaması için bekle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        const response = await axios.post('http://localhost:3000/api/analyze', {
            aytRanking: 500000,
            tytRanking: 500000,
            dreamDept: 'Bilgisayar Mühendisliği',
            city: 'İstanbul',
            gender: 'Erkek',
            educationType: 'Tümü'
        });
        
        console.log('✅ API yanıt aldı\n');
        console.log('Response keys:', Object.keys(response.data));
        
        if (response.data.eligibleUniversities) {
            console.log('\nİlk üniversite:');
            const firstUni = response.data.eligibleUniversities[0];
            console.log('  Adı:', firstUni.name);
            console.log('  Şehir:', firstUni.city);
            console.log('  Kampüs:', firstUni.campus);
            console.log('  conditionNumbers:', firstUni.conditionNumbers || 'YOK');
            console.log('  conditions:', firstUni.conditions?.length || 0, 'adet');
            
            console.log('\nİkinci üniversite:');
            const secondUni = response.data.eligibleUniversities[1];
            if (secondUni) {
                console.log('  Adı:', secondUni.name);
                console.log('  conditionNumbers:', secondUni.conditionNumbers || 'YOK');
            }
        } else if (response.data.smartAlternatives) {
            console.log('\nSmart Alternatives döndü');
            const alts = response.data.smartAlternatives;
            
            if (alts.twoYearOptions && alts.twoYearOptions.length > 0) {
                console.log('\n2 Yıllık programlar:');
                const firstOption = alts.twoYearOptions[0];
                console.log('  Bölüm:', firstOption.dept);
                console.log('  Üniversite sayısı:', firstOption.universities?.length || 0);
                
                if (firstOption.universities && firstOption.universities.length > 0) {
                    const firstUni = firstOption.universities[0];
                    console.log('\n  İlk üniversite:', firstUni.name);
                    console.log('  Şehir:', firstUni.city);
                    console.log('  conditionNumbers:', firstUni.conditionNumbers || '❌ YOK');
                    console.log('  Tüm fieldlar:', Object.keys(firstUni));
                }
            }
        } else if (response.data.alternatives) {
            console.log('\nAlternatif programlar döndü');
            console.log('Keys:', Object.keys(response.data.alternatives));
        } else {
            console.log('\nUnexpected response format');
            console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAnalyze();
