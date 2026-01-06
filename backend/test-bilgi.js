const axios = require('axios');

async function testBilgi() {
    console.log('🧪 İstanbul Bilgi Üniversitesi için test...\n');
    
    try {
        const response = await axios.post('http://localhost:3000/api/recommendations', {
            aytRanking: 520000, // Bilgi'nin sıralaması 510000
            tytRanking: 520000,
            dreamDept: 'Bilgisayar Mühendisliği',
            city: 'İstanbul'
        });
        
        // Bilgi Üniversitesi'ni bul
        const alt2y = response.data.alternative2y || [];
        
        alt2y.forEach(prog => {
            if (prog.department === 'Bilgisayar Programcılığı') {
                console.log(`📚 ${prog.department} programında üniversiteler:\n`);
                
                prog.universities?.forEach((uni, i) => {
                    if (uni.name.includes('Bilgi')) {
                        console.log(`🎯 ${i+1}. ${uni.name}`);
                        console.log(`   Şehir: ${uni.city}`);
                        console.log(`   Sıralama: ${uni.ranking || uni.minRanking}`);
                        console.log(`   conditionNumbers: "${uni.conditionNumbers || 'YOK'}"`);
                        console.log(`   conditions: ${uni.conditions?.length || 0} adet`);
                        console.log('');
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

testBilgi();
