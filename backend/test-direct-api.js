const axios = require('axios');

async function testAPI() {
    console.log('\n🧪 API Testi Başlıyor...\n');
    
    const testData = {
        tytRanking: 450000,
        aytRanking: 999999,
        dreamDept: "Bilgisayar Programcılığı",
        city: "İstanbul",
        educationType: "Tümü"
    };
    
    console.log('📤 Gönderilen veri:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n⏳ İstek gönderiliyor...\n');
    
    try {
        const response = await axios.post('http://localhost:3000/api/recommendations', testData);
        
        console.log('✅ Yanıt alındı!\n');
        console.log('📊 Status:', response.data.status);
        console.log('📝 Message:', response.data.message);
        
        if (response.data.primary) {
            console.log('\n🎓 PRIMARY ÖNER İLER:');
            console.log('   Bölüm:', response.data.primary.department);
            console.log('   Toplam:', response.data.primary.summary.total);
            console.log('   Devlet:', response.data.primary.summary.devlet);
            console.log('   Vakıf:', response.data.primary.summary.vakif);
            
            console.log('\n📋 İLK 10 ÜNİVERSİTE:');
            response.data.primary.universities.slice(0, 10).forEach((uni, i) => {
                console.log(`   ${i + 1}. ${uni.name} (${uni.type}) - ${uni.ranking}`);
            });
        } else if (response.data.alternative4y || response.data.alternative2y) {
            console.log('\n⚠️  ALTERNATIF ÖNERİLER DÖNDÜ');
            
            if (response.data.alternative4y && response.data.alternative4y.length > 0) {
                console.log('\n📗 4 Yıllık Alternatifler:');
                response.data.alternative4y.forEach(alt => {
                    console.log(`   - ${alt.department}: ${alt.count} üniversite`);
                });
            }
            
            if (response.data.alternative2y && response.data.alternative2y.length > 0) {
                console.log('\n📘 2 Yıllık Alternatifler:');
                response.data.alternative2y.forEach(alt => {
                    console.log(`   - ${alt.department}: ${alt.count} üniversite`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.response?.data || error.message);
    }
}

testAPI();
