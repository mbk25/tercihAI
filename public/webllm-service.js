/**
 * WebLLM Service - Tarayıcıda Tamamen Offline AI
 * 
 * WebLLM kullanarak tarayıcıda yerel olarak AI modeli çalıştırır.
 * Avantajlar:
 * - ✅ Tamamen ücretsiz (API key gerekmez)
 * - ✅ Tamamen offline (internet gerekmez)
 * - ✅ Gizlilik (veriler tarayıcıda kalır)
 * - ✅ Hızlı yanıtlar (API beklemeden)
 * 
 * Desteklenen Modeller:
 * - Llama-3.1-8B (Önerilen)
 * - Phi-3-mini-4k
 * - TinyLlama-1.1B
 * - Mistral-7B
 */

class WebLLMService {
    constructor() {
        this.engine = null;
        this.isLoading = false;
        this.isReady = false;
        this.selectedModel = 'Phi-3-mini-4k-instruct-q4f16_1-MLC'; // Küçük ve hızlı model (2.4GB)
        this.progressCallback = null;
        
        console.log('🤖 WebLLM Service oluşturuldu');
    }
    
    /**
     * WebLLM motorunu başlat ve modeli yükle
     */
    async initialize(progressCallback) {
        if (this.isReady) {
            console.log('✅ WebLLM zaten hazır');
            return true;
        }
        
        if (this.isLoading) {
            console.log('⏳ WebLLM yükleniyor, lütfen bekleyin...');
            return false;
        }
        
        this.isLoading = true;
        this.progressCallback = progressCallback;
        
        try {
            console.log('📦 WebLLM kütüphanesi yükleniyor...');
            
            // WebLLM'i import et
            if (!window.mlc) {
                console.log('📦 WebLLM yükleniyor...');
                const { CreateMLCEngine } = await import("https://esm.run/@mlc-ai/web-llm");
                window.CreateMLCEngine = CreateMLCEngine;
                console.log('✅ WebLLM import edildi');
            }
            
            console.log('🚀 WebLLM motoru başlatılıyor...');
            console.log('📦 Model:', this.selectedModel);
            
            // Model yükleme ilerlemesini göster
            const initProgressCallback = (report) => {
                console.log('📊 Model yükleme:', report);
                if (this.progressCallback) {
                    this.progressCallback(report);
                }
            };
            
            // Timeout ekle (2 dakika)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Model yükleme zaman aşımı (2 dakika)')), 120000);
            });
            
            // Engine oluştur (timeout ile)
            this.engine = await Promise.race([
                window.CreateMLCEngine(
                    this.selectedModel,
                    { 
                        initProgressCallback: initProgressCallback,
                        logLevel: 'INFO'
                    }
                ),
                timeoutPromise
            ]);
            
            this.isReady = true;
            this.isLoading = false;
            
            console.log('✅ WebLLM hazır!');
            return true;
            
        } catch (error) {
            console.error('❌ WebLLM başlatma hatası:', error);
            console.error('Hata detayı:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // WebGPU kontrolü
            if (navigator.gpu) {
                console.log('✅ WebGPU mevcut');
            } else {
                console.error('❌ WebGPU YOK! chrome://flags/#enable-unsafe-webgpu açın');
            }
            
            this.isLoading = false;
            this.isReady = false;
            
            // Kullanıcıya hata mesajı
            if (this.progressCallback) {
                this.progressCallback({
                    text: 'HATA: ' + error.message,
                    progress: 0
                });
            }
            
            return false;
        }
    }

    
    /**
     * Sohbet mesajı gönder
     */
    async chat(message, conversationHistory = []) {
        if (!this.isReady) {
            throw new Error('WebLLM hazır değil. Önce initialize() çağırın.');
        }
        
        try {
            console.log('💬 Mesaj gönderiliyor:', message);
            
            // Mesaj formatını oluştur
            const messages = [
                {
                    role: 'system',
                    content: 'Sen Tercih AI\'sın. Türk öğrencilere üniversite tercihi konusunda yardımcı oluyorsun. Cevaplarını Türkçe ver.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: message
                }
            ];
            
            // Yanıt al (streaming)
            let fullResponse = '';
            const completion = await this.engine.chat.completions.create({
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
                stream: true
            });
            
            // Stream'i oku
            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullResponse += content;
                console.log('📝 Chunk:', content);
            }
            
            console.log('✅ Yanıt tamamlandı:', fullResponse);
            return fullResponse;
            
        } catch (error) {
            console.error('❌ Chat hatası:', error);
            throw error;
        }
    }
    
    /**
     * Streaming chat (gerçek zamanlı)
     */
    async chatStream(message, conversationHistory = [], onChunk) {
        if (!this.isReady) {
            throw new Error('WebLLM hazır değil. Önce initialize() çağırın.');
        }
        
        try {
            console.log('💬 Streaming mesaj gönderiliyor:', message);
            
            const messages = [
                {
                    role: 'system',
                    content: 'Sen Tercih AI\'sın. Türk öğrencilere üniversite tercihi konusunda yardımcı oluyorsun. Cevaplarını Türkçe ver. Kısa ve öz yanıtlar ver.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: message
                }
            ];
            
            let fullResponse = '';
            const completion = await this.engine.chat.completions.create({
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
                stream: true
            });
            
            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    if (onChunk) {
                        onChunk(content, fullResponse);
                    }
                }
            }
            
            return fullResponse;
            
        } catch (error) {
            console.error('❌ Chat stream hatası:', error);
            throw error;
        }
    }
    
    /**
     * Üniversite analizi yap (özel prompt)
     */
    async analyzeUniversityChoice(userData) {
        const prompt = `
Öğrenci Bilgileri:
- TYT Sıralaması: ${userData.tytRanking}
- AYT Sıralaması: ${userData.aytRanking}
- Hayalindeki Bölüm: ${userData.dreamDept}
- Tercih Ettiği Şehirler: ${userData.cities}
- Bulunduğu İl: ${userData.location}

Lütfen bu öğrenciye üniversite tercihi konusunda rehberlik et. Hangi programlara başvurabileceğini, alternatif bölümleri ve stratejik tavsiyeleri ver.
`;
        
        return await this.chat(prompt);
    }
    
    /**
     * Modeli değiştir
     */
    async changeModel(modelName) {
        console.log('🔄 Model değiştiriliyor:', modelName);
        
        // Mevcut engine'i temizle
        if (this.engine) {
            this.engine = null;
        }
        
        this.isReady = false;
        this.selectedModel = modelName;
        
        // Yeni modeli yükle
        return await this.initialize(this.progressCallback);
    }
    
    /**
     * Kullanılabilir modelleri listele
     */
    getAvailableModels() {
        return [
            {
                id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
                name: 'Llama 3.1 8B',
                size: '4.8 GB',
                description: 'Yüksek kaliteli, dengeli performans (Önerilen)',
                recommended: true
            },
            {
                id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
                name: 'Phi-3 Mini',
                size: '2.4 GB',
                description: 'Küçük boyut, hızlı yanıt',
                recommended: false
            },
            {
                id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
                name: 'TinyLlama 1.1B',
                size: '800 MB',
                description: 'Çok hafif, düşük donanım için',
                recommended: false
            }
        ];
    }
    
    /**
     * Bellek kullanımını kontrol et
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
            };
        }
        return null;
    }
    
    /**
     * Engine'i temizle
     */
    cleanup() {
        if (this.engine) {
            console.log('🧹 WebLLM temizleniyor...');
            this.engine = null;
            this.isReady = false;
        }
    }
}

// Global instance oluştur
window.webLLMService = new WebLLMService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebLLMService;
}
