const axios = require('axios');

async function testAPI() {
    console.log('🧪 API Test başlıyor...\n');
    
    try {
        const response = await axios.post('http://localhost:3000/api/recommendations', {
            aytRanking: 300000,
            tytRanking: 300000,
            dreamDept: 'Bilgisayar Mühendisliği',
            city: 'İstanbul'
        });
        
        console.log('✅ API yanıt aldı\n');
        
        // Alternative2y içinde Bezmialem'i ara
        const alt2y = response.data.alternative2y || [];
        console.log('Alternative 2y programlar:', alt2y.length);
        
        alt2y.forEach(prog => {
            console.log(`\n📚 Program: ${prog.department}`);
            console.log(`   Toplam ${prog.universities?.length || 0} üniversite\n`);
            
            const bezmialem = prog.universities?.filter(u => u.name && u.name.toUpperCase().includes('BEZMIALEM'));
            
            if (bezmialem && bezmialem.length > 0) {
                console.log('  🎯 BEZMIALEM BULUNDU!');
                bezmialem.forEach(uni => {
                    console.log('    Üniversite:', uni.name);
                    console.log('    conditionNumbers:', uni.conditionNumbers);
                    console.log('    conditions array:', uni.conditions?.length || 0);
                });
            } else {
                // İlk 5 üniversiteyi göster
                console.log('  ❌ Bezmialem yok, ilk 5:');
                prog.universities?.slice(0, 5).forEach((u, i) => {
                    console.log(`    ${i+1}. ${u.name} - Sıralama: ${u.ranking || u.minRanking} - Conditions: ${u.conditionNumbers || 'YOK'}`);
                });
            }
        });
        
        // Bezmialem'i bul
        const bezmialem = response.data.recommendations?.filter(r => 
            r.name && r.name.includes('Bezmialem')
        );
        
        if (bezmialem && bezmialem.length > 0) {
            console.log('\n🎯 Bezmialem bulundu!');
            bezmialem.forEach(uni => {
                console.log('\nÜniversite:', uni.name);
                console.log('Program:', uni.department || uni.programType);
                console.log('conditionNumbers:', uni.conditionNumbers);
                console.log('conditions:', uni.conditions?.length || 0, 'adet');
            });
        } else {
            console.log('\n❌ Bezmialem bulunamadı');
            console.log('\nİlk 3 üniversite:');
            response.data.recommendations?.slice(0, 3).forEach(uni => {
                console.log(`- ${uni.name}: ${uni.conditionNumbers || 'YOK'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAPI();
