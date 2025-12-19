// Groq AI Entegrasyonu (HIZLI VE ÜCRETSİZ!)
const axios = require('axios');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Çok hızlı ve akıllı model
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq ile chat yapma
async function chatWithGroq(message, conversationHistory = []) {
    try {
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            console.log('⚠️ Groq API key bulunamadı, fallback yanıt kullanılıyor');
            return generateFallbackResponse(message);
        }

        // Konuşma geçmişini hazırla
        const messages = [
            {
                role: 'system',
                content: `Sen TercihAI adında bir üniversite tercih danışmanısın. Türkiye'deki üniversiteler, YKS, bölümler ve kariyer planlaması konusunda uzmansın.

Görevlerin:
1. Öğrencilere tercih danışmanlığı yapmak
2. YKS sıralamalarına göre uygun üniversite ve bölüm önerileri sunmak
3. Kariyer planlaması konusunda rehberlik etmek
4. Samimi, yardımsever ve motive edici bir dil kullanmak
5. Türkçe konuşmak ve Türk eğitim sistemi hakkında bilgi vermek

Kısa ve öz yanıtlar ver, maksimum 300 kelime. Emoji kullan.`
            }
        ];

        // Konuşma geçmişini ekle
        conversationHistory.slice(-6).forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });

        // Kullanıcı mesajını ekle
        messages.push({
            role: 'user',
            content: message
        });

        // Groq API çağrısı
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        // Güvenli yanıt kontrolü
        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            console.log('⚠️ Groq boş yanıt döndü, fallback kullanılıyor');
            return generateFallbackResponse(message);
        }

        const aiResponse = response.data.choices[0].message.content;
        const suggestions = generateSmartSuggestions(message, aiResponse);

        return {
            text: aiResponse,
            suggestions: suggestions,
            source: 'groq'
        };

    } catch (error) {
        console.error('❌ Groq API hatası:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        return generateFallbackResponse(message);
    }
}

// Bölüm analizi için Groq kullan
async function analyzeDepartmentWithGroq(department, userRanking) {
    try {
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            return null;
        }

        const prompt = `${department} bölümü hakkında Türkiye'deki üniversiteler için detaylı analiz yap.

YKS sıralaması: ${userRanking}

Şu bilgileri ver:
1. Bölümün genel tanımı ve ne öğretildiği
2. Kariyer fırsatları ve iş imkanları
3. Mezuniyet sonrası çalışabileceği sektörler
4. Türkiye'de ortalama maaş beklentisi
5. Bu sıralama ile girebileceği üniversiteler hakkında yorum

Kısa ve öz, maksimum 300 kelime. Türkçe yaz.`;

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: GROQ_MODEL,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 800
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            return null;
        }

        return response.data.choices[0].message.content;

    } catch (error) {
        console.error('❌ Groq bölüm analizi hatası:', error.message);
        return null;
    }
}

// Akıllı öneriler oluştur
function generateSmartSuggestions(userMessage, aiResponse) {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    if (lowerMessage.includes('tercih') || lowerResponse.includes('tercih')) {
        return [
            "Tercih analizi yapmak istiyorum",
            "Hangi bölümü seçmeliyim?",
            "En iyi üniversiteler hangileri?"
        ];
    }

    if (lowerMessage.includes('bölüm') || lowerResponse.includes('bölüm')) {
        return [
            "Bilgisayar Mühendisliği",
            "Tıp Fakültesi",
            "İşletme",
            "Hukuk"
        ];
    }

    if (lowerMessage.includes('sıralama') || lowerResponse.includes('sıralama')) {
        return [
            "Sıralamamı analiz et",
            "Hangi üniversitelere girebilirim?",
            "Alternatif bölümler göster"
        ];
    }

    return [
        "Tercih stratejisi oluştur",
        "Kariyer planlaması yap",
        "Üniversite karşılaştır"
    ];
}

// Fallback yanıt
function generateFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
        return {
            text: "Merhaba! 👋 Ben TercihAI, sizin akıllı üniversite tercih danışmanınızım. YKS tercihlerinizde size yardımcı olmak için buradayım. Size nasıl yardımcı olabilirim?",
            suggestions: [
                "Tercih analizi yapmak istiyorum",
                "Bölüm sıralamalarını göster",
                "Kariyer danışmanlığı"
            ],
            source: 'fallback'
        };
    }
    
    if (lowerMessage.includes('tercih') || lowerMessage.includes('analiz')) {
        return {
            text: "🎯 Tercih analizi için size özel bir plan oluşturalım!\n\nŞu bilgilere ihtiyacım var:\n• YKS sıralamanız\n• İlgilendiğiniz bölüm\n• Tercih ettiğiniz şehirler\n• Hayalinizdeki üniversite\n\nBilgilerinizi paylaşır mısınız?",
            suggestions: [
                "Bilgilerimi girmek istiyorum",
                "Form aç",
                "Önce bölüm sıralamalarını göster"
            ],
            source: 'fallback'
        };
    }
    
    if (lowerMessage.includes('dgs')) {
        return {
            text: "📚 DGS (Dikey Geçiş Sınavı) Nedir?\n\nÖnlisans mezunlarının lisans programlarına geçiş yapabilmesi için ÖSYM tarafından düzenlenen bir sınavdır.\n\n📝 İçerik:\n• Sözel Bölüm (60 soru)\n• Sayısal Bölüm (60 soru)\n\n📅 Yılda 1 kez yapılır.\n\nDaha fazla bilgi ister misiniz?",
            suggestions: [
                "DGS puan hesaplama",
                "Hangi bölümlere geçiş yapabilirim?",
                "DGS tercih stratejisi"
            ],
            source: 'fallback'
        };
    }
    
    return {
        text: "Size yardımcı olmak için buradayım! 😊\n\nTercih danışmanlığı, bölüm karşılaştırması, kariyer planlaması ve YKS stratejileri konularında size rehberlik edebilirim.\n\nNe öğrenmek istersiniz?",
        suggestions: [
            "Tercih analizi yap",
            "Bölüm sıralamalarını göster",
            "Kariyer planlaması"
        ],
        source: 'fallback'
    };
}

module.exports = {
    chatWithGroq,
    analyzeDepartmentWithGroq
};
