const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool, testConnection, initDatabase } = require('./db');
const { scrapeYokAtlasReal, scrapeYokAtlasSimple, generateMockData } = require('./yokAtlasScraper');
const { connectMongoDB, University, User, Analysis, ChatHistory } = require('./mongodb');
const { chatWithAI, analyzeDepartment } = require('./openai-service');
const { chatWithGemini, analyzeDepartmentWithGemini } = require('./gemini-service');
const { chatWithGroq, analyzeDepartmentWithGroq } = require('./groq-service');
const { findSmartAlternatives, generateStrategy, formatForAI } = require('./smart-alternatives');
const { getUniversityConditions, createConditionsTable, refreshAllData } = require('./osym-guide-scraper');
const { createSpreadsheet, appendToSpreadsheet } = require('./google-sheets-service');
const { getTuitionInfo, formatTuitionInfoHTML } = require('./vakif-ucret-scraper');
require('dotenv').config();

// AI Provider seçimi (Groq en hızlı ve ücretsiz, Gemini ücretsiz ama yavaş, OpenAI ücretli)
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';

// MongoDB artık kullanılmıyor - sadece MySQL yeterli!
// YÖK Atlas verileri yılda 1 kez değişiyor, buluta gerek yok ✅
let useMongoDBFlag = false;
console.log('📊 Tüm veriler MySQL\'de saklanacak (YÖK verileri nadiren değişiyor)');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static('../public'));
app.use('/admin', express.static('../admin'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'tercih-ai-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Geçersiz token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    next();
};

// Passport Google OAuth Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const connection = await pool.getConnection();

        // Kullanıcıyı ara
        const [users] = await connection.query(
            'SELECT * FROM users WHERE googleId = ?',
            [profile.id]
        );

        let user;
        if (users.length > 0) {
            user = users[0];
        } else {
            // Yeni kullanıcı oluştur
            const [result] = await connection.query(
                'INSERT INTO users (googleId, email, name, picture, role) VALUES (?, ?, ?, ?, ?)',
                [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value, 'user']
            );
            user = {
                id: result.insertId,
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                picture: profile.photos[0]?.value,
                role: 'user'
            };
        }

        connection.release();
        return done(null, user);
    } catch (error) {
        console.error('Google OAuth hatası:', error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// Bölüm isim eşleştirme - YÖK'te farklı yazılmış olabilir
function normalizeDepName(dept) {
    const mapping = {
        'Bilgisayar ve Öğretim Teknolojileri': 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği',
        'Bilgisayar Teknolojisi': 'Bilgisayar Teknolojileri',
        'Web Tasarım ve Kodlama': 'Web Tasarım ve Kodlama',
        'Yönetim Bilişim Sistemleri': 'Yönetim Bilişim Sistemleri'
    };
    return mapping[dept] || dept;
}

// YÖK Atlas Scraper - Sadece MySQL (veriler yılda 1 kez değişiyor)
async function scrapeYokAtlas(department, year = 2024) {
    const normalizedDept = normalizeDepName(department);
    console.log(`🔍 YÖK Atlas veri çekiliyor: "${department}" → "${normalizedDept}" (${year})`);

    try {
        // MySQL'den kontrol et - önce tam eşleşme
        const connection = await pool.getConnection();
        let [dbData] = await connection.query(
            'SELECT * FROM universities WHERE department = ? AND year = ? ORDER BY COALESCE(ranking, 999999) DESC',
            [normalizedDept, year]
        );

        // Eğer bulunamazsa, LIKE ile ara
        if (dbData.length === 0) {
            [dbData] = await connection.query(
                'SELECT * FROM universities WHERE department LIKE ? AND year = ? ORDER BY COALESCE(ranking, 999999) DESC',
                [`%${department}%`, year]
            );
            if (dbData.length > 0) {
                console.log(`ℹ️ LIKE ile ${dbData.length} sonuç bulundu (arama: "%${department}%")`);
            }
        }

        connection.release();

        if (dbData.length > 0) {
            console.log(`✅ Veritabanından ${dbData.length} üniversite verisi alındı`);
            return dbData;
        }

        console.log(`⚠️ Veritabanında "${department}" bulunamadı, scraping başlıyor...`);

        // Veritabanında yoksa scraping yap
        let data = await scrapeYokAtlasSimple(department, year);

        if (!data || data.length === 0) {
            console.log(`⚙️ "${department}" için Puppeteer ile deneniyor...`);
            data = await scrapeYokAtlasReal(department, year);
        }

        if (!data || data.length === 0) {
            console.log(`❌ "${department}" için gerçek veri bulunamadı, mock data kullanılıyor`);
            data = generateMockData(department, year);
        }

        // MySQL'e kaydet
        if (data && data.length > 0) {
            const conn = await pool.getConnection();
            for (const uni of data) {
                await conn.query(
                    'INSERT IGNORE INTO universities (name, city, department, campus, ranking, quota, type, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [uni.name, uni.city, uni.department, uni.campus, uni.ranking, uni.quota, uni.type || 'Devlet', uni.year]
                );
            }
            conn.release();
            console.log(`✅ ${data.length} üniversite veritabanına kaydedildi`);
        }

        return data;
    } catch (error) {
        console.error('❌ Scraping hatası:', error.message);
        return generateMockData(department, year);
    }
}

// 🎯 YENİ: Akıllı Öneri Sistemi - YÖK verilerine dayalı
app.post('/api/recommendations', async (req, res) => {
    try {
        const { aytRanking, tytRanking, dreamDept, city, educationType } = req.body;

        console.log('🎯 Öneri sistemi başladı:', { aytRanking, tytRanking, dreamDept, city, educationType });

        if ((!aytRanking && !tytRanking) || !dreamDept) {
            return res.status(400).json({ error: 'Sıralama ve bölüm bilgisi gerekli' });
        }

        // 1️⃣ YÖK Atlas'tan hedef bölüm verilerini çek
        const allDeptUnis = await scrapeYokAtlas(dreamDept, 2024);
        console.log(`📚 "${dreamDept}" için ${allDeptUnis.length} üniversite bulundu`);

        // 2️⃣ Şehir ve eğitim türü filtresi uygula
        let filteredUnis = allDeptUnis;
        if (city && city.length > 0) {
            const selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
            filteredUnis = filteredUnis.filter(uni => {
                if (!uni.city) return false;
                const uniCity = uni.city.toLocaleLowerCase('tr-TR');
                return selectedCities.some(sc => uniCity.includes(sc) || uniCity.includes(sc.replace('i', 'İ')));
            });
        }
        if (educationType && educationType !== 'Tümü') {
            filteredUnis = filteredUnis.filter(uni => uni.type === educationType);
        }

        console.log(`🔍 Filtre sonrası: ${filteredUnis.length} üniversite (Şehir: ${city}, Tür: ${educationType})`);

        if (filteredUnis.length === 0) {
            console.log(`⚠️  UYARI: Filtre sonrası 0 üniversite kaldı!`);
            console.log(`   Toplam üniversite: ${allDeptUnis.length}`);
            console.log(`   Şehir filtresi: ${city}`);
            console.log(`   Eğitim türü filtresi: ${educationType}`);
            if (allDeptUnis.length > 0) {
                console.log(`   İlk 3 üniversite city değerleri:`);
                allDeptUnis.slice(0, 3).forEach(u => {
                    console.log(`      - ${u.name}: city="${u.city}"`);
                });
            }
        }

        // 3️⃣ Sıralama kontrolü (2 yıllık -> TYT, 4 yıllık -> AYT)
        // Taban sıralama: O programa girebilmek için EN KÖTÜ sıralama
        // Kullanıcı sıralaması <= Üniversite taban sıralaması ise GİREBİLİR
        // Örnek: Kullanıcı 300k, Üni taban 350k -> 300000 <= 350000 = GİREBİLİR ✅

        // 2 yıllık programlar listesi
        const twoYearPrograms = [
            'Bilgisayar Programcılığı', 'Bilgisayar Teknolojisi', 'Web Tasarım ve Kodlama',
            'Muhasebe ve Vergi Uygulamaları', 'İşletme Yönetimi', 'Büro Yönetimi ve Yönetici Asistanlığı',
            'Dış Ticaret', 'Turizm ve Otel İşletmeciliği', 'Pazarlama',
            'Tıbbi Laboratuvar Teknikleri', 'Tıbbi Görüntüleme Teknikleri', 'Anestezi', 'İlk ve Acil Yardım'
        ];

        const is2Year = twoYearPrograms.some(prog =>
            dreamDept.toLowerCase().includes(prog.toLowerCase())
        );

        const userRanking = is2Year ? tytRanking : aytRanking;
        const rankingType = is2Year ? 'TYT' : 'AYT';

        console.log(`📐 Program türü: ${is2Year ? '2 Yıllık (Ön Lisans)' : '4 Yıllık (Lisans)'}`);
        console.log(`📊 Kullanılan sıralama: ${rankingType} = ${userRanking}`);

        const eligibleUnis = filteredUnis.filter(uni => {
            const uniRank = uni.ranking || uni.minRanking || 0;
            const eligible = uniRank > 0 && userRanking <= uniRank;
            if (eligible) {
                console.log(`✅ Girebilir: ${uni.name} (${uni.city}) - Üni taban: ${uniRank}, Kullanıcı ${rankingType}: ${userRanking}`);
            }
            return eligible;
        });

        console.log(`🎯 Toplam ${eligibleUnis.length} üniversiteye girebilir`);

        let result;

        if (eligibleUnis.length > 0) {
            // ✅ Birincil Öneriler: Hedef bölüme girebilir
            result = {
                status: 'eligible',
                message: `🎉 ${dreamDept} programına girebilirsiniz!`,
                primary: {
                    department: dreamDept,
                    universities: eligibleUnis.map(u => ({
                        name: u.name,
                        city: u.city,
                        campus: u.campus,
                        type: u.type,
                        ranking: u.ranking || u.minRanking,
                        quota: u.quota,
                        riskLevel: calculateRisk(aytRanking, u.ranking || u.minRanking)
                    })),
                    summary: {
                        total: eligibleUnis.length,
                        devlet: eligibleUnis.filter(u => u.type === 'Devlet').length,
                        vakif: eligibleUnis.filter(u => u.type === 'Vakıf').length
                    }
                }
            };
        } else {
            // ❌ Alternatif Öneriler: Hedef bölüme yetmiyor

            // 4️⃣ Alternatif 4 yıllık bölümler bul (AYT bazlı)
            const alternatives4y = await findAlternatives(dreamDept, aytRanking, tytRanking);
            const alt4yWithData = await Promise.all(
                alternatives4y
                    .filter(a => a.type === '4 Yıllık')
                    .map(async (alt) => {
                        const altUnis = await scrapeYokAtlas(alt.dept, 2024);
                        let eligible = altUnis.filter(u => {
                            const uniRank = u.ranking || u.minRanking || 0;
                            return uniRank > 0 && aytRanking <= uniRank;
                        });

                        if (city) {
                            const selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
                            eligible = eligible.filter(u =>
                                selectedCities.some(sc => u.city.toLocaleLowerCase('tr-TR').includes(sc))
                            );
                        }
                        if (educationType && educationType !== 'Tümü') {
                            eligible = eligible.filter(u => u.type === educationType);
                        }

                        return {
                            department: alt.dept,
                            description: alt.description,
                            threshold: alt.threshold,
                            universities: eligible.slice(0, 10).map(u => ({
                                name: u.name,
                                city: u.city,
                                type: u.type,
                                ranking: u.ranking || u.minRanking,
                                quota: u.quota
                            })),
                            count: eligible.length
                        };
                    })
            );

            // 5️⃣ 2 yıllık programlar + DGS (TYT bazlı)
            const alternatives2y = await Promise.all(
                alternatives4y
                    .filter(a => a.type === '2 Yıllık' && a.dgs)
                    .map(async (alt) => {
                        const altUnis = await scrapeYokAtlas(alt.dept, 2024);
                        let eligible = altUnis.filter(u => {
                            const uniRank = u.ranking || u.minRanking || 0;
                            return uniRank > 0 && tytRanking <= uniRank;
                        });

                        if (city) {
                            const selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
                            eligible = eligible.filter(u =>
                                selectedCities.some(sc => u.city.toLocaleLowerCase('tr-TR').includes(sc))
                            );
                        }

                        return {
                            department: alt.dept,
                            description: alt.description,
                            dgsTarget: `${dreamDept} ve benzer 4 yıllık programlar`,
                            universities: eligible.slice(0, 8).map(u => ({
                                name: u.name,
                                city: u.city,
                                ranking: u.ranking || u.minRanking,
                                quota: u.quota
                            })),
                            count: eligible.length
                        };
                    })
            );

            result = {
                status: 'alternatives',
                message: `${dreamDept} için sıralamanız yeterli değil, ancak alternatifleriniz var!`,
                alternative4y: alt4yWithData.filter(a => a.count > 0),
                alternative2y: alternatives2y.filter(a => a.count > 0),
                dgsInfo: {
                    description: "2 yıllık ön lisans programından mezun olduktan sonra DGS sınavı ile 4 yıllık lisans programlarına geçiş yapabilirsiniz.",
                    advantages: [
                        "Sektöre 2 yıl erken başlayarak deneyim kazanırsınız",
                        "Çalışırken öğrenme fırsatı",
                        "DGS ile hedef bölüme ikinci şans",
                        "Daha düşük maliyetle eğitime başlama"
                    ]
                }
            };
        }

        console.log('✅ Öneri sistemi tamamlandı');
        res.json(result);

    } catch (error) {
        console.error('❌ Öneri sistemi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Risk seviyesi hesapla
function calculateRisk(userRank, uniRank) {
    const diff = userRank - uniRank;
    if (diff < 5000) return { level: 'high', label: '🔴 Riskli', description: 'Çok yakın sıralama, alternatif tercihlere ağırlık verin' };
    if (diff < 20000) return { level: 'medium', label: '🟡 Orta', description: 'Makul şans, birkaç tercih yapabilirsiniz' };
    return { level: 'low', label: '🟢 Güvenli', description: 'Yüksek kabul şansı' };
}

// Chat endpoint - OpenAI GPT ile akıllı yanıtlar
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;

        console.log('📩 Chat mesajı:', message);

        // OpenAI GPT ile yanıt oluştur
        const response = await generateAIResponse(message, conversationHistory || []);

        // Sohbeti MySQL'e kaydet
        if (req.user && req.user.id) {
            try {
                const connection = await pool.getConnection();
                await connection.query(
                    'INSERT INTO chat_history (userId, sessionId, message, role) VALUES (?, ?, ?, ?)',
                    [req.user.id, req.body.sessionId || 'default', message, 'user']
                );
                await connection.query(
                    'INSERT INTO chat_history (userId, sessionId, message, role) VALUES (?, ?, ?, ?)',
                    [req.user.id, req.body.sessionId || 'default', response.text, 'assistant']
                );
                connection.release();
                console.log('✅ Chat MySQL\'e kaydedildi');
            } catch (sqlErr) {
                console.log('⚠️ MySQL kayıt hatası:', sqlErr.message);
            }
        }

        res.json({ response });
    } catch (error) {
        console.error('❌ Chat hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

async function generateAIResponse(message, history) {
    try {
        const lowerMessage = message.toLowerCase();

        // 1️⃣ Bölüm bilgisi sorgusu kontrolü
        const deptInfoKeywords = ['hakkında', 'nedir', 'ne yapar', 'dersleri', 'ders içeriği', 'kariyer', 'iş imkanları', 'mezun'];
        const isDeptInfoQuery = deptInfoKeywords.some(keyword => lowerMessage.includes(keyword));

        // 1️⃣ Bölüm adı kontrolü ve YÖK verilerini topla
        const departments = [
            "Bilgisayar Programcılığı", "Web Tasarım ve Kodlama", "Bilgisayar Teknolojileri",
            "Bilgisayar Mühendisliği", "Makine Mühendisliği", "Tıp", "Hukuk",
            "İşletme", "Elektrik-Elektronik Mühendisliği", "Mimarlık", "Psikoloji",
            "Yazılım Mühendisliği", "Endüstri Mühendisliği", "İnşaat Mühendisliği"
        ];

        let yokData = '';
        let detectedDept = null;
        let departmentInfo = '';

        for (let dept of departments) {
            if (lowerMessage.includes(dept.toLowerCase())) {
                detectedDept = dept;
                console.log(`🔍 "${dept}" için bilgiler çekiliyor...`);

                // Eğer bölüm hakkında genel bilgi soruyorsa, YÖK verisi çekme
                if (isDeptInfoQuery) {
                    console.log(`📚 "${dept}" hakkında genel bilgi isteniyor...`);

                    // Veritabanından bölüm bilgilerini çek
                    try {
                        const [rows] = await pool.query(
                            'SELECT * FROM universities WHERE department LIKE ? LIMIT 15',
                            [`%${dept}%`]
                        );

                        if (rows.length > 0) {
                            departmentInfo = `\n\n📊 ${dept} Bölümü - Veritabanı Bilgileri:\n\n`;
                            departmentInfo += `✅ ${rows.length} üniversitede bu program bulunuyor.\n`;
                            departmentInfo += `🏛️ Devlet: ${rows.filter(r => r.type === 'Devlet').length} program\n`;
                            departmentInfo += `🏛️ Vakıf: ${rows.filter(r => r.type === 'Vakıf').length} program\n\n`;
                            departmentInfo += `📍 Örnek Üniversiteler:\n`;
                            rows.slice(0, 5).forEach((uni, idx) => {
                                departmentInfo += `${idx + 1}. ${uni.name} (${uni.city}) - ${uni.type}\n`;
                            });
                        }
                    } catch (dbErr) {
                        console.log('⚠️ Veritabanı sorgu hatası:', dbErr.message);
                    }
                } else {
                    // Normal tercih analizi için YÖK verisi çek
                    const data = await scrapeYokAtlas(dept, 2024);
                    const top10 = data.slice(0, 10);

                    yokData = `\n\n📊 ${dept} - 2024 YÖK Atlas Verileri (Güncel):\n\n`;
                    top10.forEach((uni, index) => {
                        yokData += `${index + 1}. ${uni.name}\n   📍 Şehir: ${uni.city}\n   🏫 Kampüs: ${uni.campus}\n   🎯 Son Sıralama: ${(uni.ranking || uni.minRanking)?.toLocaleString() || 'N/A'}\n   👥 Kontenjan: ${uni.quota}\n   🏛️ Tür: ${uni.type || 'Devlet'}\n\n`;
                    });
                    yokData += `Toplam ${data.length} üniversitede ${dept} programı bulunuyor.\n`;
                }
                break;
            }
        }

        // 2️⃣ AI'a prompt gönder (YÖK verileriyle birlikte)
        let enrichedMessage = message;
        if (departmentInfo) {
            // Bölüm hakkında genel bilgi isteniyor
            enrichedMessage = `Kullanıcı Sorusu: ${message}\n\nVeritabanından Çekilen Veriler:${departmentInfo}\n\nLütfen kullanıcıya ${detectedDept} bölümü hakkında detaylı bilgi ver. Şunları açıkla:\n1. Bölüm ne yapar, eğitim içeriği nedir?\n2. Hangi dersler vardır?\n3. Mezunlar ne iş yapar, kariyer olanakları nelerdir?\n4. Hangi sektörlerde çalışabilirler?\n5. Ortalama maaş beklentisi nedir?\n\nYukarıdaki üniversite sayısı bilgilerini de kullan.`;
        } else if (yokData) {
            // Normal tercih analizi
            enrichedMessage = `Kullanıcı Sorusu: ${message}\n\nYÖK Atlas'tan Çekilen Gerçek Veriler:${yokData}\n\nLütfen yukarıdaki GERÇEK YÖK Atlas verilerini kullanarak kullanıcıya detaylı, doğru ve güncel bilgi ver.`;
        }

        let aiResponse;
        if (AI_PROVIDER === 'groq') {
            aiResponse = await chatWithGroq(enrichedMessage, history);
        } else if (AI_PROVIDER === 'gemini') {
            aiResponse = await chatWithGemini(enrichedMessage, history);
        } else {
            aiResponse = await chatWithAI(enrichedMessage, history);
        }

        console.log(`✅ AI yanıt oluşturuldu (${AI_PROVIDER})`);
        return aiResponse;

    } catch (error) {
        console.error('❌ AI yanıt hatası:', error.message);

        // Fallback: YÖK verilerini manuel kontrol et
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
            return {
                text: "Merhaba! 👋 Ben TercihAI, sizin akıllı üniversite tercih danışmanınızım. YÖK Atlas verilerini kullanarak size en güncel ve doğru bilgileri sunuyorum. Size nasıl yardımcı olabilirim?",
                suggestions: [
                    "Tercih analizi yapmak istiyorum",
                    "Bilgisayar Mühendisliği sıralamaları",
                    "Bölüm karşılaştır"
                ],
                source: 'fallback'
            };
        }

        if (lowerMessage.includes('tercih') || lowerMessage.includes('analiz')) {
            return {
                text: "🎯 YÖK verilerine dayalı tercih analizi için bilgilerinizi paylaşın:\n\n1️⃣ AYT/TYT sıralamanız\n2️⃣ Hedef bölüm\n3️⃣ Tercih ettiğiniz şehirler\n4️⃣ Eğitim türü tercihi (Devlet/Vakıf)\n\nGerçek YÖK verileriyle size özel analiz yapacağım!",
                suggestions: ["Sıralamamı analiz et", "Bölüm önerisi iste"],
                source: 'fallback'
            };
        }

        // Bölüm bazlı YÖK verisi göster (fallback)
        const departments = [
            "Bilgisayar Mühendisliği", "Makine Mühendisliği", "Tıp", "Hukuk",
            "İşletme", "Elektrik-Elektronik Mühendisliği", "Mimarlık", "Psikoloji"
        ];

        for (let dept of departments) {
            if (lowerMessage.includes(dept.toLowerCase())) {
                const data = await scrapeYokAtlas(dept, 2024);
                const top8 = data.slice(0, 8);

                let text = `📊 ${dept} - 2024 YÖK Atlas Güncel Verileri:\n\n`;
                top8.forEach((uni, index) => {
                    text += `${index + 1}. ${uni.name} (${uni.type || 'Devlet'})\n   📍 ${uni.city} - ${uni.campus}\n   🎯 Sıralama: ${(uni.ranking || uni.minRanking)?.toLocaleString() || 'N/A'}\n   👥 Kontenjan: ${uni.quota}\n\n`;
                });
                text += `\nToplam ${data.length} üniversitede ${dept} var. Daha fazla bilgi için "Detaylı analiz yap" deyin.`;

                return {
                    text: text,
                    suggestions: ["Detaylı analiz yap", "Alternatif bölümler", "Tercih stratejisi"],
                    source: 'yokatlas-fallback'
                };
            }
        }

        return {
            text: "Size YÖK Atlas verilerinden yararlanarak yardımcı olabilirim! 😊\n\n• Tercih analizi (gerçek sıralamalarla)\n• Bölüm karşılaştırması\n• Üniversite önerileri\n\nHangi bölümle ilgileniyorsunuz?",
            suggestions: [
                "Bilgisayar Mühendisliği",
                "Tıp Fakültesi",
                "İşletme",
                "Hukuk"
            ],
            source: 'fallback'
        };
    }
}

// 🎯 TERCIH ROBOTU - Ana Analiz Endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { ranking, aytRanking, tytRanking, gender, dreamDept, city, currentLocation, educationType } = req.body;

        // TYT ve AYT sıralamalarını belirle
        const aytRank = aytRanking || ranking; // 4 yıllık için
        const tytRank = tytRanking || ranking; // 2 yıllık için

        console.log('🤖 Tercih Robotu Analizi Başladı:', {
            aytRanking: aytRank,
            tytRanking: tytRank,
            gender,
            dreamDept,
            city,
            educationType
        });

        if ((!aytRank && !tytRank) || !dreamDept) {
            return res.status(400).json({ error: 'Sıralama ve bölüm bilgisi gerekli' });
        }

        // ⚠️ Ebelik Bölümü Cinsiyet Kontrolü
        if (dreamDept.toLowerCase().includes('ebelik') && gender === 'Erkek') {
            console.log('⚠️ Erkek öğrenci Ebelik bölümü seçti - Uyarı mesajı gönderiliyor');

            return res.json({
                isEligible: false,
                status: 'gender_restriction',
                message: '⚠️ Ebelik Bölümü Hakkında Önemli Bilgi',
                warning: {
                    title: 'Ebelik Bölümü Cinsiyet Kısıtlaması',
                    description: 'Türkiye\'de Ebelik bölümü, mevcut mevzuat gereği sadece kadın öğrenciler tarafından tercih edilebilmektedir. Erkek öğrenciler bu bölüme başvuru yapamazlar.',
                    reason: 'Bu kısıtlama, ebelik mesleğinin tanımı ve uygulama alanları göz önünde bulundurularak Yükseköğretim Kurulu (YÖK) ve Sağlık Bakanlığı tarafından belirlenen yasal düzenlemelere dayanmaktadır.'
                },
                alternatives: {
                    title: 'Size Önerebileceğimiz Alternatif Sağlık Bilimleri Bölümleri:',
                    departments: [
                        {
                            name: 'Hemşirelik',
                            description: 'Sağlık hizmetlerinin temel taşlarından biri. Hem erkek hem kadın öğrenciler tercih edebilir.',
                            icon: '👨‍⚕️'
                        },
                        {
                            name: 'Fizyoterapi ve Rehabilitasyon',
                            description: 'Hareket ve fonksiyon bozukluklarının tedavisi. Yüksek istihdam oranı.',
                            icon: '🏥'
                        },
                        {
                            name: 'Anestezi',
                            description: 'Önlisans programı. Ameliyathane ve anestezi hizmetleri.',
                            icon: '💉'
                        },
                        {
                            name: 'Tıbbi Laboratuvar Teknikleri',
                            description: 'Önlisans programı. Laboratuvar analizleri ve teşhis.',
                            icon: '🔬'
                        },
                        {
                            name: 'Acil Yardım ve Afet Yönetimi',
                            description: 'Önlisans programı. Ambulans ve acil sağlık hizmetleri.',
                            icon: '🚑'
                        }
                    ]
                },
                recommendation: `📋 **Tercih Önerimiz:**\n\nSağlık sektöründe kariyer yapmak istiyorsanız, yukarıdaki alternatif bölümlerden birini tercih edebilirsiniz. Özellikle Hemşirelik, erkek öğrenciler için de açık olan ve sağlık sektöründe geniş istihdam imkanları sunan bir bölümdür.\n\n💡 **İpucu:** Sıralamanız (TYT: ${tytRank.toLocaleString('tr-TR')}, AYT: ${aytRank.toLocaleString('tr-TR')}) ile bu bölümlerden hangilerine girebileceğinizi analiz edebiliriz. Lütfen alternatif bir bölüm seçip tekrar deneyin.`
            });
        }

        // 1️⃣ YÖK Atlas'tan GÜNCEL veri çek (4 yıllık)
        const allUniversities = await scrapeYokAtlas(dreamDept, 2024);
        console.log(`✅ ${allUniversities.length} üniversite verisi YÖK Atlas'tan alındı`);

        // 2️⃣ Seçilen şehirlere göre filtrele
        let universities = allUniversities;
        let selectedCities = [];
        if (city && city.length > 0 && city.toLowerCase() !== 'fark etmez' && city.toLowerCase() !== 'farketmez') {
            selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
            console.log(`🔍 Kullanıcının tercih ettiği şehirler: "${city}"`);
            console.log(`🔍 Normalize edilmiş şehirler:`, selectedCities);
            universities = allUniversities.filter(uni =>
                selectedCities.some(selectedCity =>
                    uni.city.toLocaleLowerCase('tr-TR').includes(selectedCity)
                )
            );
            console.log(`🏙️ ${selectedCities.join(', ')} şehirlerinde ${universities.length} ${dreamDept} programı bulundu`);
        } else if (city) {
            console.log(`ℹ️ Şehir filtresi atlandı: "${city}"`);
        }

        // 2.5️⃣ Eğitim türüne göre filtrele (Devlet/Vakıf)
        if (educationType && educationType !== 'Tümü') {
            universities = universities.filter(uni => uni.type === educationType);
            console.log(`🏫 ${educationType} üniversiteleri filtrelendi: ${universities.length} üniversite`);
        }

        // 3️⃣ Sıralama kontrolü (4 yıllık için AYT, 2 yıllık için TYT)
        // 2 yıllık programlar: Bilgisayar Programcılığı, Web Tasarım, Muhasebe, vb.
        const is2Year = dreamDept.includes('Programcılığı') || dreamDept.includes('Web Tasarım') ||
            dreamDept.includes('Muhasebe') || dreamDept.includes('Turizm ve Otel') ||
            dreamDept.includes('İşletme Yönetimi') || dreamDept.includes('Teknolojisi');

        const rankToUse = is2Year ? tytRank : aytRank;
        console.log(`📊 ${is2Year ? '2 yıllık' : '4 yıllık'} program - Kullanılan sıralama: ${rankToUse.toLocaleString()}`);

        // DOĞRU MANTIK: Kullanıcı sıralaması <= Üniversite tabanı (düşük sıralama = daha iyi)
        // Örnek: Kullanıcı 10,000 -> 50,000 taban olan üniversiteye girebilir
        // Örnek: Kullanıcı 400,000 -> 50,000 taban olan üniversiteye giremez
        const filteredUniversities = universities.filter(uni => {
            const uniRank = uni.ranking || uni.minRanking;
            return uniRank && rankToUse <= uniRank;
        });
        console.log(`   ✅ ${filteredUniversities.length} üniversiteye sıralama yetiyor`);

        // 4️⃣ Tekrar eden üniversiteleri kaldır (benzersiz yapma)
        const uniqueUniversities = [];
        const seenUniversities = new Set();

        for (const uni of filteredUniversities) {
            // Üniversite adı + şehir + kampüs kombinasyonunu kullan
            const uniqueKey = `${uni.name}-${uni.city}-${uni.campus || 'Merkez'}`.toLowerCase();
            if (!seenUniversities.has(uniqueKey)) {
                seenUniversities.add(uniqueKey);
                uniqueUniversities.push(uni);
            }
        }

        // Şartları ekle
        const eligibleUniversitiesWithConditions = await Promise.all(uniqueUniversities.map(async (uni) => {
            try {
                const conditions = await getUniversityConditions(uni.name, dreamDept);
                return {
                    ...uni,
                    conditions: conditions.map(c => c.conditionText),
                    conditionNumbers: conditions.map(c => c.conditionNumber).join(',')
                };
            } catch (err) {
                console.error(`Error fetching conditions for ${uni.name}:`, err);
                return uni;
            }
        }));

        const eligibleUniversities = eligibleUniversitiesWithConditions;
        const isEligible = eligibleUniversities.length > 0;

        let results;

        if (isEligible) {
            // ✅ YETİYOR - Hayalindeki bölüme girebilir
            console.log(`✅ ${gender === 'kız' ? 'Öğrenci' : 'Öğrenci'} ${dreamDept}'ne GİREBİLİR!`);

            // Devlet/Vakıf ayırımı
            const devletUnis = eligibleUniversities.filter(u => u.type === 'Devlet');
            const vakifUnis = eligibleUniversities.filter(u => u.type === 'Vakıf');

            // AI ile profesyonel eğitim danışmanlığı önerisi
            const aiPrompt = `Sen deneyimli bir eğitim danışmanı ve üniversite tercih uzmanısınız. Türkiye'deki YÖK sistemi, üniversite programları ve kariyer planlama konusunda derin uzmanlığa sahipsiniz.

📋 ÖĞRENCİ PROFİLİ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• AYT Sıralaması: ${aytRank.toLocaleString()} (4 yıllık programlar)
• TYT Sıralaması: ${tytRank.toLocaleString()} (2 yıllık programlar)
• Cinsiyet: ${gender}
• Hedef Bölüm: ${dreamDept}
• Tercih Edilen Şehirler: ${city || 'Tüm Türkiye'}
• Bulunduğu Konum: ${currentLocation || 'Belirtilmedi'}
• Eğitim Tercihi: ${educationType || 'Devlet + Vakıf'}

✅ DOĞRULAMA SONUCU: ÖĞRENCİ ${dreamDept.toUpperCase()} PROGRAMINA GİREBİLİR!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 UYGUN ÜNİVERSİTE ANALİZİ:
Toplam ${eligibleUniversities.length} üniversite seçeneği tespit edildi.

🏛️ DEVLET ÜNİVERSİTELERİ (${devletUnis.length} adet):
${devletUnis.slice(0, 10).map((u, i) => {
                const userRank = aytRank;
                const uniRank = u.ranking || u.minRanking || 0;
                const diff = userRank - uniRank;
                const riskLevel = diff < 5000 ? '🔴 Riskli' : diff < 20000 ? '🟡 Orta Risk' : '🟢 Güvenli';
                return `${i + 1}. ${u.name} - ${u.city}
   Taban: ${uniRank.toLocaleString()} | Sizin: ${userRank.toLocaleString()} | ${riskLevel}
   Kampüs: ${u.campus || 'Merkez'}`;
            }).join('\n\n')}

💼 VAKIF/ÖZEL ÜNİVERSİTELERİ (${vakifUnis.length} adet):
${vakifUnis.slice(0, 5).map((u, i) => {
                const userRank = aytRank;
                const uniRank = u.ranking || u.minRanking || 0;
                const diff = userRank - uniRank;
                const riskLevel = diff < 5000 ? '🔴 Riskli' : diff < 20000 ? '🟡 Orta Risk' : '🟢 Güvenli';
                return `${i + 1}. ${u.name} - ${u.city}
   Taban: ${uniRank.toLocaleString()} | Sizin: ${userRank.toLocaleString()} | ${riskLevel}
   Kampüs: ${u.campus || 'Merkez'}`;
            }).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DANIŞMANLIK TALEBİ:

Lütfen aşağıdaki başlıkları detaylı şekilde ele alın:

1. 🎉 TEBRİK VE MOTİVASYON
   - Başarılarını kutlayın ve güven verin
   - Bu başarının önemi ve değeri

2. 📍 TERCİH STRATEJİSİ (ÇOK ÖNEMLİ!)
   - Güvenli seçenekler (20.000+ fark): Hangi üniversiteler kesin garanti?
   - Orta risk seçenekler (5.000-20.000 fark): Makul şans nerede?
   - Riskli ama değerli seçenekler (<5.000 fark): Hangi hayali denemeli?
   - Kaç tercihi her kategoriye ayırmalı?

3. 🏛️ ÜNİVERSİTE KARŞILAŞTIRMASI
   Her öneri için:
   - Akademik kalite ve akreditasyon durumu
   - Bölümün o üniversitedeki güçlü/zayıf yönleri
   - Öğretim kadrosu ve laboratuvar imkanları
   - Mezun istihdam oranları ve sektör bağlantıları
   - Kampüs konumu, ulaşım, barınma imkanları
   
4. 💰 MALİYET ANALİZİ
   - Devlet üniversitesi avantajları
   - Vakıf üniversitelerinde burs imkanları
   - Yaşam maliyeti karşılaştırması (şehir bazlı)

5. 🎓 KARİYER PERSPEKTİFİ
   - ${dreamDept} mezunları için iş olanakları
   - Sektörde aranan beceriler
   - Mezun maaş ortalamaları
   - Yüksek lisans/doktora imkanları

6. 🏠 ${gender === 'Kadın' ? 'Kadın öğrenciler' : gender === 'Erkek' ? 'Erkek öğrenciler' : 'Öğrenciler'} İÇİN ÖZEL TAVSİYELER
   - Kampüs yaşamı ve sosyal imkanlar
   - Güvenlik ve barınma
   - Kulüp ve sosyal aktiviteler

7. ⚠️ ÖNEMLİ UYARILAR
   - Tercih yaparken dikkat edilmesi gerekenler
   - Sık yapılan hatalar
   - Taban puanların değişkenliği

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 KURALLAR:
• Profesyonel ama sıcak bir dil kullanın
• Somut, eyleme geçirilebilir öneriler sunun
• Rakamlar ve veriler kullanın
• Gerçekçi beklentiler oluşturun
• SADECE eğitim ve kariyer danışmanlığı yapın
• Max 600 kelime ile kapsamlı analiz

Öğrencinin geleceğini şekillendirecek bilinçli kararlar almasına yardımcı olun!`;

            let aiRecommendation = '';
            try {
                if (AI_PROVIDER === 'groq') {
                    const aiResponse = await chatWithGroq(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                } else if (AI_PROVIDER === 'gemini') {
                    const aiResponse = await chatWithGemini(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                } else {
                    const aiResponse = await chatWithAI(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                }
                console.log('✅ AI önerisi oluşturuldu');
            } catch (aiError) {
                console.warn('⚠️ AI hatası:', aiError.message);
                aiRecommendation = `🎉 Tebrikler! ${dreamDept} bölümüne girebilirsiniz!\n\n📊 ${eligibleUniversities.length} üniversite seçeneğiniz var (${devletUnis.length} Devlet, ${vakifUnis.length} Vakıf)`;
            }

            // Üniversitelere ÖSYM şart maddelerini ekle
            const universitiesWithConditions = await Promise.all(
                eligibleUniversities.map(async (uni) => {
                    try {
                        const conditions = await getUniversityConditions(uni.name, dreamDept, 2024);

                        // Benzersiz şart numaralarını al (ek güvenlik)
                        const uniqueConditionNumbers = [...new Set(conditions.map(c => c.conditionNumber))];

                        return {
                            ...uni,
                            conditions: conditions.map(c => ({
                                number: c.conditionNumber,
                                text: c.conditionText,
                                category: c.category
                            })),
                            conditionNumbers: uniqueConditionNumbers.join(', ')
                        };
                    } catch (error) {
                        console.warn(`⚠️ ${uni.name} için şart maddesi alınamadı:`, error.message);
                        return { ...uni, conditions: [], conditionNumbers: '' };
                    }
                })
            );

            // Sonuç mesajını şehir bilgisiyle zenginleştir
            const cityDisplayText = selectedCities.length > 0 ? selectedCities.join(', ').toUpperCase() : 'Tüm Türkiye';
            let successMessage = `${dreamDept} bölümüne girebilirsiniz!`;
            if (selectedCities.length > 0) {
                successMessage += ` (${cityDisplayText} - ${eligibleUniversities.length} üniversite)`;
            } else {
                successMessage += ` (Türkiye genelinde ${eligibleUniversities.length} üniversite)`;
            }

            results = {
                isEligible: true,
                status: 'success',
                message: successMessage,
                universities: universitiesWithConditions,
                summary: {
                    total: eligibleUniversities.length,
                    devlet: devletUnis.length,
                    vakif: vakifUnis.length,
                    cities: [...new Set(eligibleUniversities.map(u => u.city))],
                    requestedCities: cityDisplayText,
                    filteredByCity: selectedCities.length > 0
                },
                aiRecommendation: aiRecommendation
            };

        } else {
            // ❌ YETMİYOR - Alternatif bölümler öner
            console.log(`❌ ${dreamDept}'ne yetmiyor, alternatifler aranıyor...`);

            const alternatives = await findAlternatives(dreamDept, aytRank, tytRank);

            // Alternatifler için de üniversite bilgisi ekle
            const alternativesWithDetails = await Promise.all(
                alternatives.map(async (alt) => {
                    console.log(`\n🔍 Alternatif bölüm analizi: "${alt.dept}"`);

                    let altUnis;
                    // Tüm alternatif bölümler için YÖK'ten veri çek (şehir filtresini doğru uygulamak için)
                    altUnis = await scrapeYokAtlas(alt.dept, 2024);
                    console.log(`   📊 YÖK'ten ${altUnis.length} üniversite bulundu`);

                    // 4 yıllık için AYT, 2 yıllık için TYT sıralaması kullan
                    const rankToUse = alt.type === '2 Yıllık' ? tytRank : aytRank;
                    console.log(`   📈 ${alt.type} program - Kullanılan sıralama: ${rankToUse.toLocaleString()}`);
                    // DOĞRU MANTIK: Kullanıcı sıralaması <= Üniversite tabanı
                    let filteredUnis = altUnis.filter(u => {
                        const uniRank = u.ranking || u.minRanking;
                        return uniRank && rankToUse <= uniRank;
                    });
                    console.log(`   ✅ Sıralama yeterli olan: ${filteredUnis.length} üniversite`);

                    // Şehir filtresi - TÜM alternatif bölümler için uygula
                    if (city && city.toLowerCase() !== 'fark etmez' && city.toLowerCase() !== 'farketmez') {
                        const selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
                        console.log(`🏙️ Alternatif "${alt.dept}" için şehir filtresi uygulanıyor:`, selectedCities);
                        console.log(`   Filtreleme öncesi: ${filteredUnis.length} üniversite`);

                        // İlk 3 üniversitenin şehirlerini göster
                        if (filteredUnis.length > 0) {
                            console.log(`   Örnek şehirler:`, filteredUnis.slice(0, 3).map(u => u.city));
                        }

                        filteredUnis = filteredUnis.filter(uni => {
                            const uniCity = uni.city.toLocaleLowerCase('tr-TR');
                            const match = selectedCities.some(sc => uniCity.includes(sc));
                            return match;
                        });
                        console.log(`   Filtreleme sonrası: ${filteredUnis.length} üniversite`);

                        if (filteredUnis.length > 0) {
                            console.log(`   Kalan şehirler:`, [...new Set(filteredUnis.map(u => u.city))]);
                        }
                    }

                    // Eğitim türü filtresi
                    if (educationType && educationType !== 'Tümü') {
                        console.log(`   🏫 Eğitim türü filtresi öncesi: ${filteredUnis.length} üniversite`);
                        filteredUnis = filteredUnis.filter(uni => uni.type === educationType);
                        console.log(`   🏫 "${educationType}" filtresi sonrası: ${filteredUnis.length} üniversite`);
                    }

                    // Tekrar eden üniversiteleri kaldır (benzersiz yapma)
                    const uniqueAltUnis = [];
                    const seenAltUnis = new Set();

                    for (const uni of filteredUnis) {
                        const uniqueKey = `${uni.name}-${uni.city}-${uni.campus || 'Merkez'}`.toLowerCase();
                        if (!seenAltUnis.has(uniqueKey)) {
                            seenAltUnis.add(uniqueKey);
                            uniqueAltUnis.push(uni);
                        }
                    }

                    console.log(`   ✨ SONUÇ: "${alt.dept}" için ${uniqueAltUnis.length} benzersiz üniversite uygun\n`);

                    // Üniversite verilerini normalize et ve şart maddelerini ekle
                    const normalizedUnis = await Promise.all(
                        uniqueAltUnis.map(async (uni) => {
                            try {
                                const conditions = await getUniversityConditions(uni.name, alt.dept, 2024);

                                // Benzersiz şart numaralarını al
                                const uniqueConditionNumbers = [...new Set(conditions.map(c => c.conditionNumber))];

                                return {
                                    ...uni,
                                    ranking: uni.ranking || uni.minRanking,
                                    minRanking: uni.minRanking || uni.ranking,
                                    conditions: conditions.map(c => ({
                                        number: c.conditionNumber,
                                        text: c.conditionText,
                                        category: c.category
                                    })),
                                    conditionNumbers: uniqueConditionNumbers.join(', ')
                                };
                            } catch (error) {
                                return {
                                    ...uni,
                                    ranking: uni.ranking || uni.minRanking,
                                    minRanking: uni.minRanking || uni.ranking,
                                    conditions: [],
                                    conditionNumbers: ''
                                };
                            }
                        })
                    );

                    return {
                        ...alt,
                        universities: normalizedUnis,
                        available: normalizedUnis.length > 0,
                        rankUsed: rankToUse
                    };
                })
            );

            // AI ile profesyonel alternatif öneri danışmanlığı
            const fourYear = alternativesWithDetails.filter(a => a.type === '4 Yıllık' && a.available);
            const twoYear = alternativesWithDetails.filter(a => a.type === '2 Yıllık' && a.dgs && a.available);

            const aiPrompt = `Sen deneyimli bir eğitim danışmanı ve kariyer planlamacısısınız. Öğrencilerin hedeflerine ulaşmaları için alternatif yollar gösterme konusunda uzmansınız.

📋 ÖĞRENCİ PROFİLİ VE DURUM ANALİZİ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• AYT Sıralaması: ${aytRank.toLocaleString()} (4 yıllık programlar için)
• TYT Sıralaması: ${tytRank.toLocaleString()} (2 yıllık programlar için)
• Cinsiyet: ${gender}
• İlk Hedef: ${dreamDept}
• Tercih Şehirleri: ${city || 'Tüm Türkiye'}
• Eğitim Tercihi: ${educationType || 'Devlet + Vakıf'}

⚠️ MEVCUT DURUM:
${dreamDept} programı için AYT sıralamanız maalesef yeterli değil.
ANCAK, hedefinize ulaşmanın birden fazla yolu var! 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ALTERNATİF YOL 1: 4 YILLIK BENZER PROGRAMLAR (AYT bazlı)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fourYear.slice(0, 4).map((alt, i) => {
                const totalUnis = alt.universities.length;
                const devletCount = alt.universities.filter(u => u.type === 'Devlet').length;
                const vakifCount = alt.universities.filter(u => u.type === 'Vakıf').length;
                return `
${i + 1}. 📚 ${alt.dept.toUpperCase()}
   ✓ Sizin AYT Sıralamanız: ${alt.rankUsed.toLocaleString()}
   ✓ Taban Sıralama: ~${alt.threshold.toLocaleString()}
   ✓ Fark: ${(alt.rankUsed - alt.threshold).toLocaleString()} (${alt.rankUsed < alt.threshold ? '✅ YETERLİ' : '❌ YETMİYOR'})
   ✓ Uygun Üniversite: ${totalUnis} adet (${devletCount} Devlet, ${vakifCount} Vakıf)
   ✓ Program Özellikleri: ${alt.description}
   
   En İyi Seçenekler:
   ${alt.universities.slice(0, 3).map((u, idx) =>
                    `   ${idx + 1}) ${u.name} - ${u.city} (${u.type}) - Taban: ${(u.ranking || u.minRanking)?.toLocaleString() || 'N/A'}`
                ).join('\n')}
   ${totalUnis > 3 ? `   ... ve ${totalUnis - 3} üniversite daha` : ''}`;
            }).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ALTERNATİF YOL 2: DGS STRATEJİSİ (2+2 Yıl Yolu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2 yıllık ön lisans programlarından mezun olduktan sonra DGS (Dikey Geçiş Sınavı) ile ${dreamDept} veya benzer 4 yıllık programlara geçebilirsiniz!

${twoYear.slice(0, 3).map((alt, i) => {
                const totalUnis = alt.universities.length;
                return `
${i + 1}. 🎓 ${alt.dept.toUpperCase()} (Ön Lisans)
   ✓ Sizin TYT Sıralamanız: ${alt.rankUsed.toLocaleString()}
   ✓ Taban Sıralama: ~${alt.threshold.toLocaleString()}
   ✓ Fark: ${(alt.rankUsed - alt.threshold).toLocaleString()} (${alt.rankUsed < alt.threshold ? '✅ YETERLİ' : '❌ YETMİYOR'})
   ✓ Uygun Üniversite: ${totalUnis} adet
   ✓ Program: ${alt.description}
   ✓ DGS Geçiş: ${dreamDept} ve benzer bölümlere
   
   Başlıca Seçenekler:
   ${alt.universities.slice(0, 3).map((u, idx) =>
                    `   ${idx + 1}) ${u.name} - ${u.city} - Kontenjan: ${u.quota || 'N/A'}`
                ).join('\n')}`;
            }).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 DANIŞMANLIK GÖREVİNİZ:

1. 💪 MOTİVASYON VE UMUT
   - İlk hedefine ulaşamamak bir başarısızlık DEĞİL, alternatif rotaların başlangıcıdır
   - Başarı hikayelerinden örnekler verin
   - Pozitif bakış açısı kazandırın

2. 📊 4 YILLIK ALTERNATİFLER ANALİZİ
   Her program için detaylıca açıklayın:
   - ${dreamDept} ile karşılaştırma (benzerlikler/farklar)
   - Kariyer fırsatları ve sektör talebi
   - Mezun maaş ortalamaları
   - Hangi öğrenciye uygun olduğu
   - Avantaj ve dezavantajları

3. 🎓 DGS STRATEJİSİ (DETAYLI YOL HARİTASI)
   
   A) DGS NEDİR?
      - Tanım ve işleyiş
      - Başarı oranları
      - Gerekli puan ortalamaları
   
   B) 2 YIL + DGS AVANTAJLARI:
      ✅ Sektöre 2 yıl erken giriş (deneyim + para)
      ✅ Pratik eğitim (staj + part-time)
      ✅ İkinci bir şans (DGS ile hedef bölüme)
      ✅ Daha olgun karar (2 yıl sonra)
      ✅ Mali bağımsızlık (çalışarak okuma)
   
   C) BAŞARI PLANI (2 Yıllık Takvim):
      1. YIL:
         - Derslere odaklan (ortalamanı yükselt)
         - Sektörü tanı (staj/part-time)
         - DGS'yi araştır
      
      2. YIL:
         - DGS hazırlık (kurs/deneme)
         - Networking (hocalar/sektör)
         - Hedef belirle (hangi üniversite?)
   
   D) BAŞARI HİKAYESİ:
      Gerçek örneklerle motive edin

4. 📋 TERCİH STRATEJİSİ
   - Hangi yolu seçmeli? (4 yıllık vs 2+2)
   - Her seçeneği kaç tercih yapmalı?
   - Risk dağılımı nasıl olmalı?
   - Yedek planlar

5. 💼 KARİYER PERSPEKTİFİ
   - Her alternatif için kariyer yolları
   - Sektör talebi ve maaş beklentileri
   - Yüksek lisans imkanları

6. 🏠 KİŞİSEL FAKTÖRLER
   - ${gender === 'Kadın' ? 'Kadın öğrenciler' : gender === 'Erkek' ? 'Erkek öğrenciler' : 'Öğrenciler'} için özel tavsiyeler
   - Şehir seçimi önerileri
   - Aile ve çevre faktörleri

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 KURALLAR:
• Empatik ve destekleyici olun
• Somut, uygulanabilir öneriler sunun
• Gerçekçi beklentiler oluşturun
• Her seçenek için net artı/eksi listesi
• SADECE eğitim ve kariyer odaklı kalın
• Max 700 kelime ile kapsamlı danışmanlık

Öğrencinin bu durumu bir engel değil, yeni fırsatlar olarak görmesini sağlayın!`;

            let aiRecommendation = '';
            try {
                if (AI_PROVIDER === 'groq') {
                    const aiResponse = await chatWithGroq(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                } else if (AI_PROVIDER === 'gemini') {
                    const aiResponse = await chatWithGemini(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                } else {
                    const aiResponse = await chatWithAI(aiPrompt, []);
                    aiRecommendation = aiResponse.text;
                }
                console.log('✅ AI alternatif önerisi oluşturuldu');
            } catch (aiError) {
                console.warn('⚠️ AI hatası:', aiError.message);
                aiRecommendation = `${dreamDept} için sıralamanız yeterli değil. Ancak size ${alternativesWithDetails.length} alternatif önerimiz var!`;
            }

            results = {
                isEligible: false,
                status: 'alternatives',
                message: `${dreamDept} için sıralamanız yeterli değil`,
                dreamDepartment: dreamDept,
                userRanking: rankToUse,
                highestAcceptedRanking: allUniversities.length > 0 
                    ? Math.max(...allUniversities.map(u => u.ranking || u.minRanking || 0).filter(r => r > 0))
                    : null,
                rankingType: is2Year ? 'TYT' : 'AYT',
                alternatives: alternativesWithDetails,
                aiRecommendation: aiRecommendation,
                dgsInfo: {
                    available: alternativesWithDetails.some(a => a.dgs),
                    description: "2 yıllık ön lisans programlarından mezun olduktan sonra DGS (Dikey Geçiş Sınavı) ile 4 yıllık lisans programlarına geçiş yapabilirsiniz.",
                    advantages: [
                        "Sektöre 2 yıl erken giriş",
                        "Pratik iş deneyimi kazanma",
                        "DGS ile ikinci bir şans",
                        "Çalışırken 4 yıllık tamamlama"
                    ]
                }
            };
        }

        // Veritabanına kaydet
        try {
            const connection = await pool.getConnection();
            await connection.query(
                'INSERT INTO analyses (userId, ranking, gender, dreamDept, city, currentLocation, results) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user?.id || null, ranking, gender, dreamDept, city, currentLocation, JSON.stringify(results)]
            );
            connection.release();
            console.log('✅ Analiz veritabanına kaydedildi');
        } catch (dbError) {
            console.warn('⚠️ DB kayıt hatası (devam ediyor):', dbError.message);
        }

        console.log('✅ Tercih Robotu analizi tamamlandı');
        res.json(results);

    } catch (error) {
        console.error('❌ Tercih Robotu hatası:', error);
        res.status(500).json({
            error: 'Analiz yapılırken bir hata oluştu',
            details: error.message
        });
    }
});

async function findAlternatives(department, aytRanking, tytRanking) {
    const alternativesMap = {
        "Bilgisayar Mühendisliği": [
            { dept: "Yazılım Mühendisliği", threshold: 60000, type: "4 Yıllık", description: "Yazılım geliştirme odaklı" },
            { dept: "Bilgisayar ve Öğretim Teknolojileri", threshold: 150000, type: "4 Yıllık", description: "Eğitim teknolojileri" },
            { dept: "Yönetim Bilişim Sistemleri", threshold: 100000, type: "4 Yıllık", description: "İşletme + Bilişim" },
            { dept: "Bilgisayar Programcılığı", threshold: 800000, type: "2 Yıllık", description: "Uygulama geliştirme - İstanbul'da çok sayıda üniversite", dgs: true },
            { dept: "Bilgisayar Teknolojisi", threshold: 900000, type: "2 Yıllık", description: "Donanım ve yazılım teknolojileri", dgs: true },
            { dept: "Web Tasarım ve Kodlama", threshold: 1000000, type: "2 Yıllık", description: "Web geliştirme ve tasarım", dgs: true }
        ],
        "Makine Mühendisliği": [
            { dept: "Mekatronik Mühendisliği", threshold: 90000, type: "4 Yıllık", description: "Makine + Elektronik" },
            { dept: "Otomotiv Mühendisliği", threshold: 95000, type: "4 Yıllık", description: "Otomotiv teknolojileri" },
            { dept: "Endüstri Mühendisliği", threshold: 85000, type: "4 Yıllık", description: "Üretim ve verimlilik" },
            { dept: "Makine Teknolojisi", threshold: 300000, type: "2 Yıllık", description: "Üretim teknikleri", dgs: true }
        ],
        "Tıp": [
            { dept: "Diş Hekimliği", threshold: 3000, type: "5 Yıllık", description: "Ağız ve diş sağlığı" },
            { dept: "Eczacılık", threshold: 10000, type: "5 Yıllık", description: "İlaç bilimi" },
            { dept: "Hemşirelik", threshold: 50000, type: "4 Yıllık", description: "Sağlık hizmetleri" },
            { dept: "Tıbbi Laboratuvar Teknikleri", threshold: 200000, type: "2 Yıllık", description: "Laboratuvar analizleri", dgs: true }
        ],
        "Hukuk": [
            { dept: "Kamu Yönetimi", threshold: 80000, type: "4 Yıllık", description: "Devlet yönetimi" },
            { dept: "Siyaset Bilimi ve Uluslararası İlişkiler", threshold: 60000, type: "4 Yıllık", description: "Diplomasi" },
            { dept: "İşletme", threshold: 100000, type: "4 Yıllık", description: "İş yönetimi" },
            { dept: "Adalet", threshold: 250000, type: "2 Yıllık", description: "Mahkeme işlemleri", dgs: true }
        ],
        "İşletme": [
            { dept: "İktisat", threshold: 120000, type: "4 Yıllık", description: "Ekonomi bilimi" },
            { dept: "Uluslararası Ticaret", threshold: 130000, type: "4 Yıllık", description: "Dış ticaret" },
            { dept: "Lojistik Yönetimi", threshold: 180000, type: "4 Yıllık", description: "Tedarik zinciri" },
            { dept: "Dış Ticaret", threshold: 250000, type: "2 Yıllık", description: "İthalat/İhracat", dgs: true }
        ]
    };

    const alts = alternativesMap[department] || [];
    // 4 yıllık için AYT, 2 yıllık için TYT kullan
    // Threshold: kullanıcı bu sıralamaya KADAR girebilir (threshold bir üst sınır)
    // Örnek: threshold=600000 → kullanıcı 300k, 400k, 599k ile girebilir
    return alts.filter(alt => {
        const rankToCheck = alt.type === '2 Yıllık' ? tytRanking : aytRanking;
        // Kullanıcı sırası threshold'dan küçükse veya eşitse, bu alternatif uygun
        return rankToCheck <= alt.threshold;
    });
}

// Üniversite verileri endpoint
app.get('/api/universities/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const { year = 2024 } = req.query;

        const data = await scrapeYokAtlas(department, year);
        res.json(data);
    } catch (error) {
        console.error('Üniversite verileri hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üniversite listesi endpoint (şehir ve eğitim türü filtreli)
app.post('/api/universities', async (req, res) => {
    try {
        const { department, ranking, cities, educationType } = req.body;

        console.log('🏛️ Üniversite listesi istendi:', { department, ranking, cities, educationType });

        // YÖK Atlas'tan tüm üniversiteleri çek
        const allUniversities = await scrapeYokAtlas(department, 2024);
        console.log(`✅ Toplam ${allUniversities.length} üniversite bulundu`);

        let filteredUniversities = allUniversities;

        // Şehir filtreleme
        if (cities && cities.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni =>
                cities.some(city =>
                    uni.city.toLocaleLowerCase('tr-TR').includes(city.toLocaleLowerCase('tr-TR'))
                )
            );
            console.log(`📍 Şehir filtresi uygulandı: ${filteredUniversities.length} üniversite`);
        }

        // Eğitim türü filtreleme
        if (educationType && educationType !== 'Tümü') {
            filteredUniversities = filteredUniversities.filter(uni =>
                uni.type === educationType
            );
            console.log(`🏫 Eğitim türü filtresi (${educationType}): ${filteredUniversities.length} üniversite`);
        }

        // Sıralama filtreleme
        // Kullanıcının sıralaması, üniversitenin taban sıralamasından BÜYÜK OLMALI
        // Örnek: Kullanıcı 20.000, Üni taban 65.000 → GİREBİLİR (20.000 < 65.000)
        if (ranking) {
            filteredUniversities = filteredUniversities.filter(uni =>
                (uni.ranking || uni.minRanking || 999999) >= ranking
            );
            console.log(`🎯 Sıralama filtresi (${ranking}): ${filteredUniversities.length} üniversite`);
        }

        // Üniversite bazında gruplama (aynı üniversitenin birden fazla kampüsü varsa)
        const universitiesWithPrograms = [];
        const universityMap = new Map();

        // Şart maddelerini çek
        const universitiesWithConditions = await Promise.all(filteredUniversities.map(async (uni) => {
            try {
                const conditions = await getUniversityConditions(uni.name, uni.department, 2024);
                return { ...uni, conditions };
            } catch (e) {
                return { ...uni, conditions: [] };
            }
        }));

        universitiesWithConditions.forEach(uni => {
            const key = `${uni.name}_${uni.city}`;

            if (!universityMap.has(key)) {
                universityMap.set(key, {
                    name: uni.name,
                    city: uni.city,
                    type: uni.type,
                    campus: uni.campus,
                    conditionNumbers: uni.conditions.map(c => c.conditionNumber).join(', '),
                    programs: []
                });
            }

            universityMap.get(key).programs.push({
                name: uni.department,
                minRanking: uni.ranking || uni.minRanking,
                quota: uni.quota,
                admissionConditions: uni.conditions.map(c => c.conditionText),
                scholarshipConditions: uni.scholarshipConditions
            });
        });

        universityMap.forEach(uni => universitiesWithPrograms.push(uni));

        console.log(`✅ ${universitiesWithPrograms.length} üniversite gönderiliyor`);

        res.json(universitiesWithPrograms);
    } catch (error) {
        console.error('Üniversite listesi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bölüm detaylı analizi endpoint (OpenAI ile)
app.post('/api/department-analysis', async (req, res) => {
    try {
        const { department, userRanking } = req.body;

        if (!department) {
            return res.status(400).json({ error: 'Bölüm bilgisi gerekli' });
        }

        console.log(`🔍 ${department} için detaylı analiz istendi`);

        // OpenAI ile bölüm analizi
        const aiAnalysis = await analyzeDepartment(department, { ranking: userRanking });

        // YÖK Atlas verileri
        const universities = await scrapeYokAtlas(department, 2024);
        const top10 = universities.slice(0, 10);

        const response = {
            department: department,
            aiAnalysis: aiAnalysis || `${department} bölümü hakkında detaylı bilgi...`,
            topUniversities: top10,
            statistics: {
                totalUniversities: universities.length,
                highestRanking: universities[0]?.ranking || 0,
                lowestRanking: universities[universities.length - 1]?.ranking || 0,
                avgQuota: Math.round(universities.reduce((sum, u) => sum + u.quota, 0) / universities.length)
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Bölüm analizi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Admin giriş denemesi:', username);

        const connection = await pool.getConnection();
        const [users] = await connection.query(
            'SELECT * FROM users WHERE username = ? AND role = ?',
            [username, 'admin']
        );
        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Yanlış şifre' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Admin girişi başarılı');

        res.json({ token, role: user.role, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Admin giriş hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin - İstatistikler
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [totalAnalyses] = await connection.query('SELECT COUNT(*) as count FROM analyses');
        const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [recentAnalyses] = await connection.query(
            'SELECT * FROM analyses ORDER BY createdAt DESC LIMIT 10'
        );

        connection.release();

        res.json({
            totalAnalyses: totalAnalyses[0].count,
            totalUsers: totalUsers[0].count,
            recentAnalyses: recentAnalyses.map(a => ({
                ...a,
                results: typeof a.results === 'string' ? JSON.parse(a.results) : a.results
            }))
        });
    } catch (error) {
        console.error('İstatistik hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin - Tüm analizler
app.get('/api/admin/analyses', authenticateToken, isAdmin, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [analyses] = await connection.query(
            'SELECT * FROM analyses ORDER BY createdAt DESC'
        );
        connection.release();

        res.json(analyses.map(a => ({
            ...a,
            results: typeof a.results === 'string' ? JSON.parse(a.results) : a.results
        })));
    } catch (error) {
        console.error('Analizler hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin - Kullanıcılar
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.query(
            'SELECT id, username, email, name, role, createdAt FROM users ORDER BY createdAt DESC'
        );
        connection.release();

        res.json(users);
    } catch (error) {
        console.error('Kullanıcılar hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin - Üniversite güncelleme
app.post('/api/admin/universities', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { department, year } = req.body;

        console.log(`🔄 Üniversite verileri güncelleniyor: ${department} - ${year}`);

        // YÖK Atlas'tan yeni verileri çek
        const data = await scrapeYokAtlas(department, year);

        // Veritabanına kaydet
        const connection = await pool.getConnection();
        await connection.query(
            'DELETE FROM universities WHERE department = ? AND year = ?',
            [department, year]
        );

        for (const uni of data) {
            await connection.query(
                'INSERT INTO universities (name, city, department, campus, ranking, quota, type, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [uni.name, uni.city, uni.department, uni.campus, uni.ranking, uni.quota, uni.type || 'Devlet', uni.year]
            );
        }

        connection.release();

        console.log(`✅ ${data.length} üniversite güncellendi`);

        res.json({ message: 'Üniversite verileri güncellendi', count: data.length });
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google OAuth Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        try {
            const token = jwt.sign(
                {
                    id: req.user.id,
                    email: req.user.email,
                    name: req.user.name,
                    role: req.user.role || 'user'
                },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '7d' }
            );

            res.send(`
                <script>
                    localStorage.setItem('authToken', '${token}');
                    localStorage.setItem('userProfile', '${JSON.stringify({
                id: req.user.id,
                googleId: req.user.googleId,
                name: req.user.name,
                email: req.user.email,
                picture: req.user.picture
            }).replace(/'/g, "\\'")}');
                    window.opener.postMessage({type: 'GOOGLE_LOGIN_SUCCESS'}, '*');
                    window.close();
                </script>
            `);
        } catch (error) {
            console.error('Google callback hatası:', error);
            res.redirect('/?error=auth_failed');
        }
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// 📋 ÖSYM ŞART MADDELERİ API
// Tüm şart tanımlarını getir
app.get('/api/conditions/definitions', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(`
            SELECT conditionNumber, conditionText, category 
            FROM condition_definitions 
            ORDER BY CAST(conditionNumber AS UNSIGNED)
        `);
        connection.release();

        res.json({ conditions: rows });
    } catch (error) {
        console.error('Şart tanımları getirme hatası:', error);
        res.status(500).json({ error: 'Şart tanımları getirilemedi' });
    }
});

// Belirli bir üniversite/program için şartları getir
app.get('/api/conditions/:university/:program', async (req, res) => {
    try {
        const { university, program } = req.params;
        const conditions = await getUniversityConditions(university, program, 2024);
        res.json({ conditions });
    } catch (error) {
        console.error('Üniversite şartları getirme hatası:', error);
        res.status(500).json({ error: 'Şartlar getirilemedi' });
    }
});

// ÖSYM verilerini yenile (Admin)
app.post('/api/admin/refresh-osym', authenticateToken, isAdmin, async (req, res) => {
    try {
        console.log('🔄 Admin tarafından ÖSYM verileri güncelleniyor...');
        await refreshAllData();
        res.json({
            success: true,
            message: 'ÖSYM verileri başarıyla güncellendi'
        });
    } catch (error) {
        console.error('ÖSYM güncelleme hatası:', error);
        res.status(500).json({ error: 'ÖSYM verileri güncellenemedi' });
    }
});

// Tüm program şartlarını listele (Admin)
app.get('/api/admin/program-conditions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { getAllProgramConditions } = require('./osym-guide-scraper');
        const programs = await getAllProgramConditions(2024);
        res.json({ programs });
    } catch (error) {
        console.error('Program şartları listeleme hatası:', error);
        res.status(500).json({ error: 'Program şartları listelenemedi' });
    }
});

// 🎯 AKILLI ALTERNATİF ÖNERİ SİSTEMİ
app.post('/api/smart-recommend', async (req, res) => {
    try {
        const { aytRanking, tytRanking, dreamDept, city, gender, educationType } = req.body;

        console.log('🧠 Akıllı Alternatif Sistemi Başladı:', {
            aytRanking,
            tytRanking,
            dreamDept,
            city,
            educationType
        });

        if (!dreamDept || (!aytRanking && !tytRanking)) {
            return res.status(400).json({
                error: 'Hedef bölüm ve en az bir sıralama bilgisi gerekli'
            });
        }

        // 1️⃣ Akıllı alternatifler bul
        const alternatives = findSmartAlternatives(
            dreamDept,
            aytRanking,
            tytRanking,
            city
        );

        if (!alternatives.found && alternatives.message) {
            return res.json({
                status: 'not_found',
                message: alternatives.message,
                suggestion: 'Manuel tercih analizi yapmayı deneyin'
            });
        }

        // 2️⃣ Tercih stratejisi oluştur
        const strategy = generateStrategy(alternatives);

        // 3️⃣ AI ile kişiselleştirilmiş danışmanlık
        const aiPrompt = formatForAI(alternatives, strategy) + `

🎯 GÖREVİNİZ:
Yukarıdaki verileri kullanarak kullanıcıya:

1. **Durum Değerlendirmesi:** ${dreamDept} için sıralamasının yetip yetmediğini açıkla
2. **4 Yıllık Alternatifler:** AYT sıralamasına göre hangi benzer bölümlere girebilir?
3. **2 Yıllık + DGS Yolu:** TYT sıralamasına göre hangi 2 yıllık programlar uygun? DGS ile nasıl hedef bölüme ulaşabilir?
4. **Tercih Stratejisi:** 24 tercihi nasıl dağıtmalı? Hangi sırayla tercih yapmalı?
5. **Motivasyon:** Kullanıcıyı motive et, başarı hikayeleri paylaş

⚠️ ÖNEMLİ:
- Yukarıdaki GERÇEK YÖK ATLAS VERİLERİNİ kullan
- Üniversite isimlerini, taban sıralamalarını TAM OLARAK kullan
- Bilgisayar Programcılığı için İstanbul'daki tüm üniversiteleri listeledin
- Her öneriyi gerekçelendir
- Olumlu ve destekleyici bir dil kullan

Cinsiyet: ${gender || 'Belirtilmemiş'}
Tercih Şehirleri: ${city || 'Tüm Türkiye'}
Eğitim Tercihi: ${educationType || 'Devlet + Vakıf'}
`;

        let aiResponse;
        if (AI_PROVIDER === 'groq') {
            aiResponse = await chatWithGroq(aiPrompt, []);
        } else if (AI_PROVIDER === 'gemini') {
            aiResponse = await chatWithGemini(aiPrompt, []);
        } else {
            aiResponse = await chatWithAI(aiPrompt, []);
        }

        // 4️⃣ Sonuçları formatla ve döndür
        const result = {
            status: 'success',
            dreamDepartment: dreamDept,
            userProfile: {
                aytRanking,
                tytRanking,
                city,
                gender,
                educationType
            },
            alternatives: {
                fourYear: alternatives.fourYearOptions,
                twoYear: alternatives.twoYearOptions
            },
            strategy,
            aiRecommendation: aiResponse.text,
            summary: {
                total4Year: alternatives.fourYearOptions.length,
                eligible4Year: alternatives.fourYearOptions.filter(a => a.eligible).length,
                total2Year: alternatives.twoYearOptions.length,
                eligible2Year: alternatives.twoYearOptions.filter(a => a.eligible).length,
                hasDetailedData: alternatives.twoYearOptions.some(a => a.universities && a.universities.length > 0)
            }
        };

        console.log('✅ Akıllı Alternatif Analizi Tamamlandı');
        res.json(result);

    } catch (error) {
        console.error('❌ Akıllı Alternatif Hatası:', error);
        res.status(500).json({
            error: error.message,
            details: 'Akıllı alternatif sistemi şu anda kullanılamıyor. Lütfen manuel tercih analizini deneyin.'
        });
    }
});

// Google Sheets - Seçili üniversiteleri aktar
app.post('/api/export-to-sheets', async (req, res) => {
    try {
        const { universities, userEmail, title } = req.body;

        if (!universities || !Array.isArray(universities) || universities.length === 0) {
            return res.status(400).json({ error: 'Üniversite listesi boş olamaz' });
        }

        console.log('📊 Google Sheets\'e aktarılıyor:', {
            count: universities.length,
            userEmail: userEmail || 'Belirtilmedi',
            title: title || 'Seçtiğim Üniversiteler'
        });

        const sheetTitle = title || `Seçtiğim Üniversiteler - ${new Date().toLocaleDateString('tr-TR')}`;

        const result = await createSpreadsheet(sheetTitle, universities, userEmail);

        res.json(result);

    } catch (error) {
        console.error('Google Sheets export hatası:', error);
        res.status(500).json({
            error: 'Google Sheets oluşturulamadı',
            message: error.message,
            hint: 'backend/google-credentials.json dosyasını ekleyin'
        });
    }
});

// Kullanıcı seçimlerini kaydetme endpoint'i
app.post('/api/save-selections', async (req, res) => {
    try {
        const { userEmail, universities, timestamp } = req.body;

        if (!universities || !Array.isArray(universities) || universities.length === 0) {
            return res.status(400).json({ error: 'Üniversite listesi boş olamaz' });
        }

        console.log('💾 Kullanıcı seçimleri kaydediliyor:', {
            userEmail: userEmail || 'Anonim',
            count: universities.length,
            timestamp
        });

        const connection = await pool.getConnection();

        try {
            // user_selections tablosuna kaydet
            await connection.query(`
                CREATE TABLE IF NOT EXISTS user_selections (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_email VARCHAR(255),
                    university_name VARCHAR(500),
                    city VARCHAR(100),
                    campus VARCHAR(200),
                    department VARCHAR(500),
                    type VARCHAR(50),
                    ranking VARCHAR(50),
                    quota VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_email (user_email),
                    INDEX idx_created_at (created_at)
                )
            `);

            // Her üniversite için kayıt ekle
            for (const uni of universities) {
                await connection.query(
                    `INSERT INTO user_selections 
                    (user_email, university_name, city, campus, department, type, ranking, quota) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userEmail || 'anonim',
                        uni.name,
                        uni.city,
                        uni.campus,
                        uni.department,
                        uni.type,
                        uni.ranking || '',
                        uni.quota || ''
                    ]
                );
            }

            res.json({
                success: true,
                message: `${universities.length} üniversite kaydedildi`,
                savedCount: universities.length
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('❌ Seçim kaydetme hatası:', error);
        res.status(500).json({
            error: 'Seçimler kaydedilemedi',
            message: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server çalışıyor' });
});

// ============================================
// 🚀 HEDEF ANALİZİ ENDPOİNTİ (NET BAZLI - BASİT)
// ============================================
app.post('/api/hedef-analiz', async (req, res) => {
    try {
        const { tytNets, aytNets, aytAlan, hedefBolum } = req.body;

        console.log('🎯 Hedef Analizi (Net Bazlı):', { tytNets, aytNets, aytAlan, hedefBolum });

        // TYT toplam net
        const totalTytNet = (
            parseFloat(tytNets.turkce || 0) +
            parseFloat(tytNets.mat || 0) +
            parseFloat(tytNets.sosyal || 0) +
            parseFloat(tytNets.fen || 0)
        );

        // AYT toplam net
        const totalAytNet = Object.values(aytNets).reduce((sum, val) => sum + parseFloat(val || 0), 0);

        // Alan adı
        const alanIsim = aytAlan === 'sayisal' ? 'Sayısal (MF)' : 
                         aytAlan === 'esit' ? 'Eşit Ağırlık (TM)' : 
                         'Sözel (TS)';

        // ===============================================
        // VERİTABANINDAN NET BAZLI PROGRAMLARI ÇEK
        // ===============================================
        
        const connection = await pool.getConnection();
        
        // 1) Hayalindeki bölümü ara
        const [hedefProgramlar] = await connection.query(
            `SELECT * FROM universities 
             WHERE department LIKE ? 
             ORDER BY minRanking ASC 
             LIMIT 100`,
            [`%${hedefBolum}%`]
        );

        // 2) Alan bazlı kazanılabilecek bölümler
        let alanQuery = '';
        if (aytAlan === 'sayisal') {
            alanQuery = `
                SELECT * FROM universities 
                WHERE department LIKE '%Mühendisliği%' 
                   OR department LIKE '%Bilgisayar%'
                ORDER BY minRanking ASC 
                LIMIT 50
            `;
        } else if (aytAlan === 'esit') {
            alanQuery = `
                SELECT * FROM universities 
                WHERE department LIKE '%İşletme%' 
                   OR department LIKE '%İktisat%'
                   OR department LIKE '%İletişim%'
                ORDER BY minRanking ASC 
                LIMIT 50
            `;
        } else {
            alanQuery = `
                SELECT * FROM universities 
                WHERE department LIKE '%Edebiyat%' 
                   OR department LIKE '%Tarih%'
                   OR department LIKE '%Sosyoloji%'
                ORDER BY minRanking ASC 
                LIMIT 50
            `;
        }

        const [alanProgramlari] = await connection.query(alanQuery);
        connection.release();

        // ===============================================
        // NET BAZLI DURUM DEĞERLENDİRMESİ
        // ===============================================
        
        let seviye = '';
        let seviyeEmoji = '';
        let seviyeClass = '';

        // TYT + AYT toplam
        const toplamNet = totalTytNet + totalAytNet;

        if (toplamNet >= 150) {
            seviye = 'Mükemmel';
            seviyeEmoji = '🌟';
            seviyeClass = 'seviye-mukemmel';
        } else if (toplamNet >= 120) {
            seviye = 'Çok İyi';
            seviyeEmoji = '⭐';
            seviyeClass = 'seviye-cok-iyi';
        } else if (toplamNet >= 90) {
            seviye = 'İyi';
            seviyeEmoji = '👍';
            seviyeClass = 'seviye-iyi';
        } else if (toplamNet >= 60) {
            seviye = 'Orta';
            seviyeEmoji = '📈';
            seviyeClass = 'seviye-orta';
        } else {
            seviye = 'Başlangıç';
            seviyeEmoji = '💪';
            seviyeClass = 'seviye-gelistirilmeli';
        }

        // ===============================================
        // AI İLE BASİT VE ANLAŞILIR ANALİZ
        // ===============================================

        const aiPrompt = `
Sen bir YKS danışmanısın. Öğrenciye BASİT ve ANLAŞILIR bir analiz yap.

🎯 **HEDEFİ:** ${hedefBolum}

📊 **MEVCUT NETLERİ:**
TYT: ${totalTytNet.toFixed(1)} net (Türkçe: ${tytNets.turkce}, Mat: ${tytNets.mat}, Sosyal: ${tytNets.sosyal}, Fen: ${tytNets.fen})
AYT (${alanIsim}): ${totalAytNet.toFixed(1)} net
Toplam: ${toplamNet.toFixed(1)} net

📍 **HEDEF BÖLÜM VERİSİ:**
${hedefProgramlar.length > 0 ? `
${hedefBolum} için ${hedefProgramlar.length} program bulundu:
- En kolay kazanılan: ${hedefProgramlar[hedefProgramlar.length - 1]?.name} (${hedefProgramlar[hedefProgramlar.length - 1]?.city})
- Orta seviye: ${hedefProgramlar[Math.floor(hedefProgramlar.length / 2)]?.name} (${hedefProgramlar[Math.floor(hedefProgramlar.length / 2)]?.city})
- En zor: ${hedefProgramlar[0]?.name} (${hedefProgramlar[0]?.city})
` : 'Veritabanında bu bölüm bulunamadı'}

🎯 **GÖREVİN:**
1. **Durum:** Bu netlerle ${hedefBolum} için nerede durduğunu 2-3 cümleyle açıkla
2. **Kazanılabilecek Yerler:** Hangi şehirlerde/üniversitelerde gerçekçi? (3-5 örnek ver)
3. **Gelişim:** Hangi dersleri geliştirmeli? Net öneriler
4. **Motivasyon:** 1-2 cümle motivasyon

⚠️ KURALLAMA:
- KISA ve ÖZ yaz (max 15 satır)
- Karmaşık hesaplardan KAÇIN
- "Şu kadar net artırırsan şuraya gidersin" dili kullan
- Emoji kullan
- Sade Türkçe
`;

        let aiResponse;
        if (AI_PROVIDER === 'groq') {
            aiResponse = await chatWithGroq(aiPrompt, []);
        } else if (AI_PROVIDER === 'gemini') {
            aiResponse = await chatWithGemini(aiPrompt, []);
        } else {
            aiResponse = await chatWithAI(aiPrompt, []);
        }

        // ===============================================
        // BASİT VE GÜ ZEL ÇIKTI
        // ===============================================

        const message = `
${seviyeEmoji} **${seviye.toUpperCase()} SEVİYE!**

━━━━━━━━━━━━━━━━━━━━
💭 **HEDEFİNİZ**
${hedefBolum}

📊 **NETLERİNİZ**
🔹 TYT: **${totalTytNet.toFixed(1)}** net
🔹 AYT: **${totalAytNet.toFixed(1)}** net
🔹 Toplam: **${toplamNet.toFixed(1)}** net

━━━━━━━━━━━━━━━━━━━━

${aiResponse.text}

━━━━━━━━━━━━━━━━━━━━
🎓 **ALANINIZDAK İ DİĞER BÖLÜMLER**

${alanProgramlari.slice(0, 8).map((p, i) => `
${i + 1}. **${p.department}**
   ${p.name} • ${p.city}
   ${p.type === 'Devlet' ? '🏛️' : '🏢'} ${p.type}
`).join('')}

━━━━━━━━━━━━━━━━━━━━
💡 **BİR SONRAKİ ADIM**

Daha detaylı analiz için **"Tercih Analizi"** yapın!
        `.trim();

        res.json({
            success: true,
            message,
            data: {
                tytNet: totalTytNet.toFixed(1),
                aytNet: totalAytNet.toFixed(1),
                toplamNet: toplamNet.toFixed(1),
                alan: alanIsim,
                seviye,
                seviyeClass,
                hedefBolum,
                hedefProgramSayisi: hedefProgramlar.length,
                programs: alanProgramlari.slice(0, 8) // Bölüm listesi
            }
        });

    } catch (error) {
        console.error('❌ Hedef analiz hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Veritabanını başlat ve sunucuyu çalıştır
async function startServer() {
    try {
        console.log('\n🎓 ==========================================');
        console.log('🚀 Tercih AI Backend başlatılıyor...');
        console.log('==========================================\n');

        // MySQL bağlantısını test et
        const connected = await testConnection();
        if (!connected) {
            console.log('⚠️ MySQL bağlantısı kurulamadı!');
            console.log('💡 Lütfen .env dosyasındaki DB_PASSWORD değerini kontrol edin');
            console.log('💡 MySQL servisinin çalıştığından emin olun');
            process.exit(1);
        }

        // Veritabanını oluştur
        await initDatabase();

        // ÖSYM şart maddesi tablolarını oluştur
        console.log('📋 ÖSYM şart maddesi tabloları oluşturuluyor...');
        await createConditionsTable();

        // Sunucuyu başlat
        app.listen(PORT, () => {
            console.log(`\n🎓 ==========================================`);
            console.log(`✅ Tercih AI Backend çalışıyor!`);
            console.log(`📡 Ana Sayfa: http://localhost:${PORT}`);
            console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
            console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`);
            console.log(`💾 Veritabanı: MySQL (${process.env.DB_NAME})`);
            console.log(`📋 ÖSYM Şart Maddesi Sistemi: Aktif`);
            console.log(`==========================================\n`);

            // İlk başlatmada ÖSYM verilerini yükle
            console.log('🔄 ÖSYM verileri yükleniyor (arka planda)...');
            refreshAllData().then(() => {
                console.log('✅ ÖSYM verileri hazır!');
            }).catch(err => {
                console.warn('⚠️ ÖSYM verileri yüklenemedi:', err.message);
            });
        });

    } catch (error) {
        console.error('❌ Sunucu başlatma hatası:', error);
        process.exit(1);
    }
}

// Sadece localhost'ta server başlat (Vercel'de serverless olarak çalışacak)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    startServer();
} else {
    console.log('🌐 Vercel serverless mode - Initializing databases');
    // Vercel için DB bağlantılarını kur (non-blocking)
    (async () => {
        try {
            await connectMongoDB().catch(e => console.warn('MongoDB skip:', e.message));
            await testConnection().catch(e => console.warn('MySQL skip:', e.message));
            await initDatabase().catch(e => console.warn('DB init skip:', e.message));
            await createConditionsTable().catch(e => console.warn('Conditions table skip:', e.message));
            console.log('✅ Vercel initialization complete');
        } catch (err) {
            console.warn('⚠️ Partial initialization:', err.message);
        }
    })();
}

// ============================================
// 💰 VAKIF ÜNİVERSİTESİ ÜCRET BİLGİSİ API
// ============================================

app.post('/api/tuition-fee', async (req, res) => {
    try {
        const { university, department, preferenceOrder } = req.body;

        console.log(`💰 Ücret bilgisi isteniyor: ${university} - ${department}`);

        const tuitionInfo = await getTuitionInfo(university, department, preferenceOrder);

        if (tuitionInfo) {
            const htmlFormatted = formatTuitionInfoHTML(tuitionInfo);
            
            res.json({
                success: true,
                data: tuitionInfo,
                html: htmlFormatted
            });
        } else {
            res.json({
                success: false,
                message: 'Ücret bilgisi bulunamadı'
            });
        }

    } catch (error) {
        console.error('❌ Ücret bilgisi hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Vercel için export
module.exports = app;
