// Google Gemini AI Entegrasyonu (Ücretsiz!)
const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash'; // Hızlı ve ücretsiz model
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

// Gemini ile chat yapma
async function chatWithGemini(message, conversationHistory = []) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
            console.log('⚠️ Gemini API key bulunamadı, fallback yanıt kullanılıyor');
            return generateFallbackResponse(message);
        }

        // Konuşma geçmişini hazırla
        const conversationContext = conversationHistory
            .slice(-6) // Son 6 mesaj
            .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'TercihAI'}: ${msg.content}`)
            .join('\n');

        // Sistem talimatları + mesaj
        const fullPrompt = `Sen TercihAI adında bir üniversite tercih danışmanısın. Türkiye'deki üniversiteler, YKS, bölümler ve kariyer planlaması konusunda uzmansın.

Görevlerin:
1. Öğrencilere tercih danışmanlığı yapmak
2. YKS sıralamalarına göre uygun üniversite ve bölüm önerileri sunmak
3. Kariyer planlaması konusunda rehberlik etmek
4. Samimi, yardımsever ve motive edici bir dil kullanmak
5. Türkçe konuşmak ve Türk eğitim sistemi hakkında bilgi vermek

${conversationContext ? 'Önceki konuşma:\n' + conversationContext + '\n\n' : ''}

Kullanıcı: ${message}

TercihAI (kısa ve öz yanıt ver, emoji kullan):`;

        // Gemini API çağrısı
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 500,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        // Güvenli yanıt kontrolü
        if (!response.data) {
            console.log('⚠️ Gemini yanıt verisi yok, fallback kullanılıyor');
            return generateFallbackResponse(message);
        }

        if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
            console.log('⚠️ Gemini boş candidates döndü, fallback kullanılıyor');
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return generateFallbackResponse(message);
        }

        const candidate = response.data.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
            console.log('⚠️ Gemini içerik bulunamadı, fallback kullanılıyor');
            console.log('Candidate:', JSON.stringify(candidate, null, 2));
            return generateFallbackResponse(message);
        }

        const aiResponse = candidate.content.parts[0].text;
        const suggestions = generateSmartSuggestions(message, aiResponse);

        return {
            text: aiResponse,
            suggestions: suggestions,
            source: 'gemini'
        };

    } catch (error) {
        console.error('❌ Gemini API hatası:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        return generateFallbackResponse(message);
    }
}

// Bölüm analizi için Gemini kullan
async function analyzeDepartmentWithGemini(department, userRanking) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
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
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        // Güvenli yanıt kontrolü
        if (!response.data) {
            console.log('⚠️ Gemini bölüm analizi yanıt verisi yok');
            return null;
        }

        if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
            console.log('⚠️ Gemini bölüm analizi boş candidates döndü');
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return null;
        }

        const candidate = response.data.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
            console.log('⚠️ Gemini bölüm analizi içerik bulunamadı');
            console.log('Candidate:', JSON.stringify(candidate, null, 2));
            return null;
        }

        return candidate.content.parts[0].text;

    } catch (error) {
        console.error('❌ Bölüm analizi hatası:', error.message);
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
    chatWithGemini,
    analyzeDepartmentWithGemini,
    generateFallbackResponse
};
