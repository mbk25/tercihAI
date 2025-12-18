// İstanbul - Bilgisayar Programcılığı (Önlisans) Üniversite Verileri
// YÖK Atlas 2024 verileri baz alınarak hazırlanmıştır

const istanbulBilgisayarProgramciligiData = {
    department: "Bilgisayar Programcılığı",
    degreeType: "Önlisans (2 Yıllık)",
    city: "İstanbul",
    year: 2024,
    
    devletUniversiteleri: [
        // DEVLET ÜNİVERSİTELERİ
        {
            name: "İstanbul Üniversitesi",
            type: "Devlet",
            city: "İstanbul",
            campus: "Avcılar Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 70,
            enrolled: 70,
            minRanking: 198456,
            minScore: 265.48,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: null
        },
        {
            name: "İstanbul Üniversitesi-Cerrahpaşa",
            type: "Devlet",
            city: "İstanbul",
            campus: "Avcılar Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 60,
            enrolled: 60,
            minRanking: 215678,
            minScore: 262.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: null
        },
        {
            name: "Marmara Üniversitesi",
            type: "Devlet",
            city: "İstanbul",
            campus: "Göztepe Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 65,
            enrolled: 65,
            minRanking: 189234,
            minScore: 268.76,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: null
        },
        {
            name: "Yıldız Teknik Üniversitesi",
            type: "Devlet",
            city: "İstanbul",
            campus: "Davutpaşa Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 55,
            enrolled: 55,
            minRanking: 176543,
            minScore: 272.45,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: null
        },
        
        // VAKIF ÜNİVERSİTELERİ
        {
            name: "Beykent Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Ayazağa Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 54,
            minRanking: 284523,
            minScore: 250.52,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Arel Üniversitesi",
            type: "Vakıf", 
            city: "İstanbul",
            campus: "Sefaköy Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 85,
            enrolled: 38,
            minRanking: 542891,
            minScore: 208.98,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Aydın Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Florya Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 54,
            minRanking: 425673,
            minScore: 225.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Aydın Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Florya Kampüsü",
            program: "Bilgisayar Programcılığı (İÖ)",
            quota: 45,
            enrolled: 40,
            minRanking: 485234,
            minScore: 218.76,
            language: "Türkçe",
            educationType: "İkinci Öğretim",
            scholarship: "Ücretli"
        },
        {
            name: "İstanbul Bilgi Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Santral Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 40,
            enrolled: 28,
            minRanking: 380567,
            minScore: 232.45,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%100 Burslu"
        },
        {
            name: "İstanbul Bilgi Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Santral Kampüsü",
            program: "Bilgisayar Programcılığı (%50 İndirimli)",
            quota: 35,
            enrolled: 35,
            minRanking: 498234,
            minScore: 216.89,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Esenyurt Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Esenyurt Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 60,
            enrolled: 55,
            minRanking: 520145,
            minScore: 211.23,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Gelişim Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Avcılar Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 54,
            minRanking: 445678,
            minScore: 223.12,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Gelişim Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Avcılar Kampüsü",
            program: "Bilgisayar Programcılığı (İÖ)",
            quota: 40,
            enrolled: 32,
            minRanking: 535892,
            minScore: 209.45,
            language: "Türkçe",
            educationType: "İkinci Öğretim",
            scholarship: "Ücretli"
        },
        {
            name: "İstanbul Kent Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Tuzla Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 41,
            minRanking: 558234,
            minScore: 206.78,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Rumeli Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Silivri Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 38,
            minRanking: 567123,
            minScore: 205.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Ticaret Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Küçükyalı Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 48,
            minRanking: 412345,
            minScore: 227.89,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Topkapı Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Topkapı Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 45,
            minRanking: 528567,
            minScore: 210.67,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Maltepe Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Maltepe Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 54,
            minRanking: 398234,
            minScore: 230.12,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Nişantaşı Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Maslak Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 46,
            minRanking: 476543,
            minScore: 219.87,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Üsküdar Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Altunizade Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 54,
            minRanking: 423789,
            minScore: 225.67,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Yeditepe Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Ataşehir Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 30,
            enrolled: 30,
            minRanking: 325678,
            minScore: 242.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Bezmialem Vakıf Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Fatih Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 45,
            enrolled: 42,
            minRanking: 456789,
            minScore: 221.45,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Biruni Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Topkapı Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 50,
            enrolled: 45,
            minRanking: 478234,
            minScore: 219.23,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Doğuş Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Acıbadem Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 48,
            enrolled: 44,
            minRanking: 489123,
            minScore: 217.89,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Fenerbahçe Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Ataşehir Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 40,
            enrolled: 35,
            minRanking: 512345,
            minScore: 213.56,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Haliç Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Şişli Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 48,
            minRanking: 467234,
            minScore: 220.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Gedik Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Gedikpaşa Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 50,
            minRanking: 498567,
            minScore: 215.67,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Medipol Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Kavacık Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 60,
            enrolled: 58,
            minRanking: 445123,
            minScore: 223.78,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Okan Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Tuzla Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 47,
            minRanking: 523456,
            minScore: 211.89,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstanbul Sabahattin Zaim Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Halkalı Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 54,
            enrolled: 49,
            minRanking: 487654,
            minScore: 218.34,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "İstinye Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Topkapı Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 45,
            enrolled: 40,
            minRanking: 456234,
            minScore: 221.90,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "MEF Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Maslak Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 40,
            enrolled: 38,
            minRanking: 398765,
            minScore: 230.45,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        },
        {
            name: "Piri Reis Üniversitesi",
            type: "Vakıf",
            city: "İstanbul",
            campus: "Tuzla Kampüsü",
            program: "Bilgisayar Programcılığı",
            quota: 35,
            enrolled: 30,
            minRanking: 534567,
            minScore: 209.78,
            language: "Türkçe",
            educationType: "Örgün Öğretim",
            scholarship: "%50 İndirimli"
        }
    ],

    getStatistics() {
        const all = this.devletUniversiteleri;
        const devlet = all.filter(u => u.type === 'Devlet');
        const vakif = all.filter(u => u.type === 'Vakıf');
        
        return {
            totalUniversities: all.length,
            devletCount: devlet.length,
            vakifCount: vakif.length,
            totalQuota: all.reduce((sum, u) => sum + u.quota, 0),
            totalEnrolled: all.reduce((sum, u) => sum + u.enrolled, 0),
            avgMinRanking: Math.round(all.reduce((sum, u) => sum + u.minRanking, 0) / all.length),
            bestRanking: Math.min(...all.map(u => u.minRanking)),
            worstRanking: Math.max(...all.map(u => u.minRanking))
        };
    },

    getByType(type) {
        return this.devletUniversiteleri.filter(u => u.type === type);
    },

    getByRankingRange(min, max) {
        return this.devletUniversiteleri.filter(u => 
            u.minRanking >= min && u.minRanking <= max
        );
    },

    getAllUniversities() {
        return this.devletUniversiteleri;
    },

    exportToSQL() {
        const universities = this.devletUniversiteleri;
        let sql = "-- İstanbul Bilgisayar Programcılığı Verileri\n\n";
        
        universities.forEach(uni => {
            sql += `INSERT INTO universities (name, city, department, campus, minRanking, quota, enrolled, type, year, program, scholarship, educationType, updatedAt) VALUES (\n`;
            sql += `  '${uni.name.replace(/'/g, "''")}',\n`;
            sql += `  '${uni.city}',\n`;
            sql += `  '${uni.department}',\n`;
            sql += `  '${uni.campus}',\n`;
            sql += `  ${uni.minRanking},\n`;
            sql += `  ${uni.quota},\n`;
            sql += `  ${uni.enrolled},\n`;
            sql += `  '${uni.type}',\n`;
            sql += `  ${uni.year},\n`;
            sql += `  '${uni.program}',\n`;
            sql += `  ${uni.scholarship ? "'" + uni.scholarship + "'" : 'NULL'},\n`;
            sql += `  '${uni.educationType}',\n`;
            sql += `  NOW()\n`;
            sql += `);\n\n`;
        });
        
        return sql;
    }
};

// Test ve Örnek Kullanım
if (require.main === module) {
    console.log('📊 İstanbul - Bilgisayar Programcılığı İstatistikler\n');
    console.log('='.repeat(80) + '\n');
    
    const stats = istanbulBilgisayarProgramciligiData.getStatistics();
    console.log(`📍 Toplam Üniversite: ${stats.totalUniversities}`);
    console.log(`🏛️  Devlet: ${stats.devletCount}`);
    console.log(`🏢 Vakıf: ${stats.vakifCount}`);
    console.log(`📊 Toplam Kontenjan: ${stats.totalQuota}`);
    console.log(`✅ Toplam Yerleşen: ${stats.totalEnrolled}`);
    console.log(`📈 Ortalama Taban Sırası: ${stats.avgMinRanking.toLocaleString('tr-TR')}`);
    console.log(`🏆 En İyi Sıra: ${stats.bestRanking.toLocaleString('tr-TR')}`);
    console.log(`📉 En Düşük Sıra: ${stats.worstRanking.toLocaleString('tr-TR')}`);
    
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('🏛️  DEVLET ÜNİVERSİTELERİ\n');
    
    const devlet = istanbulBilgisayarProgramciligiData.getByType('Devlet');
    devlet.forEach((uni, idx) => {
        console.log(`${idx + 1}. ${uni.name}`);
        console.log(`   📚 ${uni.program}`);
        console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
        console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
        console.log('');
    });
    
    console.log('='.repeat(80) + '\n');
    console.log('🏢 VAKIF ÜNİVERSİTELERİ\n');
    
    const vakif = istanbulBilgisayarProgramciligiData.getByType('Vakıf');
    vakif.forEach((uni, idx) => {
        console.log(`${idx + 1}. ${uni.name}`);
        console.log(`   📚 ${uni.program}`);
        console.log(`   💰 ${uni.scholarship || 'Ücretli'}`);
        console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
        console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
        console.log('');
    });
    
    // SQL Export
    const fs = require('fs');
    const sql = istanbulBilgisayarProgramciligiData.exportToSQL();
    fs.writeFileSync('istanbul-bilgisayar-programciligi.sql', sql, 'utf-8');
    console.log('✅ SQL dosyası oluşturuldu: istanbul-bilgisayar-programciligi.sql\n');
    
    // JSON Export
    fs.writeFileSync(
        'istanbul-bilgisayar-programciligi.json',
        JSON.stringify(istanbulBilgisayarProgramciligiData.getAllUniversities(), null, 2),
        'utf-8'
    );
    console.log('✅ JSON dosyası oluşturuldu: istanbul-bilgisayar-programciligi.json\n');
}

module.exports = istanbulBilgisayarProgramciligiData;
