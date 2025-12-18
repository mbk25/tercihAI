const OpenAI = require('openai');
require('dotenv').config();

// OpenAI istemcisi oluştur
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

// Yapay zeka ile chat yapma
async function chatWithAI(message, conversationHistory = []) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
            console.log('⚠️ OpenAI API key bulunamadı, fallback yanıt kullanılıyor');
            return generateFallbackResponse(message);
        }

        // Sistem mesajı - TercihAI'nin rolünü tanımla
        const systemMessage = {
            role: 'system',
            content: `Sen TercihAI adında bir üniversite tercih danışmanısın. Türkiye'deki üniversiteler, YKS, bölümler ve kariyer planlaması konusunda uzmansın. 
            
Görevlerin:
1. Öğrencilere tercih danışmanlığı yapmak
2. YKS sıralamalarına göre uygun üniversite ve bölüm önerileri sunmak
3. Kariyer planlaması konusunda rehberlik etmek
4. Samimi, yardımsever ve motive edici bir dil kullanmak
5. Türkçe konuşmak ve Türk eğitim sistemi hakkında bilgi vermek

Özellikler:
- Emoji kullan (ama aşırıya kaçma)
- Kısa ve öz yanıtlar ver
- Soru sorarak öğrenciyi yönlendir
- YÖK Atlas verilerini referans göster`
        };

        // Mesaj geçmişini hazırla
        const messages = [
            systemMessage,
            ...conversationHistory.slice(-10), // Son 10 mesajı al
            { role: 'user', content: message }
        ];

        // OpenAI API çağrısı
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // veya 'gpt-4' kullanabilirsiniz
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0.5
        });

        const aiResponse = response.choices[0].message.content;
        
        // Akıllı öneriler oluştur
        const suggestions = generateSmartSuggestions(message, aiResponse);

        return {
            text: aiResponse,
            suggestions: suggestions,
            source: 'openai'
        };

    } catch (error) {
        console.error('❌ OpenAI API hatası:', error.message);
        return generateFallbackResponse(message);
    }
}

// Akıllı öneriler oluştur
function generateSmartSuggestions(userMessage, aiResponse) {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Tercih analizi önerileri
    if (lowerMessage.includes('tercih') || lowerResponse.includes('tercih')) {
        return [
            "Tercih analizi yapmak istiyorum",
            "Hangi bölümü seçmeliyim?",
            "En iyi üniversiteler hangileri?"
        ];
    }

    // Bölüm önerileri
    if (lowerMessage.includes('bölüm') || lowerResponse.includes('bölüm')) {
        return [
            "Bilgisayar Mühendisliği",
            "Tıp Fakültesi",
            "İşletme",
            "Hukuk"
        ];
    }

    // Sıralama önerileri
    if (lowerMessage.includes('sıralama') || lowerResponse.includes('sıralama')) {
        return [
            "Sıralamamı analiz et",
            "Hangi üniversitelere girebilirim?",
            "Alternatif bölümler göster"
        ];
    }

    // Genel öneriler
    return [
        "Tercih stratejisi oluştur",
        "Kariyer planlaması yap",
        "Üniversite karşılaştır"
    ];
}

// Fallback yanıt (OpenAI kullanılamazsa)
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
    
    if (lowerMessage.includes('sıralama') || lowerMessage.includes('taban puan')) {
        return {
            text: "📊 Hangi bölümün taban puanlarını ve sıralamalarını öğrenmek istersiniz?\n\nPopüler bölümler:\n• Bilgisayar Mühendisliği\n• Tıp\n• Hukuk\n• İşletme\n• Mimarlık\n• Psikoloji",
            suggestions: [
                "Bilgisayar Mühendisliği",
                "Tıp",
                "Hukuk",
                "İşletme"
            ],
            source: 'fallback'
        };
    }
    
    if (lowerMessage.includes('kariyer') || lowerMessage.includes('meslek')) {
        return {
            text: "💼 Kariyer planlaması için doğru yerdesiniz! Hangi alanda kariyer yapmak istiyorsunuz?\n\n• Mühendislik ve Teknoloji\n• Sağlık Bilimleri\n• Sosyal Bilimler\n• İşletme ve Finans\n• Hukuk ve Adalet\n• Sanat ve Tasarım",
            suggestions: [
                "Mühendislik kariyeri",
                "Sağlık alanında kariyer",
                "İşletme ve yönetim",
                "Hangi bölüm daha iyi?"
            ],
            source: 'fallback'
        };
    }
    
    return {
        text: "Size yardımcı olmak için buradayım! 😊\n\nTercih danışmanlığı, bölüm karşılaştırması, kariyer planlaması ve YKS stratejileri konularında size rehberlik edebilirim.\n\nNe öğrenmek istersiniz?",
        suggestions: [
            "Tercih analizi yap",
            "Bölüm sıralamalarını göster",
            "Kariyer planlaması",
            "YKS stratejileri"
        ],
        source: 'fallback'
    };
}

// Bölüm analizi için AI kullan
async function analyzeDepartment(department, userData) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
            return null;
        }

        const prompt = `${department} bölümü hakkında şu bilgileri ver:
1. Bölümün genel tanımı
2. Kariyer fırsatları
3. Mezun olduktan sonra çalışabileceği alanlar
4. Ortalama maaş beklentisi (Türkiye'de)
5. Öğrenci profili için öneriler

Kısa ve özet olarak, maksimum 300 kelime.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Sen bir kariyer danışmanısın. Türkiye\'deki üniversite bölümleri hakkında bilgi veriyorsun.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 400
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error('Bölüm analizi hatası:', error.message);
        return null;
    }
}

module.exports = {
    chatWithAI,
    analyzeDepartment,
    generateFallbackResponse
};
