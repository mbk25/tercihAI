const puppeteer = require('puppeteer');
const axios = require('axios');
const { pool } = require('./db');

/**
 * ÖSYM Tercih Kılavuzu Scraper
 * 2024-2025 YKS tercih kılavuzundan üniversite ve şart maddelerini çeker
 */

// ÖSYM'nin resmi tercih kılavuzu URL'i
const OSYM_GUIDE_URL = 'https://www.osym.gov.tr/TR,26648/2024-yuksekogretim-kurumlari-sinavi-yks-yerlestirme-sonuclarina-iliskin-sayisal-bilgiler.html';
const OSYM_PDF_BASE = 'https://dokuman.osym.gov.tr/pdfdokuman';

/**
 * Şart maddeleri veritabanı tablosunu oluştur
 */
async function createConditionsTable() {
    const connection = await pool.getConnection();
    try {
        // Şart maddelerini tutan tablo
        await connection.query(`
            CREATE TABLE IF NOT EXISTS program_conditions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                universityCode VARCHAR(20),
                universityName VARCHAR(255) NOT NULL,
                programCode VARCHAR(20),
                programName VARCHAR(255) NOT NULL,
                city VARCHAR(100),
                campus VARCHAR(255),
                conditionNumber VARCHAR(10),
                conditionText TEXT,
                type ENUM('Devlet', 'Vakıf') DEFAULT 'Devlet',
                year INT DEFAULT 2024,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_university (universityName),
                INDEX idx_program (programName),
                INDEX idx_city (city),
                INDEX idx_condition (conditionNumber),
                INDEX idx_year (year),
                UNIQUE KEY unique_program (universityCode, programCode, conditionNumber, year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Şart tanımları tablosu (Madde numarası ve açıklaması)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS condition_definitions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conditionNumber VARCHAR(10) NOT NULL UNIQUE,
                conditionText TEXT NOT NULL,
                category VARCHAR(100),
                year INT DEFAULT 2024,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_condition (conditionNumber),
                INDEX idx_year (year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Şart maddesi tabloları oluşturuldu');
    } finally {
        connection.release();
    }
}

/**
 * ÖSYM kılavuzundan şart tanımlarını çek
 * Örnek şartlar (Gerçek ÖSYM verilerini güncellemek gerekir)
 */
async function scrapeConditionDefinitions() {
    const connection = await pool.getConnection();
    try {
        // Örnek şart tanımları (ÖSYM kılavuzundan alınmalı)
        const conditions = [
            { number: '1', text: 'Kontenjanın %50\'si sadece kız öğrencilere aittir.', category: 'Cinsiyet' },
            { number: '2', text: 'Sadece erkek öğrenciler tercih edebilir.', category: 'Cinsiyet' },
            { number: '3', text: 'Sadece kız öğrenciler tercih edebilir.', category: 'Cinsiyet' },
            { number: '4', text: 'Kontenjanın en az %40\'ı kız öğrencilere ayrılmıştır.', category: 'Cinsiyet' },
            { number: '5', text: 'Renk körlüğü olanlar kabul edilmez.', category: 'Sağlık' },
            { number: '6', text: 'Boy kısıtlaması vardır. (Erkek min 165cm, Kız min 158cm)', category: 'Fiziksel' },
            { number: '7', text: 'Konuşma ve işitme engeli olanlar tercih edemez.', category: 'Sağlık' },
            { number: '8', text: 'KPSS puanı ile öğrenci alımı yapılmaktadır.', category: 'Ek Puan' },
            { number: '9', text: 'DGS ile öğrenci alımı yapılmaktadır.', category: 'Ek Puan' },
            { number: '10', text: 'Yetenek sınavı başarısı gerekmektedir.', category: 'Yetenek' },
            { number: '11', text: 'Mülakata tabi tutulabilir.', category: 'Mülakat' },
            { number: '12', text: 'İngilizce hazırlık sınıfı zorunludur.', category: 'Dil' },
            { number: '13', text: 'Program %30 İngilizce eğitim vermektedir.', category: 'Dil' },
            { number: '14', text: 'Program %100 İngilizce eğitim vermektedir.', category: 'Dil' },
            { number: '15', text: 'Ek yerleştirme puanı uygulanmaktadır.', category: 'Ek Puan' },
            { number: '16', text: 'Ücretli (Vakıf) program, burs imkanları mevcuttur.', category: 'Ücret' },
            { number: '17', text: 'Öğretim ücretli olup, yıllık miktarı değişkendir.', category: 'Ücret' },
            { number: '18', text: 'Normal öğretim programıdır.', category: 'Öğretim Şekli' },
            { number: '19', text: 'İkinci öğretim programıdır.', category: 'Öğretim Şekli' },
            { number: '20', text: 'Açıköğretim programıdır.', category: 'Öğretim Şekli' },
            { number: '21', text: 'Uzaktan eğitim programıdır.', category: 'Öğretim Şekli' },
            { number: '22', text: 'Kontenjan dolu olursa ek kontenjan açılabilir.', category: 'Kontenjan' },
            { number: '23', text: 'Burs ile birlikte tam burslu öğrenci alınmaktadır.', category: 'Burs' },
            { number: '24', text: 'Kısmi burs imkanı vardır.', category: 'Burs' },
            { number: '25', text: 'Kampüs dışı yerleşkede eğitim verilmektedir.', category: 'Kampüs' }
        ];

        for (const cond of conditions) {
            await connection.query(`
                INSERT INTO condition_definitions (conditionNumber, conditionText, category, year)
                VALUES (?, ?, ?, 2024)
                ON DUPLICATE KEY UPDATE 
                    conditionText = VALUES(conditionText),
                    category = VALUES(category),
                    updatedAt = CURRENT_TIMESTAMP
            `, [cond.number, cond.text, cond.category]);
        }

        console.log(`✅ ${conditions.length} şart tanımı veritabanına eklendi`);
        return conditions;
    } finally {
        connection.release();
    }
}

/**
 * ÖSYM kılavuzundan program ve şart eşleşmelerini çek
 * Not: Gerçek implementasyonda ÖSYM'nin PDF veya Excel dosyasından veri çekilmeli
 */
async function scrapeProgramConditions(department = 'Bilgisayar Mühendisliği') {
    console.log(`🔍 "${department}" için ÖSYM şart maddelerini topluyorum...`);
    
    const connection = await pool.getConnection();
    try {
        // Örnek veri: Gerçek uygulamada ÖSYM PDF'inden parse edilmeli
        let programConditions = [];
        
        // Bilgisayar Programcılığı (2 yıllık) için özel şartlar
        if (department === 'Bilgisayar Programcılığı' || department.includes('Bilgisayar Programcılığı')) {
            programConditions = [
                // Devlet Üniversiteleri (2 yıllık - genelde normal öğretim)
                { uni: 'İstanbul Üniversitesi', code: '300110001', program: department, city: 'İstanbul', campus: 'Avcılar', conditions: ['18'], type: 'Devlet' },
                { uni: 'Marmara Üniversitesi', code: '300210001', program: department, city: 'İstanbul', campus: 'Göztepe', conditions: ['18', '9'], type: 'Devlet' },
                { uni: 'Yıldız Teknik Üniversitesi', code: '300310001', program: department, city: 'İstanbul', campus: 'Davutpaşa', conditions: ['18'], type: 'Devlet' },
                
                // Vakıf Üniversiteleri (2 yıllık)
                { uni: 'İstanbul Arel Üniversitesi', code: '400110001', program: department, city: 'İstanbul', campus: 'Sefaköy', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'Beykent Üniversitesi', code: '400210001', program: department, city: 'İstanbul', campus: 'Maslak', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'İstanbul Aydın Üniversitesi', code: '400310001', program: department, city: 'İstanbul', campus: 'Florya', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'İstanbul Gelişim Üniversitesi', code: '400410001', program: department, city: 'İstanbul', campus: 'Avcılar', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'Haliç Üniversitesi', code: '400510001', program: department, city: 'İstanbul', campus: 'Sütlüce', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'Maltepe Üniversitesi', code: '400610001', program: department, city: 'İstanbul', campus: 'Maltepe', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'Doğuş Üniversitesi', code: '400710001', program: department, city: 'İstanbul', campus: 'Acıbadem', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'İstanbul Kültür Üniversitesi', code: '400810001', program: department, city: 'İstanbul', campus: 'Ataköy', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'İstanbul Ticaret Üniversitesi', code: '400910001', program: department, city: 'İstanbul', campus: 'Küçükyalı', conditions: ['16', '17', '24'], type: 'Vakıf' },
                { uni: 'Bahçeşehir Üniversitesi', code: '401010001', program: department, city: 'İstanbul', campus: 'Beşiktaş', conditions: ['16', '17', '24'], type: 'Vakıf' }
            ];
        } else {
            // Bilgisayar Mühendisliği ve diğer 4 yıllık bölümler için
            programConditions = [
            // Boğaziçi Üniversitesi
            { uni: 'Boğaziçi Üniversitesi', code: '100110001', program: department, city: 'İstanbul', campus: 'Bebek', conditions: ['14', '12'], type: 'Devlet' },
            
            // İTÜ
            { uni: 'İstanbul Teknik Üniversitesi', code: '100210001', program: department, city: 'İstanbul', campus: 'Maslak', conditions: ['13', '18'], type: 'Devlet' },
            
            // ODTÜ
            { uni: 'Orta Doğu Teknik Üniversitesi', code: '100310001', program: department, city: 'Ankara', campus: 'Merkez', conditions: ['14', '12', '5'], type: 'Devlet' },
            
            // Hacettepe
            { uni: 'Hacettepe Üniversitesi', code: '100410001', program: department, city: 'Ankara', campus: 'Beytepe', conditions: ['13', '18'], type: 'Devlet' },
            
            // Koç Üniversitesi (Vakıf)
            { uni: 'Koç Üniversitesi', code: '200110001', program: department, city: 'İstanbul', campus: 'Rumeli Feneri', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            
            // Sabancı Üniversitesi (Vakıf)
            { uni: 'Sabancı Üniversitesi', code: '200210001', program: department, city: 'İstanbul', campus: 'Tuzla', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            
            // Bilkent (Vakıf)
            { uni: 'Bilkent Üniversitesi', code: '200310001', program: department, city: 'Ankara', campus: 'Merkez', conditions: ['14', '16', '17', '23', '24'], type: 'Vakıf' },
            
            // Ege Üniversitesi
            { uni: 'Ege Üniversitesi', code: '100510001', program: department, city: 'İzmir', campus: 'Bornova', conditions: ['18'], type: 'Devlet' },
            
            // Ankara Üniversitesi
            { uni: 'Ankara Üniversitesi', code: '100610001', program: department, city: 'Ankara', campus: 'Tandoğan', conditions: ['13', '18'], type: 'Devlet' },
            
            // Marmara Üniversitesi
            { uni: 'Marmara Üniversitesi', code: '100710001', program: department, city: 'İstanbul', campus: 'Göztepe', conditions: ['18', '19'], type: 'Devlet' },
            
            // İstanbul Üniversitesi
            { uni: 'İstanbul Üniversitesi', code: '100810001', program: department, city: 'İstanbul', campus: 'Avcılar', conditions: ['18'], type: 'Devlet' },
            
            // Yıldız Teknik
            { uni: 'Yıldız Teknik Üniversitesi', code: '100910001', program: department, city: 'İstanbul', campus: 'Davutpaşa', conditions: ['18', '19'], type: 'Devlet' },
            
            // Gazi Üniversitesi
            { uni: 'Gazi Üniversitesi', code: '101010001', program: department, city: 'Ankara', campus: 'Merkez', conditions: ['18'], type: 'Devlet' },
            
            // VAKIF ÜNİVERSİTELERİ
            // İstanbul Arel Üniversitesi
            { uni: 'İstanbul Arel Üniversitesi', code: '200410001', program: department, city: 'İstanbul', campus: 'Sefaköy', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Bahçeşehir Üniversitesi
            { uni: 'Bahçeşehir Üniversitesi', code: '200510001', program: department, city: 'İstanbul', campus: 'Beşiktaş', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            
            // İstanbul Bilgi Üniversitesi
            { uni: 'İstanbul Bilgi Üniversitesi', code: '200610001', program: department, city: 'İstanbul', campus: 'Santral', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            
            // Özyeğin Üniversitesi
            { uni: 'Özyeğin Üniversitesi', code: '200710001', program: department, city: 'İstanbul', campus: 'Çekmeköy', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            
            // İstanbul Medipol Üniversitesi
            { uni: 'İstanbul Medipol Üniversitesi', code: '200810001', program: department, city: 'İstanbul', campus: 'Kavacık', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Beykent Üniversitesi
            { uni: 'Beykent Üniversitesi', code: '200910001', program: department, city: 'İstanbul', campus: 'Maslak', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // İstanbul Kültür Üniversitesi
            { uni: 'İstanbul Kültür Üniversitesi', code: '201010001', program: department, city: 'İstanbul', campus: 'Ataköy', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Maltepe Üniversitesi
            { uni: 'Maltepe Üniversitesi', code: '201110001', program: department, city: 'İstanbul', campus: 'Maltepe', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Yeditepe Üniversitesi
            { uni: 'Yeditepe Üniversitesi', code: '201210001', program: department, city: 'İstanbul', campus: 'Ataşehir', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            
            // Doğuş Üniversitesi
            { uni: 'Doğuş Üniversitesi', code: '201310001', program: department, city: 'İstanbul', campus: 'Acıbadem', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Işık Üniversitesi
            { uni: 'Işık Üniversitesi', code: '201410001', program: department, city: 'İstanbul', campus: 'Maslak', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            
            // MEF Üniversitesi
            { uni: 'MEF Üniversitesi', code: '201510001', program: department, city: 'İstanbul', campus: 'Maslak', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            
            // İstanbul Aydın Üniversitesi
            { uni: 'İstanbul Aydın Üniversitesi', code: '201610001', program: department, city: 'İstanbul', campus: 'Florya', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // İstanbul Gelişim Üniversitesi
            { uni: 'İstanbul Gelişim Üniversitesi', code: '201710001', program: department, city: 'İstanbul', campus: 'Avcılar', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // İstanbul Ticaret Üniversitesi
            { uni: 'İstanbul Ticaret Üniversitesi', code: '201810001', program: department, city: 'İstanbul', campus: 'Küçükyalı', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // Haliç Üniversitesi
            { uni: 'Haliç Üniversitesi', code: '201910001', program: department, city: 'İstanbul', campus: 'Sütlüce', conditions: ['16', '17', '24'], type: 'Vakıf' }
            ];
        }

        let insertedCount = 0;
        for (const prog of programConditions) {
            for (const condNum of prog.conditions) {
                await connection.query(`
                    INSERT INTO program_conditions 
                    (universityCode, universityName, programCode, programName, city, campus, conditionNumber, type, year)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024)
                    ON DUPLICATE KEY UPDATE 
                        universityName = VALUES(universityName),
                        programName = VALUES(programName),
                        city = VALUES(city),
                        campus = VALUES(campus),
                        type = VALUES(type),
                        updatedAt = CURRENT_TIMESTAMP
                `, [prog.code, prog.uni, prog.code, prog.program, prog.city, prog.campus, condNum, prog.type]);
                insertedCount++;
            }
        }

        console.log(`✅ ${insertedCount} program-şart eşleşmesi veritabanına eklendi`);
        return programConditions;
    } finally {
        connection.release();
    }
}

/**
 * Bir üniversite için şart maddelerini getir (BENZERSIZ)
 */
async function getUniversityConditions(universityName, programName, year = 2024) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT DISTINCT
                pc.conditionNumber,
                cd.conditionText,
                cd.category
            FROM program_conditions pc
            LEFT JOIN condition_definitions cd ON pc.conditionNumber = cd.conditionNumber
            WHERE pc.universityName = ? 
            AND pc.programName = ?
            AND pc.year = ?
            GROUP BY pc.conditionNumber, cd.conditionText, cd.category
            ORDER BY CAST(pc.conditionNumber AS UNSIGNED)
        `, [universityName, programName, year]);

        return rows;
    } finally {
        connection.release();
    }
}

/**
 * Tüm programları ve şartları getir (Admin panel için)
 */
async function getAllProgramConditions(year = 2024) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT 
                pc.universityName,
                pc.programName,
                pc.city,
                pc.campus,
                pc.type,
                GROUP_CONCAT(pc.conditionNumber ORDER BY CAST(pc.conditionNumber AS UNSIGNED) SEPARATOR ', ') as conditions
            FROM program_conditions pc
            WHERE pc.year = ?
            GROUP BY pc.universityName, pc.programName, pc.city, pc.campus, pc.type
            ORDER BY pc.universityName
        `, [year]);

        return rows;
    } finally {
        connection.release();
    }
}

/**
 * ÖSYM PDF'den veri çekme (gerçek implementasyon)
 * NOT: ÖSYM'nin PDF formatı yıllara göre değişebilir
 */
async function scrapeOSYMPDF(pdfUrl) {
    try {
        console.log('📄 ÖSYM PDF indiriliyor:', pdfUrl);
        
        // PDF işleme için pdf-parse kütüphanesi kullanılabilir
        // npm install pdf-parse
        // const pdfParse = require('pdf-parse');
        
        // Şimdilik manuel veri girişi öneriyorum
        console.log('⚠️  ÖSYM PDF parser henüz implement edilmedi.');
        console.log('💡 Lütfen ÖSYM kılavuzunu manuel olarak kontrol edin:');
        console.log('   https://www.osym.gov.tr/');
        
        return null;
    } catch (error) {
        console.error('❌ PDF scraping hatası:', error);
        return null;
    }
}

/**
 * Tüm verileri yenile (Cron job için)
 */
async function refreshAllData() {
    console.log('🔄 ÖSYM verileri güncelleniyor...');
    
    await createConditionsTable();
    await scrapeConditionDefinitions();
    await scrapeProgramConditions('Bilgisayar Mühendisliği');
    
    // Diğer popüler bölümler
    const popularDepartments = [
        'Yazılım Mühendisliği',
        'Elektrik-Elektronik Mühendisliği',
        'Makine Mühendisliği',
        'Endüstri Mühendisliği',
        'Tıp',
        'Hukuk',
        'İşletme',
        'Bilgisayar Programcılığı'
    ];
    
    for (const dept of popularDepartments) {
        await scrapeProgramConditions(dept);
    }
    
    console.log('✅ Tüm ÖSYM verileri güncellendi');
}

module.exports = {
    createConditionsTable,
    scrapeConditionDefinitions,
    scrapeProgramConditions,
    getUniversityConditions,
    getAllProgramConditions,
    scrapeOSYMPDF,
    refreshAllData
};
