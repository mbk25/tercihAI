const API_URL = 'http://localhost:3000';

let conversationHistory = [];
let currentSession = {
    id: Date.now(),
    messages: []
};
let chatSessions = []; // Tüm sohbet oturumlarını sakla
let userProfile = null;
let selectedChats = new Set(); // Seçilen sohbetler
let isSelectionMode = false; // Seçim modu aktif mi?
let currentDepartment = null; // Analiz edilen bölümü sakla
let globalSelectedUniversities = []; // TÜM programlardan seçilen üniversiteler (Google Sheets için)
let aiInitialized = false;
let currentEligibleUniversities = []; // Uygun üniversiteleri sakla
let selectedUniversities = new Set(); // Seçilen üniversiteler

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // User profile kontrol
    checkUserProfile();

    // Google login butonuna event listener ekle
    setupGoogleLoginButton();

    // Seçimler butonuna event listener ekle
    const selectionsBtn = document.getElementById('selectionsBtn');
    if (selectionsBtn) {
        selectionsBtn.addEventListener('click', showSelectionsModal);
    }

    // AI'ı başlat
    initializeAI();

    // Analiz seçim kartları
    setupAnalysisChoiceCards();

    // AYT alan seçimi değiştiğinde dinamik alanları göster
    const aytAlanSelect = document.getElementById('aytAlan');
    if (aytAlanSelect) {
        aytAlanSelect.addEventListener('change', showAytNets);
    }

    // Hedef analizi form submit
    const hedefForm = document.getElementById('hedefAnalysisFormSubmit');
    if (hedefForm) {
        hedefForm.addEventListener('submit', handleHedefAnalysis);
    }

    // TYT net input validasyonları
    setupNetValidation('tytTurkce', 40);
    setupNetValidation('tytMat', 40);
    setupNetValidation('tytSosyal', 20);
    setupNetValidation('tytFen', 20);
});

// AI'ı başlat (Google AI Studio kullanarak)
async function initializeAI() {
    console.log('🤖 AI başlatılıyor...');
    aiInitialized = true;
    // Hoş geldin mesajını kaldırdık - Welcome screen zaten var
    // Her sayfa yenilemede boş sohbet eklenmesini önlemek için
}

// Mock AI yanıt oluşturucu
function generateMockResponse(message) {
    const lowerMsg = message.toLowerCase();

    // DGS soruları
    if (lowerMsg.includes('dgs')) {
        return 'DGS (Dikey Geçiş Sınavı), ön lisans mezunlarının lisans programlarına geçiş yapabilmesi için ÖSYM tarafından düzenlenen bir sınavdır.\n\n📚 İçeriği:\n- Sözel Bölüm (60 soru)\n- Sayısal Bölüm (60 soru)\n\n📅 Yılda 1 kez yapılır.\n\nDaha detaylı bilgi ister misiniz?';
    }

    // Tercih soruları
    if (lowerMsg.includes('tercih') || lowerMsg.includes('nasıl')) {
        return 'Üniversite tercihi yaparken şunlara dikkat edin:\n\n1️⃣ Sıralama durumunuzu kontrol edin\n2️⃣ Hedef bölümlerin taban puanlarına bakın\n3️⃣ Şehir tercihinizi belirleyin\n4️⃣ Alternatif bölümler düşünün\n\nAnaliz yapmak için "Analiz Yap" butonuna tıklayın!';
    }

    // Bölüm soruları
    if (lowerMsg.includes('bölüm') || lowerMsg.includes('mühendislik') || lowerMsg.includes('tıp')) {
        return 'Tercih edebileceğiniz bölümler sıralama durumunuza göre değişir.\n\n💡 Analiz yapmak için:\n- TYT ve AYT sıralama bilgilerinizi girin\n- Hayalinizdeki bölümü söyleyin\n- Size uygun alternatifleri göstereyim!\n\nHemen başlamak ister misiniz?';
    }

    // Genel sorular
    if (lowerMsg.includes('merhaba') || lowerMsg.includes('selam')) {
        return 'Merhaba! 👋\n\nSize üniversite tercihinizde yardımcı olacağım.\n\nNe yapmak istersiniz?\n- 📊 Tercih Analizi\n- 📚 DGS Bilgisi\n- 🎯 Bölüm Önerileri';
    }

    // Varsayılan yanıt
    return 'Anladım. Size daha iyi yardımcı olabilmem için lütfen daha detaylı bilgi verin.\n\nŞunları yapabilirim:\n✅ Üniversite tercih analizi\n✅ DGS hakkında bilgi\n✅ Bölüm önerileri\n\nNe hakkında konuşmak istersiniz?';
}

// User profile kontrol
checkUserProfile();

// Sohbet geçmişini yükle - Kaldırıldı: Her sayfa yenilediğinde boş sohbet eklenmesini önlemek için
// loadChatHistory();

// Google login buton kurulumu
function setupGoogleLoginButton() {
    const googleBtn = document.getElementById('googleLoginBtn');
    if (!googleBtn) {
        console.warn('Google login butonu bulunamadı');
        return;
    }

    // Eğer kullanıcı giriş yapmışsa
    if (userProfile && userProfile.name) {
        googleBtn.innerHTML = `
            <svg style="width: 16px; height: 16px; margin-right: 0.5rem; vertical-align: middle;" viewBox="0 0 24 24">
                <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/>
            </svg>
            Çıkış Yap
        `;
        googleBtn.style.background = '#ea4335';
        googleBtn.onclick = () => {
            console.log('🚪 Çıkış yapılıyor...');
            
            // NOT: Kullanıcı sohbetlerini SİLMİYORUZ - sadece session'ı temizliyoruz
            // Tekrar giriş yaptığında sohbetler geri gelecek
            console.log('ℹ️ Kullanıcı sohbetleri korunuyor (tekrar giriş için)');
            
            // Sadece profil ve token'ı temizle
            StorageHelper.removeItem('userProfile');
            StorageHelper.removeItem('authToken');
            console.log('✅ Profil ve token temizlendi');
            console.log('✅ Sohbet geçmişi korundu - Tekrar giriş yaptığınızda geri gelecek');
            
            // Sayfayı yenile - misafir moduna dön
            window.location.reload();
        };
    } else {
        // Giriş yapmamışsa
        googleBtn.onclick = (e) => {
            e.preventDefault();
            console.log('🔐 Google OAuth açılıyor...');
            const width = 500;
            const height = 600;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            window.open(
                `${API_URL}/auth/google`,
                'GoogleOAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        };
    }
}

// Artık buton yok, sadece context menu

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn?.addEventListener('click', startNewChat);
mobileMenuToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('active');
});

// Google login mesajlarını dinle
window.addEventListener('message', (event) => {
    if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        console.log('✅ Google girişi başarılı');
        location.reload();
    }
});

// Quick Start Form
document.getElementById('quickAnalysisForm')?.addEventListener('submit', handleQuickStart);

// Auto-resize textarea
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

// Suggestion cards
document.addEventListener('click', (e) => {
    if (e.target.closest('.suggestion-card')) {
        const prompt = e.target.closest('.suggestion-card').dataset.prompt;
        chatInput.value = prompt;
        sendMessage();
    }

    if (e.target.closest('.suggestion-btn')) {
        const buttonText = e.target.closest('.suggestion-btn').textContent.trim();

        // DGS ile ilgili butonlar
        if (buttonText.includes('DGS')) {
            showDGSInfo();
            return;
        }

        // Yeni analiz butonu
        if (buttonText.includes('Yeni analiz')) {
            window.location.reload();
            return;
        }

        // Üniversiteleri göster butonuna tıklanırsa
        if (buttonText.includes('Üniversiteleri Göster')) {
            showUniversitiesListModal();
            return;
        }

        // Kullanıcının önceki analiz verilerini al
        const lastAnalysis = window.lastAnalysisData || userProfile;

        // Kişiselleştirilmiş prompt oluştur
        let personalizedPrompt = buttonText;

        if (lastAnalysis) {
            // "Tercih analizi yapmak istiyorum" butonuna basıldıysa
            if (buttonText.includes('Tercih analizi')) {
                if (lastAnalysis.tytRanking || lastAnalysis.aytRanking || lastAnalysis.dreamDept) {
                    personalizedPrompt = `Benim TYT sıralamam: ${lastAnalysis.tytRanking || 'Belirtilmedi'}, AYT sıralamam: ${lastAnalysis.aytRanking || 'Belirtilmedi'}, hedef bölümüm: ${lastAnalysis.dreamDept || 'Belirtilmedi'}, tercih ettiğim şehirler: ${lastAnalysis.city || 'Fark etmez'}. Bu bilgilere göre detaylı bir tercih analizi yapar mısın?`;
                }
            }
            // "Hangi bölümü seçmeliyim?" butonuna basıldıysa
            else if (buttonText.includes('bölüm') || buttonText.includes('seçmeliyim')) {
                if (lastAnalysis.tytRanking || lastAnalysis.aytRanking) {
                    personalizedPrompt = `TYT sıralamam: ${lastAnalysis.tytRanking || 'Belirtilmedi'}, AYT sıralamam: ${lastAnalysis.aytRanking || 'Belirtilmedi'}. Bu sıralamalarla hangi bölümü seçmeliyim? İlgi alanlarım: ${lastAnalysis.dreamDept || 'Henüz karar vermedim'}`;
                }
            }
            // "En iyi üniversiteler hangileri?" butonuna basıldıysa
            else if (buttonText.includes('üniversite')) {
                if (lastAnalysis.aytRanking || lastAnalysis.tytRanking) {
                    personalizedPrompt = `TYT: ${lastAnalysis.tytRanking || 'Belirtilmedi'}, AYT: ${lastAnalysis.aytRanking || 'Belirtilmedi'} sıralamalı bir öğrenci için ${lastAnalysis.dreamDept || 'genel olarak'} bölümünde en iyi üniversiteler hangileri? Tercih ettiğim şehirler: ${lastAnalysis.city || 'Tüm Türkiye'}`;
                }
            }
        }

        // Personalized prompt'u mesaj alanına yaz ve gönder
        chatInput.value = personalizedPrompt;
        sendMessage();
    }
});

function startNewChat() {
    console.log('🔄 Yeni sohbet başlatılıyor...');

    // Mevcut sohbeti kaydet (sadece daha önce kaydedilmemişse)
    if (currentSession.messages.length > 0) {
        const existingIndex = chatSessions.findIndex(s => s.id === currentSession.id);
        if (existingIndex !== -1) {
            // Zaten kayıtlı, sadece güncelle
            chatSessions[existingIndex] = {
                ...currentSession,
                title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                timestamp: Date.now()
            };
        } else {
            // Yeni session, ekle
            chatSessions.push({
                ...currentSession,
                title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                timestamp: Date.now()
            });
        }
        saveChatHistory();
        updateChatHistory();
    }

    // Yeni sohbet başlat
    conversationHistory = [];
    currentSession = {
        id: Date.now(),
        messages: []
    };

    // History'yi güncelle ki aktif sohbet gösterilsin
    updateChatHistory();

    // Chat mesajlarını temizle ve welcome screen'i göster
    if (chatMessages) {
        chatMessages.innerHTML = '';

        // Welcome screen'i yeniden oluştur ve göster (Ana seçim ekranı ile)
        const welcomeHTML = `
            <div class="welcome-screen" id="welcomeScreen" style="display: block;">
                <div class="welcome-logo">🎓</div>
                <h1 class="gradient-text">Tercih AI'ya Hoş Geldiniz</h1>
                <p>Yapay zeka destekli üniversite tercih danışmanınız. Hemen başlayalım!</p>

                <!-- Ana Seçim Kutuları -->
                <div class="analysis-choice-container" id="analysisChoiceContainer">
                    <div class="analysis-card" id="tercihAnalysisCard">
                        <div class="card-icon">🎯</div>
                        <h3>Tercih Analizi Yap</h3>
                        <p>Sıralama bilgilerinle kazanabileceğin üniversite ve bölümleri keşfet</p>
                        <button class="choice-btn">Başla</button>
                    </div>

                    <div class="analysis-card" id="hedefAnalysisCard">
                        <div class="card-icon">🚀</div>
                        <h3>Hedef Analizi Yap</h3>
                        <p>Mevcut net durumunla hedefindeki bölümlere olan mesafeni öğren</p>
                        <button class="choice-btn">Başla</button>
                    </div>
                </div>

                <!-- Tercih Analizi Formu -->
                <div class="quick-start-form" id="tercihAnalysisForm" style="display: none;">
                    <button class="back-btn" id="backFromTercih">← Geri</button>
                    <h3>🎯 Tercih Analizi - Bilgilerinizi Girin</h3>
                    <form id="quickAnalysisForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>📘 TYT Sıralamanız *</label>
                                <input type="text" id="quickTytRanking" placeholder="Örn: 600.000" inputmode="numeric" required>
                                <small>2 yıllık programlar için</small>
                            </div>
                            
                            <div class="form-group">
                                <label>📗 AYT Sıralamanız *</label>
                                <input type="text" id="quickAytRanking" placeholder="Örn: 400.000" inputmode="numeric" required>
                                <small>4 yıllık programlar için</small>
                            </div>
                            
                            <div class="form-group">
                                <label>👤 Cinsiyet *</label>
                                <select id="quickGender" required>
                                    <option value="" disabled selected>Seçiniz</option>
                                    <option value="Erkek">Erkek</option>
                                    <option value="Kadın">Kadın</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>💭 Hayalinizdeki Bölüm *</label>
                                <input type="text" id="quickDept" placeholder="Örn: Bilgisayar Mühendisliği" required list="deptList">
                                <datalist id="deptList">
                                    <option value="Bilgisayar Mühendisliği">
                                    <option value="Makine Mühendisliği">
                                    <option value="Elektrik-Elektronik Mühendisliği">
                                    <option value="İnşaat Mühendisliği">
                                    <option value="Endüstri Mühendisliği">
                                    <option value="Tıp">
                                    <option value="Diş Hekimliği">
                                    <option value="Hukuk">
                                    <option value="İşletme">
                                    <option value="İktisat">
                                    <option value="Mimarlık">
                                    <option value="Psikoloji">
                                </datalist>
                            </div>
                            
                            <div class="form-group">
                                <label>🏙️ Tercih Ettiğiniz Şehirler *</label>
                                <input type="text" id="quickCity" placeholder="Örn: İstanbul, Ankara, İzmir" required>
                                <small>Virgülle ayırarak yazın veya "Fark etmez" yazın</small>
                            </div>
                            
                            <div class="form-group">
                                <label>📍 Bulunduğunuz İl *</label>
                                <input type="text" id="quickLocation" placeholder="Örn: İzmir" required>
                                <small>Ulaşım bilgisi için</small>
                            </div>
                            
                            <div class="form-group">
                                <label>🎓 Eğitim Türü Tercihi</label>
                                <select id="quickEduType">
                                    <option value="Tümü">Tümü (Devlet + Vakıf)</option>
                                    <option value="Devlet">Sadece Devlet Üniversiteleri</option>
                                    <option value="Vakıf">Sadece Vakıf Üniversiteleri</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" class="quick-start-btn">
                            🤖 Detaylı Analiz Yap
                        </button>
                    </form>
                </div>

                <!-- Hedef Analizi Formu -->
                <div class="quick-start-form" id="hedefAnalysisForm" style="display: none;">
                    <button class="back-btn" id="backFromHedef">← Geri</button>
                    <h3>🚀 Hedef Analizi - Mevcut Durumunuzu Girin</h3>
                    <form id="hedefAnalysisFormSubmit">
                        <div class="form-grid">
                            <!-- TYT Netleri -->
                            <div class="form-section">
                                <h4>📘 TYT Netleriniz</h4>
                                <div class="form-group">
                                    <label>Türkçe (Max: 40)</label>
                                    <input type="number" id="tytTurkce" placeholder="Örn: 25.75" min="0" max="40" step="0.01" required>
                                    <small>Ondalıklı net girebilirsiniz</small>
                                </div>
                                <div class="form-group">
                                    <label>Matematik (Max: 40)</label>
                                    <input type="number" id="tytMat" placeholder="Örn: 30.5" min="0" max="40" step="0.01" required>
                                    <small>Ondalıklı net girebilirsiniz</small>
                                </div>
                                <div class="form-group">
                                    <label>Sosyal Bilgiler (Max: 20)</label>
                                    <input type="number" id="tytSosyal" placeholder="Örn: 15.25" min="0" max="20" step="0.01" required>
                                    <small>Ondalıklı net girebilirsiniz</small>
                                </div>
                                <div class="form-group">
                                    <label>Fen Bilimleri (Max: 20)</label>
                                    <input type="number" id="tytFen" placeholder="Örn: 18.5" min="0" max="20" step="0.01" required>
                                    <small>Ondalıklı net girebilirsiniz</small>
                                </div>
                            </div>

                            <!-- AYT Alan Seçimi -->
                            <div class="form-section">
                                <h4>📗 AYT Alan Seçimi</h4>
                                <div class="form-group">
                                    <label>Alanınız *</label>
                                    <select id="aytAlan" required>
                                        <option value="" disabled selected>Seçiniz</option>
                                        <option value="sayisal">Sayısal (MF)</option>
                                        <option value="esit">Eşit Ağırlık (TM)</option>
                                        <option value="sozel">Sözel (TS)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- AYT Netleri (Dinamik) -->
                            <div class="form-section" id="aytNetsSection" style="display: none;">
                                <h4>📗 AYT Netleriniz</h4>
                                <div id="aytNetsContainer"></div>
                            </div>
                        </div>

                        <button type="submit" class="quick-start-btn">
                            🎯 Hedef Analizi Yap
                        </button>
                    </form>
                </div>

            </div>
        `;

        chatMessages.innerHTML = welcomeHTML;

        // Event listener'ları yeniden bağla
        setupAnalysisChoiceCards();
        
        const quickForm = document.getElementById('quickAnalysisForm');
        if (quickForm) {
            quickForm.addEventListener('submit', handleQuickStart);
        }

        const hedefForm = document.getElementById('hedefAnalysisFormSubmit');
        if (hedefForm) {
            hedefForm.addEventListener('submit', handleHedefAnalysis);
        }

        const aytAlanSelect = document.getElementById('aytAlan');
        if (aytAlanSelect) {
            aytAlanSelect.addEventListener('change', showAytNets);
        }

        // TYT validasyonları
        setupNetValidation('tytTurkce', 40);
        setupNetValidation('tytMat', 40);
        setupNetValidation('tytSosyal', 20);
        setupNetValidation('tytFen', 20);
    }

    console.log('✅ Yeni sohbet başlatıldı');
}

function generateChatTitle(firstMessage) {
    if (!firstMessage) return 'Yeni Sohbet';
    const text = firstMessage.content || firstMessage.text || '';
    return text.substring(0, 30) + (text.length > 30 ? '...' : '');
}

function updateChatHistory() {
    const historyContainer = document.getElementById('chatHistory');
    if (!historyContainer) return;

    // Son 10 sohbeti göster
    const recentSessions = chatSessions.slice(-10).reverse();

    historyContainer.innerHTML = recentSessions.map((session, index) => {
        const actualIndex = chatSessions.length - 1 - index;
        const isPinned = session.pinned ? '📌 ' : '';
        const isActive = currentSession.id === session.id ? 'active' : '';
        const isSelected = selectedChats.has(actualIndex) ? 'selected' : '';

        return `
        <div class="history-item ${session.pinned ? 'pinned' : ''} ${isActive} ${isSelected}"
             data-index="${actualIndex}"
             onclick="window.handleHistoryItemClick(event, ${actualIndex})"
             oncontextmenu="window.showChatContextMenu(event, ${actualIndex}); return false;">
            ${isSelectionMode ? `
                <input type="checkbox" 
                       class="chat-checkbox" 
                       ${selectedChats.has(actualIndex) ? 'checked' : ''}
                       onclick="event.stopPropagation(); window.toggleChatSelection(${actualIndex})">
            ` : ''}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>${isPinned}${session.title}</span>
        </div>
    `;
    }).join('');

    // Seçim modu butonlarını güncelle
    updateSelectionModeButtons();
}

// Global wrapper fonksiyonlar
window.loadChatSessionWrapper = function (sessionIndex) {
    loadChatSession(sessionIndex);
};

// History item click handler
window.handleHistoryItemClick = function (event, sessionIndex) {
    if (isSelectionMode) {
        toggleChatSelection(sessionIndex);
    } else {
        loadChatSession(sessionIndex);
    }
};

// Toggle chat selection
window.toggleChatSelection = function (sessionIndex) {
    if (selectedChats.has(sessionIndex)) {
        selectedChats.delete(sessionIndex);
        console.log(`➖ Sohbet ${sessionIndex} seçimden çıkarıldı. Toplam: ${selectedChats.size}`);
    } else {
        selectedChats.add(sessionIndex);
        console.log(`➕ Sohbet ${sessionIndex} seçildi. Toplam: ${selectedChats.size}`);
    }
    updateChatHistory();
};

// Enter selection mode
function enterSelectionMode() {
    console.log('✅ Seçim modu aktif edildi');
    isSelectionMode = true;
    selectedChats.clear();
    updateChatHistory();
}

// Exit selection mode
function exitSelectionMode() {
    console.log('❌ Seçim modundan çıkıldı');
    isSelectionMode = false;
    selectedChats.clear();
    updateChatHistory();
}

// Delete selected chats
function deleteSelectedChats() {
    console.log('🗑️ Silme fonksiyonu çağrıldı. Seçili sayı:', selectedChats.size);

    if (selectedChats.size === 0) {
        showToast('Lütfen silinecek sohbetleri seçin', 'error');
        return;
    }

    const count = selectedChats.size;
    if (!confirm(`${count} sohbeti silmek istediğinizden emin misiniz?`)) {
        console.log('❌ Silme işlemi iptal edildi');
        return;
    }

    console.log('🗑️ Siliniyor:', Array.from(selectedChats));

    // Seçili sohbetleri sil (büyükten küçüğe sıralayarak)
    const sortedIndices = Array.from(selectedChats).sort((a, b) => b - a);
    sortedIndices.forEach(index => {
        console.log(`  Siliniyor: Index ${index}`);
        chatSessions.splice(index, 1);
    });

    // Mevcut oturum silindiyse yeni oturum başlat
    const currentIndex = chatSessions.findIndex(s => s.id === currentSession.id);
    if (currentIndex === -1) {
        console.log('⚠️ Mevcut oturum silindi, yeni oturum başlatılıyor');
        startNewChat();
    }

    saveChatHistory();
    exitSelectionMode();

    // Başarı mesajı
    showToast(`${count} sohbet silindi`, 'success');
    console.log('✅ Silme işlemi tamamlandı');
}

// Select all chats
function selectAllChats() {
    const recentSessions = chatSessions.slice(-10).reverse();
    recentSessions.forEach((session, index) => {
        const actualIndex = chatSessions.length - 1 - index;
        selectedChats.add(actualIndex);
    });
    updateChatHistory();
}

// Update selection mode buttons
function updateSelectionModeButtons() {
    const historyHeader = document.querySelector('.history-header');
    if (!historyHeader) return;

    // Mevcut butonları temizle
    let selectionButtons = historyHeader.querySelector('.selection-buttons');
    if (selectionButtons) {
        selectionButtons.remove();
    }

    if (isSelectionMode) {
        // Seçim modu bilgi banner'ı
        const buttonsHtml = `
            <div class="selection-buttons" style="
                background: linear-gradient(135deg, rgba(16, 163, 127, 0.15), rgba(102, 126, 234, 0.15));
                border: 1px solid var(--primary);
                border-radius: 8px;
                padding: 0.75rem;
                margin-top: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--primary); font-weight: 700;">☑️ Seçim Modu</span>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">(${selectedChats.size} seçili)</span>
                </div>
                <button onclick="window.exitSelectionMode()" class="selection-btn-small" title="Çıkış">
                    ✕
                </button>
            </div>
        `;
        historyHeader.insertAdjacentHTML('beforeend', buttonsHtml);
    }
}

// Global fonksiyonlar
window.enterSelectionMode = enterSelectionMode;
window.exitSelectionMode = exitSelectionMode;
window.deleteSelectedChats = deleteSelectedChats;
window.selectAllChats = selectAllChats;

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10a37f' : type === 'error' ? '#ef4444' : '#667eea'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Context menu için global fonksiyonlar
window.showChatContextMenu = function (event, sessionIndex) {
    event.preventDefault();
    event.stopPropagation();

    // Önceki context menu'yu kaldır
    const existingMenu = document.getElementById('chatContextMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const session = chatSessions[sessionIndex];
    if (!session) return;

    // Context menu oluştur
    const menu = document.createElement('div');
    menu.id = 'chatContextMenu';
    menu.style.cssText = `
        position: fixed;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 0.5rem 0;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        min-width: 180px;
    `;

    // Seçim moduna göre menü öğeleri
    const menuItems = [];

    // Normal modda gösterilecek öğeler
    if (!isSelectionMode) {
        menuItems.push({
            icon: '✏️',
            text: 'Adını Değiştir',
            action: () => renameChatSession(sessionIndex)
        });
        menuItems.push({
            icon: session.pinned ? '📌' : '📍',
            text: session.pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle',
            action: () => togglePinChatSession(sessionIndex)
        });
    }

    // Çoklu seçim / Seçilenleri sil
    menuItems.push({
        icon: '☑️',
        text: isSelectionMode ? `Seçilenleri Sil (${selectedChats.size})` : 'Çoklu Seçim',
        action: () => {
            console.log('Menu clicked! isSelectionMode:', isSelectionMode, 'selectedChats:', selectedChats.size);
            if (isSelectionMode) {
                deleteSelectedChats();
            } else {
                enterSelectionMode();
            }
        },
        highlight: isSelectionMode,
        danger: isSelectionMode && selectedChats.size > 0
    });

    // Normal modda tek sohbet silme
    if (!isSelectionMode) {
        menuItems.push({
            icon: '🗑️',
            text: 'Sohbeti Sil',
            action: () => deleteChatSession(sessionIndex),
            danger: true
        });
    }

    // Seçim modundan çıkış
    if (isSelectionMode) {
        menuItems.push({
            icon: '✕',
            text: 'Seçimden Çık',
            action: () => exitSelectionMode()
        });
    }

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: ${item.danger ? '#ef4444' : '#f1f5f9'};
            transition: background 0.2s;
        `;
        menuItem.innerHTML = `<span>${item.icon}</span><span>${item.text}</span>`;

        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = '#334155';
        });
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });

        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // Dışarı tıklandığında menüyü kapat
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

function renameChatSession(sessionIndex) {
    const session = chatSessions[sessionIndex];
    if (!session) return;

    const newName = prompt('Yeni sohbet adı:', session.title);
    if (newName && newName.trim()) {
        chatSessions[sessionIndex].title = newName.trim();
        saveChatHistory();
        updateChatHistory();
    }
}

function togglePinChatSession(sessionIndex) {
    const session = chatSessions[sessionIndex];
    if (!session) return;

    chatSessions[sessionIndex].pinned = !session.pinned;

    // Sabitlenen sohbetleri sıralama: sabitli olanlar başta
    chatSessions.sort((a, b) => {
        if (a.pinned && !b.pinned) return 1;
        if (!a.pinned && b.pinned) return -1;
        return 0;
    });

    saveChatHistory();
    updateChatHistory();
}

function deleteChatSession(sessionIndex) {
    const session = chatSessions[sessionIndex];
    if (!session) return;

    chatSessions.splice(sessionIndex, 1);
    saveChatHistory();
    updateChatHistory();

    // Eğer silinen sohbet aktif sohbet ise yeni sohbet başlat
    if (currentSession.id === session.id) {
        startNewChat();
    }
}

// "Yeni Sohbet" için context menu
window.showNewChatContextMenu = function (event) {
    event.preventDefault();
    event.stopPropagation();

    // Önceki context menu'yu kaldır
    const existingMenu = document.getElementById('chatContextMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Context menu oluştur
    const menu = document.createElement('div');
    menu.id = 'chatContextMenu';
    menu.style.cssText = `
        position: fixed;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 0.5rem 0;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        min-width: 200px;
    `;

    const menuItems = [
        {
            icon: '🗑️',
            text: 'Tüm Geçmişi Temizle',
            action: () => clearAllChatHistory(),
            danger: true
        }
    ];

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: ${item.danger ? '#ef4444' : '#f1f5f9'};
            transition: background 0.2s;
        `;
        menuItem.innerHTML = `<span>${item.icon}</span><span>${item.text}</span>`;

        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = '#334155';
        });
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });

        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // Dışarı tıklandığında menüyü kapat
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

function clearAllChatHistory() {
    chatSessions = [];
    saveChatHistory();
    updateChatHistory();
}

function loadChatSession(sessionIndex) {
    const session = chatSessions[sessionIndex];
    if (!session) return;

    // Eğer zaten bu session aktifse hiçbir şey yapma
    if (currentSession.id === session.id) {
        return;
    }

    // Mevcut sohbeti kaydet (sadece daha önce kaydedilmemişse)
    if (currentSession.messages.length > 0) {
        const existingIndex = chatSessions.findIndex(s => s.id === currentSession.id);
        if (existingIndex !== -1) {
            // Sadece mevcut session'ı güncelle, yeni ekleme
            chatSessions[existingIndex] = {
                ...currentSession,
                title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                timestamp: Date.now()
            };
            saveChatHistory();
        } else {
            // Yeni session ise ekle
            chatSessions.push({
                ...currentSession,
                title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                timestamp: Date.now()
            });
            saveChatHistory();
        }
    }

    // Seçilen sohbeti yükle
    currentSession = { ...session };
    conversationHistory = session.conversationHistory || [];

    // Mesajları göster
    if (chatMessages) {
        chatMessages.innerHTML = '';
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        session.messages.forEach(msg => {
            // Eğer analiz sonucu mesajıysa, kartları yeniden oluştur
            if (msg.isAnalysisResult && msg.analysisData) {
                console.log('🔄 Analiz kartları yeniden yükleniyor...', msg.analysisData);
                displayComprehensiveResultsFromSaved(msg.analysisData);
                return;
            }

            // Mesajı DOM'a eklerken currentSession'a eklemeyi önle
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type || msg.role}`;

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = (msg.type === 'user' || msg.role === 'user') ? '👤' : '🤖';

            const content = document.createElement('div');
            content.className = 'message-content';

            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            messageText.textContent = msg.content || msg.text;

            content.appendChild(messageText);

            // Add suggestions if provided
            if (msg.suggestions && msg.suggestions.length > 0) {
                const suggestionsDiv = document.createElement('div');
                suggestionsDiv.className = 'message-suggestions';

                msg.suggestions.forEach(suggestion => {
                    const btn = document.createElement('button');
                    btn.className = 'suggestion-btn';
                    btn.textContent = suggestion;
                    suggestionsDiv.appendChild(btn);
                });

                content.appendChild(suggestionsDiv);
            }

            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);

            chatMessages.appendChild(messageDiv);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateChatHistory();
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Hide welcome screen
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        // Check if it's a form submission
        if (isFormData(message)) {
            const formData = parseFormData(message);
            await handleAnalysis(formData);
        } else {
            // AI kullan (WebLLM veya Mock)
            if (!webllmInitialized) {
                removeTypingIndicator(typingId);
                addMessage('⏳ AI henüz hazır değil...', 'ai');
                return;
            }

            removeTypingIndicator(typingId);
            const streamingTypingId = showTypingIndicator();

            try {
                // WebLLM mevcutsa kullan, yoksa basit yanıt ver
                let aiResponse;

                if (window.webLLMService && window.webLLMService.isReady) {
                    console.log('💬 WebLLM kullanılıyor');
                    aiResponse = await window.webLLMService.chatStream(
                        message,
                        conversationHistory,
                        (chunk, fullText) => { }
                    );
                } else {
                    // Mock AI - Basit yanıtlar
                    console.log('💬 Mock AI kullanılıyor');
                    aiResponse = generateMockResponse(message);
                }

                removeTypingIndicator(streamingTypingId);
                addMessage(aiResponse, 'ai', []);

                conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: aiResponse }
                );

            } catch (error) {
                removeTypingIndicator(streamingTypingId);
                console.error('❌ AI hatası:', error);

                // Fallback yanıt
                const fallbackResponse = generateMockResponse(message);
                addMessage(fallbackResponse, 'ai', []);
            }
        }

    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin. Server çalışıyor mu kontrol edin: npm start', 'ai');
        console.error('Error:', error);
    }
}

function isFormData(message) {
    const formKeywords = ['sıralama', 'cinsiyet', 'bölüm', 'şehir'];
    return formKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

function parseFormData(message) {
    // Simple parsing - can be improved
    return {
        ranking: extractNumber(message),
        gender: extractGender(message),
        dreamDept: extractDepartment(message),
        city: extractCity(message),
        currentLocation: extractCity(message)
    };
}

function extractNumber(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function extractGender(text) {
    if (text.toLowerCase().includes('erkek')) return 'Erkek';
    if (text.toLowerCase().includes('kadın')) return 'Kadın';
    return 'Belirtmek İstemiyorum';
}

function extractDepartment(text) {
    const departments = [
        'Bilgisayar Mühendisliği', 'Makine Mühendisliği', 'Tıp',
        'Hukuk', 'İşletme', 'Elektrik-Elektronik Mühendisliği',
        'Mimarlık', 'Psikoloji'
    ];

    for (let dept of departments) {
        if (text.toLowerCase().includes(dept.toLowerCase())) {
            return dept;
        }
    }
    return 'Bilgisayar Mühendisliği';
}

function extractCity(text) {
    const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
    for (let city of cities) {
        if (text.toLowerCase().includes(city.toLowerCase())) {
            return city;
        }
    }
    return 'İstanbul';
}

async function handleAnalysis(formData) {
    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        // Format and display results
        let resultText = `📊 **Analiz Sonuçları**\n\n${data.recommendation}\n\n`;

        if (data.isEligible && data.universities.length > 0) {
            resultText += `🎓 **Size Uygun Üniversiteler:**\n\n`;
            data.universities.slice(0, 5).forEach((uni, index) => {
                resultText += `${index + 1}. ${uni.name}\n`;
                resultText += `   📍 ${uni.city} - ${uni.campus}\n`;
                resultText += `   🎯 Taban Sıralama: ~${uni.ranking.toLocaleString('tr-TR').replace(/,/g, '.')}\n`;
                resultText += `   👥 Kontenjan: ${uni.quota}\n`;

                // ÖSYM Şart Maddelerini göster
                if (uni.conditionNumbers && uni.conditionNumbers.trim()) {
                    resultText += `   📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}\n`;
                }
                resultText += `\n`;
            });
        }

        // Alternatif önerilerini sakla
        window.currentAnalysisData = data;

        const suggestions = [];

        addMessage(resultText, 'ai', suggestions);

    } catch (error) {
        addMessage('Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
        console.error('Analysis error:', error);
    }
}

function addMessage(text, type, suggestions = [], skipSessionSave = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = text;

    content.appendChild(messageText);

    // Add suggestions if provided
    if (suggestions && suggestions.length > 0) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'message-suggestions';

        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = suggestion;
            suggestionsDiv.appendChild(btn);
        });

        content.appendChild(suggestionsDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Mesajı mevcut oturuma ekle (eğer skipSessionSave true değilse)
    if (!skipSessionSave) {
        currentSession.messages.push({
            content: text,
            text: text,
            type: type,
            role: type === 'user' ? 'user' : 'assistant',
            suggestions: suggestions,
            timestamp: Date.now()
        });

        // Session'ı her mesajda kaydet ve history'yi güncelle
        if (currentSession.messages.length > 0) {
            const existingIndex = chatSessions.findIndex(s => s.id === currentSession.id);
            if (existingIndex !== -1) {
                chatSessions[existingIndex] = {
                    ...currentSession,
                    title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                    timestamp: Date.now()
                };
            } else {
                // İlk mesajsa, session'ı history'ye ekle
                chatSessions.push({
                    ...currentSession,
                    title: generateChatTitle(currentSession.messages[0]) || 'Yeni Sohbet',
                    timestamp: Date.now()
                });
            }
            saveChatHistory();
            updateChatHistory(); // History'yi güncelle ki aktif sohbet görünsün
        }
    }
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typing-' + Date.now();

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    content.appendChild(typing);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingDiv.id;
}

function removeTypingIndicator(id) {
    const typing = document.getElementById(id);
    if (typing) {
        typing.remove();
    }
}

// User Profile Check
function checkUserProfile() {
    try {
        const profile = StorageHelper.getItem('userProfile');
        if (profile) {
            userProfile = JSON.parse(profile);
            console.log('👤 Kullanıcı profili yüklendi:', userProfile.name || userProfile.email);
            
            // Google ID'yi kontrol et
            if (userProfile.googleId) {
                console.log('🔑 Google ID:', userProfile.googleId);
            }
            
            // MİSAFİR SOHBETLERİNİ TEMİZLE
            console.log('🗑️ Misafir sohbetleri temizleniyor...');
            StorageHelper.removeItem('chatSessions_guest');
            
            updateUserUI();

            // Kullanıcıya özel sohbet geçmişini yükle
            console.log('📂 Kullanıcıya özel sohbet geçmişi yükleniyor...');
            loadChatHistory();
        } else {
            console.log('👤 Misafir kullanıcı - Guest mode');
            userProfile = null;
            
            // Misafir için misafir sohbetlerini yükle
            console.log('📂 Misafir sohbet geçmişi yükleniyor...');
            loadChatHistory();
        }
    } catch (e) {
        console.warn('Profil yüklenemedi:', e);
        userProfile = null;
        // Hata durumunda da misafir sohbetlerini yükle
        loadChatHistory();
    }
}

function updateUserUI() {
    const userNameEl = document.querySelector('.user-name');
    const avatarEl = document.querySelector('.avatar');

    if (userProfile && userProfile.name) {
        // Kullanıcı adını güncelle
        if (userNameEl) userNameEl.textContent = userProfile.name;

        // Avatar'ı güncelle
        if (avatarEl) {
            if (userProfile.picture) {
                // Google'dan gelen profil fotoğrafı varsa kullan
                avatarEl.innerHTML = `<img src="${userProfile.picture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                // Profil fotoğrafı yoksa varsayılan emoji kullan
                avatarEl.textContent = '👤';
            }
        }
    } else {
        // Giriş yapmamış kullanıcı
        if (userNameEl) userNameEl.textContent = 'Misafir';
        if (avatarEl) avatarEl.textContent = '👤';
    }

    // Google login butonunu her zaman kuruluma gönder
    setupGoogleLoginButton();
}

// Bilgi formu açma
function openAnalysisForm() {
    // Yeni pencerede form aç
    const formWindow = window.open('/form.html', 'TercihFormu', 'width=700,height=800');

    // Mesaj dinle
    window.addEventListener('message', async (event) => {
        if (event.data.type === 'ANALYSIS_FORM') {
            const formData = event.data.data;

            // Chat'e ekle
            const message = `Bilgilerimi girmek istiyorum:\n\n📘 TYT Sıralama: ${formData.tytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}\n📗 AYT Sıralama: ${formData.aytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}\nCinsiyet: ${formData.gender}\nHedef Bölüm: ${formData.dreamDept}\nŞehirler: ${formData.city}\nBulunduğum Yer: ${formData.currentLocation}`;

            addMessage(message, 'user');

            const typingId = showTypingIndicator();

            try {
                // Analiz yap
                const response = await fetch(`${API_URL}/api/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                removeTypingIndicator(typingId);

                // Sonuçları göster
                let resultText = `📊 **Analiz Tamamlandı!**\n\n${data.recommendation}\n\n`;

                if (data.isEligible && data.universities.length > 0) {
                    resultText += `🎓 **Size Uygun Üniversiteler:**\n\n`;
                    data.universities.slice(0, 10).forEach((uni, index) => {
                        resultText += `${index + 1}. ${uni.name}\n`;
                        resultText += `   📍 ${uni.city} - ${uni.campus}\n`;
                        resultText += `   🎯 Taban Sıralama: ~${uni.ranking.toLocaleString('tr-TR').replace(/,/g, '.')}\n`;
                        resultText += `   👥 Kontenjan: ${uni.quota}\n`;

                        // ÖSYM Şart Maddelerini göster
                        if (uni.conditionNumbers && uni.conditionNumbers.trim()) {
                            resultText += `   📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}\n`;
                        }
                        resultText += `\n`;
                    });
                }

                // Alternatif önerilerini sakla
                window.currentAnalysisData = data;

                const suggestions = data.isEligible
                    ? ['Detaylı bilgi ver', 'Excel raporu oluştur', 'Başka bölüm sor']
                    : ['🔍 Alternatif Programları Göster', 'Detaylı bilgi ver', 'Başka bölüm sor'];

                addMessage(resultText, 'ai', suggestions);

            } catch (error) {
                removeTypingIndicator(typingId);
                addMessage('Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
            }
        }
    });
}

// Quick Start Handler
// Sayı formatlaması için yardımcı fonksiyonlar
function formatNumberWithDots(value) {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    // Nokta ile formatlama (10.000 formatı)
    return parseInt(numericValue, 10).toLocaleString('tr-TR').replace(/,/g, '.');
}

function parseFormattedNumber(value) {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
}

async function handleQuickStart(e) {
    e.preventDefault();

    // Formatlanmış değerleri sayıya çevir
    const tytValue = document.getElementById('quickTytRanking').value;
    const aytValue = document.getElementById('quickAytRanking').value;

    const formData = {
        tytRanking: parseFormattedNumber(tytValue),
        aytRanking: parseFormattedNumber(aytValue),
        gender: document.getElementById('quickGender').value,
        dreamDept: document.getElementById('quickDept').value.trim(),
        city: document.getElementById('quickCity').value.trim(),
        currentLocation: document.getElementById('quickLocation').value.trim(),
        educationType: document.getElementById('quickEduType').value
    };

    // Kullanıcı verilerini global olarak kaydet (butonlar için)
    window.lastAnalysisData = formData;
    console.log('💾 Analiz verileri kaydedildi:', formData);

    console.log('📋 Form Data:', formData);

    if (!formData.tytRanking || !formData.aytRanking || !formData.gender || !formData.dreamDept || !formData.city || !formData.currentLocation) {
        const form = document.getElementById('quickAnalysisForm');
        form.classList.add('error-shake');
        setTimeout(() => form.classList.remove('error-shake'), 500);

        const emptyFields = [];
        if (!formData.tytRanking) emptyFields.push('TYT Sıralama');
        if (!formData.aytRanking) emptyFields.push('AYT Sıralama');
        if (!formData.gender) emptyFields.push('Cinsiyet');
        if (!formData.dreamDept) emptyFields.push('Hedef Bölüm');
        if (!formData.city) emptyFields.push('Şehirler');
        if (!formData.currentLocation) emptyFields.push('Bulunduğunuz Yer');

        alert(`❌ Lütfen şu alanları doldurun:\n${emptyFields.join('\n')}`);
        return;
    }

    // Success animation
    const form = document.getElementById('quickAnalysisForm');
    form.classList.add('success-animation');
    setTimeout(() => form.classList.remove('success-animation'), 600);

    // Welcome screen'i gizle
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // Kullanıcı mesajı ekle
    const userMessage = `📋 Tercih Analizi Bilgilerim:

📘 TYT Sıralama: ${formData.tytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}
📗 AYT Sıralama: ${formData.aytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}
👤 Cinsiyet: ${formData.gender}
💭 Hedef Bölüm: ${formData.dreamDept}
🏙️ Tercih Şehirleri: ${formData.city}
📍 Bulunduğum Yer: ${formData.currentLocation}
🎓 Tercih: ${formData.educationType === 'Tümü' ? 'Devlet + Vakıf' : formData.educationType === 'Devlet' ? 'Sadece Devlet' : 'Sadece Vakıf'}`;

    addMessage(userMessage, 'user');

    // Detaylı analiz yap
    await performDetailedAnalysis(formData);
}

async function performDetailedAnalysis(formData) {
    const typingId = showTypingIndicator();

    try {
        console.log('🚀 Sending to API:', formData);
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📊 Response data:', data);

        removeTypingIndicator(typingId);

        // Detaylı sonuç göster
        console.log('📋 Passing to displayComprehensiveResults:', { data, formData });
        displayComprehensiveResults(data, formData);

    } catch (error) {
        removeTypingIndicator(typingId);
        console.error('❌ Analiz hatası:', error);
        console.error('❌ Error stack:', error.stack);
        addMessage(`Analiz yapılırken bir hata oluştu: ${error.message || 'Sunucuya bağlanılamıyor'}. Lütfen backend'in çalıştığından emin olun.`, 'ai');
    }
}

// Kaydedilmiş analiz verilerinden kartları yeniden oluştur
function displayComprehensiveResultsFromSaved(analysisData) {
    console.log('🔄 Kaydedilmiş analiz yeniden yükleniyor:', analysisData);
    const { formData, tytRanking, aytRanking, ...data } = analysisData;
    console.log('📊 FormData:', formData);
    console.log('📊 Data:', data);
    displayComprehensiveResults(data, formData);
}

function displayComprehensiveResults(data, formData) {
    console.log('🎨 displayComprehensiveResults called with:', {
        dataKeys: Object.keys(data),
        formDataKeys: Object.keys(formData),
        tytRanking: formData.tytRanking || data.tytRanking,
        aytRanking: formData.aytRanking || data.aytRanking
    });

    // Kullanıcı verilerini global olarak kaydet (butonlar için)
    window.lastAnalysisData = formData;
    console.log('💾 Analiz verileri güncellendi:', formData);

    // TYT ve AYT sıralamalarını güvenli al
    const tytRanking = formData.tytRanking || data.tytRanking || 0;
    const aytRanking = formData.aytRanking || data.aytRanking || 0;

    // resultText değişkenini tanımla (eski fonksiyonlar için)
    let resultText = '';

    // Analiz sonuçlarını mesaj geçmişine kaydet (sadece yeni analiz ise)
    const hasExistingAnalysis = currentSession.messages.some(m => m.isAnalysisResult);
    if (!hasExistingAnalysis) {
        const analysisMessage = {
            type: 'ai',
            role: 'assistant',
            content: 'Tercih analizi tamamlandı',
            isAnalysisResult: true,
            analysisData: {
                ...data,
                formData: formData,
                tytRanking,
                aytRanking
            },
            timestamp: Date.now()
        };
        currentSession.messages.push(analysisMessage);

        // Session'ı hemen kaydet
        const existingIndex = chatSessions.findIndex(s => s.id === currentSession.id);
        if (existingIndex !== -1) {
            chatSessions[existingIndex] = { ...currentSession };
        } else {
            chatSessions.push({ ...currentSession });
        }
        saveChatHistory();
        console.log('✅ Analiz sonucu session\'a kaydedildi');
    }

    // ⚠️ Cin siyet Kısıtlaması Kontrolü (Ebelik)
    if (data.status === 'gender_restriction') {
        console.log('⚠️ Cinsiyet kısıtlaması tespit edildi - Özel uyarı kartı gösteriliyor');

        // Uyarı kartı oluştur
        const warningContainer = document.createElement('div');
        warningContainer.style.cssText = `
            max-width: 1000px;
            margin: 2rem auto;
            padding: 0 1rem;
        `;

        const warningCard = document.createElement('div');
        warningCard.style.cssText = `
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
            border: 2px solid #ef4444;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
        `;

        warningCard.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: #ef4444; margin: 0 0 1rem 0; font-size: 1.8rem; font-weight: 800;">
                    ${data.warning.title}
                </h2>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <p style="color: #1e293b; font-size: 1.1rem; line-height: 1.8; margin: 0;">
                    ${data.warning.description}
                </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.7); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0;">
                    <strong>ℹ️ Neden?</strong><br>
                    ${data.warning.reason}
                </p>
            </div>

            <div style="margin-top: 2rem;">
                <h3 style="color: #10a37f; font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem;">
                    ${data.alternatives.title}
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${data.alternatives.departments.map(dept => `
                        <div style="
                            background: linear-gradient(135deg, rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05));
                            border: 2px solid #10a37f;
                            border-radius: 15px;
                            padding: 1.5rem;
                            transition: all 0.3s ease;
                            cursor: pointer;
                        " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(16,163,127,0.3)';" 
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${dept.icon}</div>
                            <h4 style="color: #10a37f; font-size: 1.1rem; font-weight: 700; margin: 0 0 0.5rem 0;">
                                ${dept.name}
                            </h4>
                            <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">
                                ${dept.description}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                        border: 2px solid #3b82f6; 
                        border-radius: 16px; 
                        padding: 2rem; 
                        margin-top: 2rem;
                        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);">
                <div style="color: #1e293b; font-size: 1.1rem; line-height: 2; white-space: pre-line; font-weight: 500;">
                    ${data.recommendation}
                </div>
            </div>
        `;

        warningContainer.appendChild(warningCard);
        chatMessages.appendChild(warningContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return; // Fonksiyondan çık
    }

    // Grid container oluştur (bilgi kartları için) - 3 sütun
    const infoGridContainer = document.createElement('div');
    infoGridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        max-width: 1400px;
        margin: 1.5rem auto;
        padding: 0 1rem;
    `;

    // Responsive için media query ekle
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 1200px) {
            .info-grid-container {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        @media (max-width: 768px) {
            .info-grid-container {
                grid-template-columns: 1fr !important;
            }
        }
    `;
    if (!document.querySelector('#info-grid-style')) {
        style.id = 'info-grid-style';
        document.head.appendChild(style);
    }
    infoGridContainer.className = 'info-grid-container';

    // Bilgi kartını ekle
    const infoCard = createInfoCard(formData, tytRanking, aytRanking);
    infoGridContainer.appendChild(infoCard);

    if (data.isEligible && data.universities.length > 0) {
        // Başarı mesajını ekle
        const successCard = createSuccessCard(formData.dreamDept);
        infoGridContainer.appendChild(successCard);

        // Grid'i chat'e ekle
        chatMessages.appendChild(infoGridContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Üniversite özet kartını göster (TÜM üniversiteleri gönder, sadece özet gösterilecek)
        setTimeout(() => {
            addUniversityCardsInBoxes(data.universities, formData);
        }, 500);

    } else {
        // Durum kartını ekle
        const statusCard = createStatusCard(
            formData.dreamDept, 
            aytRanking, 
            data.highestAcceptedRanking, 
            data.rankingType
        );
        infoGridContainer.appendChild(statusCard);

        if (data.alternatives && data.alternatives.length > 0) {
            console.log('🔍 Toplam alternatif:', data.alternatives.length);

            // Alternatifleri filtrele
            const fourYear = data.alternatives.filter(a => a.type === "4 Yıllık" && a.available === true);
            const twoYear = data.alternatives.filter(a => a.type === "2 Yıllık" && a.available === true);

            console.log('📚 4 yıllık available:', fourYear.length);
            console.log('🎓 2 yıllık available:', twoYear.length);
            console.log('2 yıllık detay:', twoYear);

            if (fourYear.length > 0) {
                setTimeout(() => {
                    addAlternativeCards(fourYear, 'Size Uygun 4 Yıllık Lisans Programları', '#60a5fa', '📚');
                }, 500);
            }

            // 2 yıllık alternatifler + DGS yolu
            if (twoYear.length > 0) {
                console.log('✅ 2 yıllık alternatif gösterilecek!');
                // DGS kartını oluştur ve grid'e ekle
                const dgsAdvantagesCard = document.createElement('div');
                dgsAdvantagesCard.className = 'result-card';
                dgsAdvantagesCard.style.cssText = `
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 163, 127, 0.2));
                    border: 2px solid #f59e0b;
                    border-radius: 12px;
                    padding: 1rem;
                    animation: scaleIn 0.5s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                `;

                dgsAdvantagesCard.innerHTML = `
                    <div style="text-align: center; margin-bottom: 0.8rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.3rem;">🎯</div>
                        <h3 style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.3rem; font-weight: 800;">
                            DGS Stratejisi
                        </h3>
                        <p style="color: var(--text-secondary); font-size: 0.75rem; margin: 0;">
                            Alternatif yol
                        </p>
                    </div>
                    
                    <div style="background: var(--bg-dark); border-radius: 8px; padding: 0.8rem; flex: 1;">
                        <h4 style="color: #10a37f; font-size: 0.9rem; margin-bottom: 0.6rem; font-weight: 700;">
                            Avantajlar
                        </h4>
                        <div style="display: grid; gap: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #10a37f; font-size: 1rem;">✅</span>
                                <span style="color: var(--text-primary); font-size: 0.75rem;">2 yılda meslek</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #10a37f; font-size: 1rem;">✅</span>
                                <span style="color: var(--text-primary); font-size: 0.75rem;">Çalışarak kazanç</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #10a37f; font-size: 1rem;">✅</span>
                                <span style="color: var(--text-primary); font-size: 0.75rem;">DGS ile geçiş</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #10a37f; font-size: 1rem;">✅</span>
                                <span style="color: var(--text-primary); font-size: 0.75rem;">Deneyim + diploma</span>
                            </div>
                        </div>
                    </div>
                `;

                // DGS kartını grid'e ekle
                infoGridContainer.appendChild(dgsAdvantagesCard);

                // Grid'i chat'e ekle
                chatMessages.appendChild(infoGridContainer);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                setTimeout(() => {
                    addAlternativeCards(twoYear, 'Size Uygun 2 Yıllık Önlisans Programları', '#f59e0b', '🎓');
                }, 1000);
            }
        }

    }

    // Analiz sonuçlarını sakla
    window.currentAnalysisData = {
        ...data,
        formData: formData
    };
}

// Chat mesaj analizini güncelle
const originalSendMessage = sendMessage;
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Welcome screen'i gizle
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // Kullanıcı mesajı ekle
    addMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Typing indicator göster
    const typingId = showTypingIndicator();

    try {
        // API'ye normal chat mesajı gönder
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                conversationHistory
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        removeTypingIndicator(typingId);

        // AI yanıtını ekle
        addMessage(data.response.text, 'ai', data.response.suggestions);

        // Conversation history güncelle
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.response.text }
        );

        // Conversation history'yi session'a kaydet
        currentSession.conversationHistory = [...conversationHistory];

    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
        console.error('Error:', error);
    }
}

// Bu bölüm silindi - yukarıdaki event listener ile birleştirildi

function showDGSInfo() {
    const dgsInfo = `📚 **DGS (Dikey Geçiş Sınavı) Rehberi**

🎯 **DGS Nedir?**
2 yıllık önlisans (MYO) programlarını bitiren öğrencilerin, 4 yıllık lisans programlarına geçiş yapabilmesini sağlayan merkezi bir sınavdır.

⏰ **Ne Zaman Yapılır?**
• Her yıl Haziran ayında
• Kayıt: Nisan-Mayıs
• Sonuç: Temmuz

📝 **Sınav İçeriği:**
• Temel Matematik
• Türkçe
• ALES tarzı sorular
• Toplam 120 soru, 150 dakika

🎓 **Kimler Girebilir?**
✅ 2 yıllık önlisans mezunları
✅ Son sınıf öğrencileri (mezun olacaklar)
✅ Tüm mezuniyet yılları (yaş sınırı yok)

💡 **Avantajları:**
✅ Önce meslek sahibi ol (2 yıl)
✅ Çalışırken 4 yıllık okuyabilirsin
✅ YKS'ye göre daha az rekabet
✅ Bölüm değişikliği şansı
✅ İş deneyimi + Diploma = Güçlü CV
✅ Her yıl girebilirsin

📈 **Başarı Stratejisi:**

**1. Hazırlık Süreci (1 yıl öneriliyor):**
• Online kurslar (Hocalara Geldik, vs)
• DGS kaynak kitapları
• Deneme sınavları
• Hedef belirle (hangi üniversite/bölüm)

**2. Puan Hedefi:**
• İyi üniversite: 70-80+
• Orta üniversite: 60-70
• Tercih edilebilir: 55+

**3. Başarı Oranları:**
• Genel: %15-25
• Hazırlananlar: %40-50
• Kurslu: %60-70

🎯 **Popüler Geçişler:**

**Bilgisayar Alanı:**
• Bilgisayar Programcılığı → Bilgisayar Mühendisliği
• Web Tasarım → Yazılım Mühendisliği
• Bilgisayar Teknolojisi → Bilgisayar Mühendisliği

**Sağlık Alanı:**
• Tıbbi Laboratuvar → Hemşirelik
• Anestezi → Hemşirelik
• İlk Yardım → Sağlık Yönetimi

**İşletme Alanı:**
• Muhasebe → İşletme
• Dış Ticaret → Uluslararası Ticaret
• Pazarlama → İşletme

💰 **Maliyetler:**
• Sınav ücreti: ~200-300 TL
• Kurs (opsiyonel): 2000-5000 TL
• Kaynak kitaplar: 500-1000 TL

🔥 **Önemli İpuçları:**
1️⃣ 2 yıllık bölümünü iyi not ortalamasıyla bitir
2️⃣ En az 1 yıl önce hazırlığa başla
3️⃣ Hedef üniversiteyi araştır (kontenjan, puan)
4️⃣ Düzenli çalış, deneme çöz
5️⃣ Çalışırken hazırlanabilirsin!

💪 **Motivasyon:**
DGS ile hayalindeki 4 yıllık bölümü kazanmak mümkün! 
Birçok öğrenci bu yolla başarılı oldu. 
Sen de başarabilirsin! 🚀

İstersen örnek bir yol haritası çıkarabilirim. Ne dersin?`;

    addMessage(dgsInfo, 'ai', [
        'DGS yol haritası oluştur',
        'Başka bölüm öner',
        'Yeni analiz yap'
    ]);
}

// Alternatif Programları Göster Modal
function showAlternativesModal() {
    if (!window.currentAnalysisData || !window.currentAnalysisData.alternatives) {
        addMessage('❌ Önce bir tercih analizi yapmanız gerekiyor.', 'ai', ['Bilgilerimi girmek istiyorum']);
        return;
    }

    const data = window.currentAnalysisData;
    const alternatives = data.alternatives;
    const selectedCities = data.selectedCities || [];

    // Modal HTML oluştur
    const modalHTML = `
    <div id="alternativesModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
        <div style="background: #1e293b; border-radius: 16px; max-width: 1200px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="closeAlternativesModal()" style="position: absolute; top: 20px; right: 20px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            
            <h2 style="color: #10a37f; font-size: 28px; margin-bottom: 10px; text-align: center;">🎯 Alternatif Program Önerileri</h2>
            <p style="text-align: center; color: #94a3b8; margin-bottom: 10px;">
                📗 AYT Sıralamanız: <strong style="color: #60a5fa;">${data.aytRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</strong> | 
                📘 TYT Sıralamanız: <strong style="color: #f59e0b;">${data.tytRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</strong>
            </p>
            <p style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 30px;">4 yıllık programlara AYT, 2 yıllık programlara TYT ile girilir</p>
            
            <div id="alternativesContent"></div>
        </div>
    </div>
    `;

    // Modal'ı sayfaya ekle
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);

    // İçeriği oluştur
    const contentDiv = document.getElementById('alternativesContent');

    // 4 yıllık programlar
    const fourYear = alternatives.filter(a => a.type === "4 Yıllık");
    const twoYear = alternatives.filter(a => a.type === "2 Yıllık" && a.dgs);

    let contentHTML = '';

    if (fourYear.length > 0) {
        contentHTML += `
        <div style="background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #334155;">
            <h3 style="color: #60a5fa; font-size: 22px; margin-bottom: 20px;">📚 4 Yıllık Lisans Programları</h3>
            <p style="color: #94a3b8; margin-bottom: 10px;">AYT sıralamanıza (${data.aytRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}) uygun benzer alandaki 4 yıllık programlar</p>
            <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">📗 4 yıllık ve üstü programlara AYT sınavı ile girilir</p>
        `;

        fourYear.forEach((alt, idx) => {
            contentHTML += `
            <div style="background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #60a5fa;">
                <h4 style="color: #fff; font-size: 18px; margin-bottom: 10px;">${idx + 1}. ${alt.dept}</h4>
                <p style="color: #94a3b8; margin-bottom: 15px;">ℹ️ ${alt.description}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #0f172a; padding: 10px; border-radius: 8px;">
                        <span style="color: #10a37f;">🎯 Taban Sıralama:</span><br>
                        <strong style="color: #fff;">~${alt.threshold.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
                    </div>
                    <div style="background: #0f172a; padding: 10px; border-radius: 8px;">
                        <span style="color: #10a37f;">🎓 Program Türü:</span><br>
                        <strong style="color: #fff;">${alt.type}</strong>
                    </div>
                </div>
                ${alt.universities && alt.universities.length > 0 ? `
                    <button onclick="showUniversitiesForProgram('${alt.dept.replace(/'/g, "\\'")}')" style="background: #10a37f; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
                        🏛️ ${alt.universities.length} Üniversiteyi Görüntüle (Devlet/Özel + Burs Bilgileri)
                    </button>
                ` : ''}
            </div>
            `;
        });

        contentHTML += `</div>`;
    }

    // 2 yıllık programlar + DGS
    if (twoYear.length > 0) {
        contentHTML += `
        <div style="background: #0f172a; border-radius: 12px; padding: 25px; border: 2px solid #334155;">
            <h3 style="color: #f59e0b; font-size: 22px; margin-bottom: 20px;">🎯 2 Yıllık Önlisans + DGS Stratejisi</h3>
            <p style="color: #94a3b8; margin-bottom: 10px;">TYT sıralamanıza (${data.tytRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}) uygun önlisans programları</p>
            <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">📘 2 yıllık programlara TYT sınavı ile girilir, ardından DGS ile 4 yıllığa geçilebilir</p>
            <div style="background: linear-gradient(135deg, #f59e0b22, #10a37f22); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #f59e0b;">
                <h4 style="color: #fff; margin-bottom: 15px;">✨ Bu strateji neden avantajlı?</h4>
                <ul style="color: #94a3b8; list-style: none; padding: 0;">
                    <li style="margin-bottom: 8px;">✅ 2 yılda meslek sahibi olursunuz</li>
                    <li style="margin-bottom: 8px;">✅ Çalışarak para kazanabilirsiniz</li>
                    <li style="margin-bottom: 8px;">✅ DGS ile hedef bölümünüze geçiş şansı</li>
                    <li style="margin-bottom: 8px;">✅ İş deneyimi + 4 yıllık diploma birlikte!</li>
                    <li style="margin-bottom: 8px;">✅ Toplam 4 yılda lisans + deneyim</li>
                </ul>
            </div>
        `;

        twoYear.forEach((alt, idx) => {
            contentHTML += `
            <div style="background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                <h4 style="color: #fff; font-size: 18px; margin-bottom: 10px;">${idx + 1}. ${alt.dept}</h4>
                <p style="color: #94a3b8; margin-bottom: 15px;">ℹ️ ${alt.description}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #0f172a; padding: 10px; border-radius: 8px;">
                        <span style="color: #f59e0b;">🎯 Taban Sıralama:</span><br>
                        <strong style="color: #fff;">~${alt.threshold.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
                    </div>
                    <div style="background: #0f172a; padding: 10px; border-radius: 8px;">
                        <span style="color: #f59e0b;">🎓 Program Türü:</span><br>
                        <strong style="color: #fff;">${alt.type}</strong>
                    </div>
                    <div style="background: #0f172a; padding: 10px; border-radius: 8px;">
                        <span style="color: #f59e0b;">🔄 DGS:</span><br>
                        <strong style="color: #10a37f;">Mümkün!</strong>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h5 style="color: #f59e0b; margin-bottom: 10px;">📅 DGS Yol Haritası:</h5>
                    <div style="color: #94a3b8; line-height: 1.8;">
                        <div style="margin-bottom: 8px;">1️⃣ <strong style="color: #fff;">1-2. Yıl:</strong> ${alt.dept} programında okuyun (part-time çalışabilirsiniz)</div>
                        <div style="margin-bottom: 8px;">2️⃣ <strong style="color: #fff;">Mezuniyet:</strong> Önlisans diploması + meslek sahibi olun</div>
                        <div style="margin-bottom: 8px;">3️⃣ <strong style="color: #fff;">Hazırlık:</strong> 6-12 ay DGS'ye yoğun hazırlanın</div>
                        <div style="margin-bottom: 8px;">4️⃣ <strong style="color: #fff;">3-4. Yıl:</strong> Hedef bölümünüzde 3. sınıftan devam edin</div>
                        <div style="background: #10a37f22; padding: 10px; border-radius: 6px; border: 1px solid #10a37f;">
                            <strong style="color: #10a37f;">✨ Sonuç:</strong> <span style="color: #fff;">Toplam 4 yıl + iş deneyimi + Lisans diploması!</span>
                        </div>
                    </div>
                </div>

                ${alt.universities && alt.universities.length > 0 ? `
                    <button onclick="showUniversitiesForProgram('${alt.dept.replace(/'/g, "\\'")}')" style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
                        🏛️ ${alt.universities.length} Üniversiteyi Görüntüle (Devlet/Özel + Burs Bilgileri)
                    </button>
                ` : ''}
            </div>
            `;
        });

        contentHTML += `
            <div style="background: linear-gradient(135deg, #10a37f22, #60a5fa22); padding: 20px; border-radius: 10px; margin-top: 20px; border: 1px solid #10a37f;">
                <h4 style="color: #fff; margin-bottom: 15px;">💡 DGS Hakkında Bilmeniz Gerekenler</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
                        <div style="color: #10a37f; margin-bottom: 8px;">📅 Sınav Tarihi</div>
                        <div style="color: #fff;">Her yıl Haziran ayında</div>
                    </div>
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
                        <div style="color: #10a37f; margin-bottom: 8px;">📊 Başarı Oranı</div>
                        <div style="color: #fff;">Kursa giderek: %55-70</div>
                    </div>
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
                        <div style="color: #10a37f; margin-bottom: 8px;">💰 Maliyet</div>
                        <div style="color: #fff;">700-6,000 TL arası</div>
                    </div>
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
                        <div style="color: #10a37f; margin-bottom: 8px;">⏱️ Hazırlık Süresi</div>
                        <div style="color: #fff;">6-12 ay öneriliyor</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    if (fourYear.length === 0 && twoYear.length === 0) {
        contentHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
            <div style="font-size: 48px; margin-bottom: 20px;">😔</div>
            <h3 style="color: #fff; margin-bottom: 10px;">Alternatif program bulunamadı</h3>
            <p>Sıralamanıza uygun alternatif program maalesef bulunamadı. Lütfen farklı bir bölüm ile tekrar deneyin.</p>
        </div>
        `;
    }

    contentDiv.innerHTML = contentHTML;

    // Üniversiteleri modal içinde gösterme fonksiyonu
    window.showUniversitiesForProgram = function (programName) {
        const program = alternatives.find(a => a.dept === programName);
        if (!program || !program.universities) return;

        const universitiesHTML = `
        <div id="universitiesSubModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
            <div style="background: #1e293b; border-radius: 16px; max-width: 1000px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
                <button onclick="closeUniversitiesModal()" style="position: absolute; top: 20px; right: 20px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                
                <h2 style="color: #10a37f; font-size: 24px; margin-bottom: 20px;">🏛️ ${programName}</h2>
                <p style="color: #94a3b8; margin-bottom: 30px;">Sıralamanıza ve seçtiğiniz şehirlere uygun üniversiteler ${selectedCities.length > 0 ? '(' + selectedCities.join(', ') + ')' : ''}</p>
                
                <div style="display: grid; gap: 20px;">
                    ${program.universities.map((uni, idx) => `
                        <div style="background: #0f172a; border-radius: 12px; padding: 20px; border-left: 4px solid ${(uni.type === 'Özel' || uni.type === 'Vakıf' || uni.type === 'VAKIF') ? '#f59e0b' : '#10a37f'};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <h4 style="color: #fff; font-size: 18px; margin: 0;">${uni.name}</h4>
                                <span style="background: ${(uni.type === 'Özel' || uni.type === 'Vakıf' || uni.type === 'VAKIF') ? '#f59e0b' : '#10a37f'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${(uni.type === 'Özel' || uni.type === 'Vakıf' || uni.type === 'VAKIF') ? 'Vakıf Üniversitesi' : 'Devlet Üniversitesi'}</span>
                            </div>
                            
                            <div style="display: grid; gap: 8px; font-size: 15px; color: #e2e8f0; margin-bottom: 15px;">
                                <div>📍 ${uni.city}</div>
                                <div>🏫 ${uni.campus || 'Merkez Kampüs'}</div>
                                <div>📊 Taban Sıralama: ${uni.ranking.toLocaleString('tr-TR').replace(/,/g, '.')}</div>
                                <div>👥 Kontenjan: ${uni.quota || 'N/A'}</div>
                                ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: ${(uni.type === 'Özel' || uni.type === 'Vakıf' || uni.type === 'VAKIF') ? '#f59e0b' : '#10a37f'}; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                            </div>
                            
                            ${uni.type === 'Özel' && uni.scholarship ? `
                            <div style="background: linear-gradient(135deg, #f59e0b22, #10a37f22); padding: 12px; border-radius: 8px; border: 1px solid #f59e0b; margin-bottom: 15px;">
                                <div style="color: #f59e0b; font-size: 13px; margin-bottom: 5px; font-weight: 600;">🎓 Burs İmkanları</div>
                                <div style="color: #fff; font-size: 14px;">${uni.scholarship}</div>
                            </div>
                            ` : ''}
                            
                            <button onclick="closeUniversitiesModal(); setTimeout(() => showUniversityDetailModal(${JSON.stringify(uni).replace(/"/g, '&quot;')}, {name: '${programName}', minRanking: ${uni.ranking}, quota: '${uni.quota || 'N/A'}'}), 300)" 
                                style="width: 100%; background: linear-gradient(135deg, ${(uni.type === 'Özel' || uni.type === 'Vakıf' || uni.type === 'VAKIF') ? '#f59e0b, #d97706' : '#10a37f, #0d8a6a'}); color: white; border: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'" 
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'">
                                🔍 Detaylı Bilgi (ÖSYM Şartları + Harita)
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `;

        const subModalDiv = document.createElement('div');
        subModalDiv.innerHTML = universitiesHTML;
        document.body.appendChild(subModalDiv);
    };

    window.closeUniversitiesModal = function () {
        const subModal = document.getElementById('universitiesSubModal');
        if (subModal) {
            subModal.parentElement.remove();
        }
    };
}

window.closeAlternativesModal = function () {
    const modal = document.getElementById('alternativesModal');
    if (modal) {
        modal.parentElement.remove();
    }
};

// Üniversite Listesi Modal
function showUniversitiesListModal() {
    const data = window.currentAnalysisData;
    if (!data || !data.formData) {
        addMessage('❌ Analiz verisi bulunamadı. Lütfen önce analiz yapın.', 'ai');
        return;
    }

    const formData = data.formData;
    const selectedCities = formData.city ? formData.city.split(',').map(c => c.trim().toLowerCase()) : [];
    const dreamDept = formData.dreamDept;
    const aytRanking = formData.aytRanking || data.aytRanking || 0;
    const tytRanking = formData.tytRanking || data.tytRanking || 0;
    const educationType = formData.educationType || 'Tümü';
    const isEligible = data.isEligible || false;

    // Sıralama yetiyorsa hayalindeki bölümü, yetmiyorsa alternatifleri göster
    let modalTitle, modalSubtitle;

    if (isEligible) {
        modalTitle = `🏛️ ${dreamDept} Üniversiteleri`;
        modalSubtitle = '✅ Sıralamanız yeterli! Gidebileceğiniz üniversiteler:';
    } else {
        modalTitle = `🎯 Alternatif Programlar ve Üniversiteler`;
        modalSubtitle = '⚠️ Hayalinizdeki bölüm için sıralama yeterli değil. Size uygun alternatifler:';
    }

    // Eğitim türü bilgisini ekle
    let educationTypeText = '';
    if (educationType && educationType !== 'Tümü') {
        educationTypeText = ` | 🏫 ${educationType} Üniversiteleri`;
    }

    // Modal HTML
    const modalHTML = `
    <div id="universitiesListModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
        <div style="background: #1e293b; border-radius: 16px; max-width: 1200px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="closeUniversitiesListModal()" style="position: absolute; top: 20px; right: 20px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            
            <h2 style="color: #10a37f; font-size: 28px; margin-bottom: 10px; text-align: center;">${modalTitle}</h2>
            <p style="text-align: center; color: #94a3b8; margin-bottom: 10px;">${modalSubtitle}</p>
            <p style="text-align: center; color: #94a3b8; margin-bottom: 10px;">
                📗 AYT Sıralamanız: <strong style="color: #60a5fa;">${aytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</strong> | 
                📘 TYT Sıralamanız: <strong style="color: #f59e0b;">${tytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
            </p>
            <p style="text-align: center; color: #94a3b8; margin-bottom: 30px;">
                📍 Şehirler: <strong style="color: #10a37f;">${selectedCities.length > 0 ? selectedCities.join(', ').toUpperCase() : 'TÜM TÜRKİYE'}</strong>${educationTypeText}
            </p>
            
            <div id="universitiesListContent"></div>
        </div>
    </div>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);

    // Üniversiteleri göster
    if (isEligible) {
        // Sıralama yetiyorsa hayalindeki bölümü göster
        displayUniversitiesList(dreamDept, aytRanking, selectedCities, educationType);
    } else {
        // Sıralama yetmiyorsa alternatifleri göster
        displayAlternativeUniversities(data, selectedCities);
    }
}

async function displayUniversitiesList(dreamDept, aytRanking, selectedCities, educationType) {
    const contentDiv = document.getElementById('universitiesListContent');
    contentDiv.innerHTML = '<p style="text-align: center; color: #94a3b8;">⏳ Üniversiteler yükleniyor...</p>';

    // Analiz edilen bölümü sakla
    window.currentDepartment = dreamDept;

    try {
        // API'den üniversiteleri çek
        const response = await fetch(`${API_URL}/api/universities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                department: dreamDept,
                ranking: aytRanking,
                cities: selectedCities,
                educationType: educationType || 'Tümü'
            })
        });

        const universities = await response.json();

        console.log('🏛️ Gelen üniversite sayısı:', universities.length);
        console.log('🏛️ İlk üniversite örneği:', universities[0]);

        if (!universities || universities.length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <p style="font-size: 48px; margin-bottom: 20px;">🏫</p>
                    <p style="font-size: 18px; margin-bottom: 10px;">Seçtiğiniz şehirlerde üniversite bulunamadı</p>
                    <p style="font-size: 14px;">Farklı şehirler seçerek tekrar deneyin</p>
                </div>
            `;
            return;
        }

        // Debug: Tüm unique type değerlerini kontrol et
        const uniqueTypes = [...new Set(universities.map(u => u.type))];
        console.log('📊 Gelen type değerleri:', uniqueTypes);
        console.log('📊 İlk 3 üniversite örneği:', universities.slice(0, 3));

        // Devlet ve vakıf üniversiteleri ayır
        const devlet = universities.filter(u => u.type === 'Devlet' || u.type === 'DEVLET');
        const ozel = universities.filter(u => u.type === 'Özel' || u.type === 'Vakıf' || u.type === 'VAKIF' || u.type === 'Vakif');

        console.log('🏛️ Devlet üniversiteleri:', devlet.length);
        console.log('🏛️ Özel üniversiteler:', ozel.length);

        let contentHTML = '';

        // Devlet Üniversiteleri
        if (devlet.length > 0) {
            contentHTML += `
            <div style="background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #10a37f;">
                <h3 style="color: #10a37f; font-size: 22px; margin-bottom: 20px;">🏛️ Devlet Üniversiteleri (${devlet.length})</h3>
                <div style="display: grid; gap: 15px;">
                    ${devlet.map((uni, idx) => {
                const program = uni.programs && uni.programs[0];
                return `
                        <div style="background: #1e293b; border-radius: 10px; padding: 20px; border-left: 4px solid #10a37f;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <h4 style="color: #fff; font-size: 18px; margin: 0; flex: 1;">${uni.name}</h4>
                                <span style="background: #10a37f; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">🏛️ DEVLET</span>
                            </div>
                            
                            <div style="display: grid; gap: 8px; font-size: 15px; color: #e2e8f0; margin-bottom: 15px;">
                                <div>📍 ${uni.city}</div>
                                <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                                <div>📊 Taban Sıralama: ${program?.minRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                                <div>👥 Kontenjan: ${program?.quota || 'N/A'}</div>
                                ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #10a37f; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                            </div>
                            
                            <button onclick="showUniversityDetailModal(${JSON.stringify(uni).replace(/"/g, '&quot;')}, ${JSON.stringify(program || {}).replace(/"/g, '&quot;')})" 
                                style="width: 100%; background: linear-gradient(135deg, #10a37f, #0d8a6a); color: white; border: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 163, 127, 0.4)'" 
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 163, 127, 0.3)'">
                                🔍 Detaylı Bilgi (ÖSYM Şartları + Harita)
                            </button>
                        </div>
                        `;
            }).join('')}
                </div>
            </div>
            `;
        }

        // Özel Üniversiteler
        if (ozel.length > 0) {
            contentHTML += `
            <div style="background: #0f172a; border-radius: 12px; padding: 25px; border: 2px solid #f59e0b;">
                <h3 style="color: #f59e0b; font-size: 22px; margin-bottom: 20px;">💼 Özel/Vakıf Üniversiteleri (${ozel.length})</h3>
                <div style="display: grid; gap: 15px;">
                    ${ozel.map((uni, idx) => {
                const program = uni.programs && uni.programs[0];
                return `
                        <div style="background: #1e293b; border-radius: 10px; padding: 20px; border-left: 4px solid #f59e0b;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <h4 style="color: #fff; font-size: 18px; margin: 0; flex: 1;">${uni.name}</h4>
                                <span style="background: #f59e0b; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">💼 VAKIF</span>
                            </div>
                            
                            <div style="display: grid; gap: 8px; font-size: 15px; color: #e2e8f0; margin-bottom: 15px;">
                                <div>📍 ${uni.city}</div>
                                <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                                <div>📊 Taban Sıralama: ${program?.minRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                                <div>👥 Kontenjan: ${program?.quota || 'N/A'}</div>
                                ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #f59e0b; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                            </div>
                            
                            <button onclick="showUniversityDetailModal(${JSON.stringify(uni).replace(/"/g, '&quot;')}, ${JSON.stringify(program || {}).replace(/"/g, '&quot;')})" 
                                style="width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(245, 158, 11, 0.4)'" 
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.3)'">
                                🔍 Detaylı Bilgi (ÖSYM Şartları + Harita)
                            </button>
                        </div>
                        `;
            }).join('')}
                </div>
            </div>
            `;
        }

        // Hiç üniversite bulunamadıysa
        if (contentHTML === '') {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <p style="font-size: 48px; margin-bottom: 20px;">📊</p>
                    <p style="font-size: 18px; margin-bottom: 10px;">Üniversiteler listeleniyor...</p>
                    <p style="font-size: 14px;">Toplam ${universities.length} üniversite bulundu</p>
                    <div style="margin-top: 20px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                        <p style="color: #f59e0b; font-size: 14px; margin-bottom: 10px;">Debug Bilgisi:</p>
                        <pre style="background: #0f172a; padding: 15px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${JSON.stringify(universities.slice(0, 2), null, 2)}</pre>
                    </div>
                </div>
            `;
        } else {
            contentDiv.innerHTML = contentHTML;
        }

    } catch (error) {
        console.error('❌ Üniversite listesi hatası:', error);
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p style="font-size: 48px; margin-bottom: 20px;">⚠️</p>
                <p style="font-size: 18px; margin-bottom: 10px;">Üniversite verileri yüklenirken hata oluştu</p>
                <p style="font-size: 14px;">${error.message}</p>
            </div>
        `;
    }
}

// Alternatif Bölümler İçin Üniversiteleri Göster
async function displayAlternativeUniversities(data, selectedCities) {
    const contentDiv = document.getElementById('universitiesListContent');
    contentDiv.innerHTML = '<p style="text-align: center; color: #94a3b8;">⏳ Alternatif programlar yükleniyor...</p>';

    try {
        const alternatives = data.alternatives || [];

        if (!alternatives || alternatives.length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <p style="font-size: 48px; margin-bottom: 20px;">😔</p>
                    <p style="font-size: 18px; margin-bottom: 10px;">Alternatif program bulunamadı</p>
                    <p style="font-size: 14px;">Lütfen farklı bir analiz yapın</p>
                </div>
            `;
            return;
        }

        // 4 yıllık ve 2 yıllık programları ayır
        const fourYear = alternatives.filter(a => a.type === "4 Yıllık");
        const twoYear = alternatives.filter(a => a.type === "2 Yıllık");

        let contentHTML = '';

        // 4 Yıllık Programlar
        if (fourYear.length > 0) {
            contentHTML += `
            <div style="background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #60a5fa;">
                <h3 style="color: #60a5fa; font-size: 22px; margin-bottom: 15px;">📚 4 Yıllık Lisans Programları</h3>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
                    AYT sıralamanıza uygun benzer alandaki 4 yıllık programlar ve üniversiteleri
                </p>
            `;

            for (const alt of fourYear) {
                const universities = alt.universities || [];

                contentHTML += `
                <div style="background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #60a5fa;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h4 style="color: #fff; font-size: 18px; margin-bottom: 8px;">📖 ${alt.dept}</h4>
                            <p style="color: #94a3b8; font-size: 14px;">${alt.description}</p>
                        </div>
                        <span style="background: #60a5fa; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">4 YILLIK</span>
                    </div>
                    
                    <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                            <div>
                                <span style="color: #60a5fa; font-size: 12px;">🎯 Taban Sıralama</span><br>
                                <strong style="color: #fff;">~${alt.threshold?.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
                            </div>
                            <div>
                                <span style="color: #60a5fa; font-size: 12px;">📊 Sınav Türü</span><br>
                                <strong style="color: #fff;">${alt.examType || 'AYT'}</strong>
                            </div>
                            <div>
                                <span style="color: #60a5fa; font-size: 12px;">🏛️ Üniversite Sayısı</span><br>
                                <strong style="color: #fff;">${universities.length}</strong>
                            </div>
                        </div>
                    </div>
                    
                    ${universities.length > 0 ? `
                        <div style="background: #0f172a; border-radius: 8px; padding: 15px;">
                            <h5 style="color: #60a5fa; font-size: 15px; margin-bottom: 15px;">🏛️ Gidebileceğiniz Üniversiteler:</h5>
                            <div style="display: grid; gap: 12px;">
                                ${universities.slice(0, 10).map((uni, idx) => `
                                    <div style="background: #1e293b; border-radius: 8px; padding: 15px; border-left: 3px solid ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'};">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                            <h6 style="color: #fff; font-size: 15px; margin: 0; flex: 1;">${uni.name}</h6>
                                            <span style="background: ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                                ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '🏛️ Devlet' : '💼 Vakıf'}
                                            </span>
                                        </div>
                                        
                                        <div style="display: grid; gap: 6px; font-size: 14px; color: #e2e8f0; margin-bottom: 12px;">
                                            <div>📍 ${uni.city}</div>
                                            <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                                            <div>🎯 Taban Sıralama: ${uni.ranking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                                            <div>👥 Kontenjan: ${uni.quota || 'N/A'}</div>
                                            ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'}; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                                        </div>
                                        
                                        ${uni.scholarship ? `
                                            <div style="background: linear-gradient(135deg, #f59e0b22, #10a37f22); padding: 10px; border-radius: 6px; border: 1px solid #f59e0b; margin-bottom: 12px;">
                                                <p style="color: #f59e0b; font-weight: 600; font-size: 12px; margin-bottom: 4px;">🎓 Burs İmkanı:</p>
                                                <p style="color: #94a3b8; font-size: 11px;">${uni.scholarship}</p>
                                            </div>
                                        ` : ''}
                                        
                                        <button onclick="showUniversityDetailModal(${JSON.stringify(uni).replace(/"/g, '&quot;')}, {name: '${uni.programName || ''}', minRanking: ${uni.ranking}, quota: '${uni.quota}'})" 
                                            style="width: 100%; background: linear-gradient(135deg, ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f, #0d8a6a' : '#f59e0b, #d97706'}); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'" 
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'">
                                            🔍 Detaylı Bilgi (ÖSYM Şartları + Harita)
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<p style="color: #94a3b8; text-align: center; padding: 20px;">Seçtiğiniz şehirlerde üniversite bulunamadı</p>'}
                </div>
                `;
            }

            contentHTML += `</div>`;
        }

        // 2 Yıllık Programlar + DGS
        if (twoYear.length > 0) {
            contentHTML += `
            <div style="background: #0f172a; border-radius: 12px; padding: 25px; border: 2px solid #f59e0b;">
                <h3 style="color: #f59e0b; font-size: 22px; margin-bottom: 15px;">🎯 2 Yıllık Önlisans + DGS Stratejisi</h3>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
                    TYT sıralamanıza uygun önlisans programları. DGS ile 4 yıllığa geçiş şansı!
                </p>
            `;

            for (const alt of twoYear) {
                const universities = alt.universities || [];

                contentHTML += `
                <div style="background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h4 style="color: #fff; font-size: 18px; margin-bottom: 8px;">📖 ${alt.dept}</h4>
                            <p style="color: #94a3b8; font-size: 14px;">${alt.description}</p>
                        </div>
                        <span style="background: #f59e0b; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">2 YILLIK</span>
                    </div>
                    
                    <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                            <div>
                                <span style="color: #f59e0b; font-size: 12px;">🎯 Taban Sıralama</span><br>
                                <strong style="color: #fff;">~${alt.threshold?.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
                            </div>
                            <div>
                                <span style="color: #f59e0b; font-size: 12px;">📊 Sınav Türü</span><br>
                                <strong style="color: #fff;">${alt.examType || 'TYT'}</strong>
                            </div>
                            <div>
                                <span style="color: #f59e0b; font-size: 12px;">🔄 DGS</span><br>
                                <strong style="color: #10a37f;">${alt.dgs ? 'Mümkün!' : 'Yok'}</strong>
                            </div>
                            <div>
                                <span style="color: #f59e0b; font-size: 12px;">🏛️ Üniversite</span><br>
                                <strong style="color: #fff;">${universities.length}</strong>
                            </div>
                        </div>
                    </div>
                    
                    ${universities.length > 0 ? `
                        <div style="background: #0f172a; border-radius: 8px; padding: 15px;">
                            <h5 style="color: #f59e0b; font-size: 15px; margin-bottom: 15px;">🏛️ Gidebileceğiniz Üniversiteler:</h5>
                            <div style="display: grid; gap: 12px;">
                                ${universities.slice(0, 10).map((uni, idx) => `
                                    <div style="background: #1e293b; border-radius: 8px; padding: 15px; border-left: 3px solid ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'};">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                            <h6 style="color: #fff; font-size: 15px; margin: 0; flex: 1;">${uni.name}</h6>
                                            <span style="background: ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                                ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '🏛️ Devlet' : '💼 Vakıf'}
                                            </span>
                                        </div>
                                        
                                        <div style="display: grid; gap: 6px; font-size: 14px; color: #e2e8f0; margin-bottom: 12px;">
                                            <div>📍 ${uni.city}</div>
                                            <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                                            <div>🎯 Taban Sıralama: ${uni.ranking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                                            <div>👥 Kontenjan: ${uni.quota || 'N/A'}</div>
                                            ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f' : '#f59e0b'}; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                                        </div>
                                        
                                        ${uni.scholarship ? `
                                            <div style="background: linear-gradient(135deg, #f59e0b22, #10a37f22); padding: 10px; border-radius: 6px; border: 1px solid #f59e0b; margin-bottom: 12px;">
                                                <p style="color: #f59e0b; font-weight: 600; font-size: 12px; margin-bottom: 4px;">🎓 Burs İmkanı:</p>
                                                <p style="color: #94a3b8; font-size: 11px;">${uni.scholarship}</p>
                                            </div>
                                        ` : ''}
                                        
                                        <button onclick="showUniversityDetailModal(${JSON.stringify(uni).replace(/"/g, '&quot;')}, {name: '${uni.programName || ''}', minRanking: ${uni.ranking}, quota: '${uni.quota}'})" 
                                            style="width: 100%; background: linear-gradient(135deg, ${(uni.type === 'Devlet' || uni.type === 'DEVLET') ? '#10a37f, #0d8a6a' : '#f59e0b, #d97706'}); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'" 
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'">
                                            🔍 Detaylı Bilgi (ÖSYM Şartları + Harita)
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<p style="color: #94a3b8; text-align: center; padding: 20px;">Seçtiğiniz şehirlerde üniversite bulunamadı</p>'}
                </div>
                `;
            }

            contentHTML += `</div>`;
        }

        contentDiv.innerHTML = contentHTML;

    } catch (error) {
        console.error('❌ Alternatif üniversite listesi hatası:', error);
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p style="font-size: 48px; margin-bottom: 20px;">⚠️</p>
                <p style="font-size: 18px; margin-bottom: 10px;">Üniversite verileri yüklenirken hata oluştu</p>
                <p style="font-size: 14px;">${error.message}</p>
            </div>
        `;
    }
}

window.closeUniversitiesListModal = function () {
    const modal = document.getElementById('universitiesListModal');
    if (modal) {
        modal.parentElement.remove();
    }
};

function loadChatHistory() {
    try {
        // Kullanıcıya özel key kullan
        const storageKey = getChatStorageKey();
        console.log(`📂 Sohbet geçmişi yükleniyor: ${storageKey}`);

        const savedSessions = StorageHelper.getItem(storageKey);
        if (savedSessions) {
            chatSessions = JSON.parse(savedSessions);
            console.log(`✅ ${chatSessions.length} sohbet oturumu yüklendi`);
            updateChatHistory();
        } else {
            console.log('ℹ️ Kaydedilmiş sohbet bulunamadı');
            chatSessions = [];
            // Boş olsa bile butonları göster
            updateSelectionModeButtons();
        }
    } catch (e) {
        console.warn('Sohbet geçmişi yüklenemedi:', e);
        chatSessions = [];
        updateSelectionModeButtons();
    }
}

function saveChatHistory() {
    try {
        // Kullanıcıya özel key kullan
        const storageKey = getChatStorageKey();
        console.log(`💾 Sohbet geçmişi kaydediliyor: ${storageKey} (${chatSessions.length} oturum)`);

        StorageHelper.setItem(storageKey, JSON.stringify(chatSessions));
    } catch (e) {
        console.warn('Sohbet geçmişi kaydedilemedi:', e);
    }
}

// Kullanıcıya özel storage key döndür
function getChatStorageKey() {
    if (userProfile && userProfile.id) {
        return `chatSessions_user_${userProfile.id}`;
    } else if (userProfile && userProfile.googleId) {
        return `chatSessions_google_${userProfile.googleId}`;
    } else {
        return 'chatSessions_guest';
    }
}

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
let currentTheme = localStorage.getItem('theme') || 'dark';

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);
themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

themeToggle?.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('theme', currentTheme);

    // Add animation effect
    themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
});

// Add Alternative Program Cards with Animation
function addAlternativeCards(alternatives, title, color, icon) {
    // ÖNCE FİLTRELE
    console.log('🎯 addAlternativeCards çağrıldı:', title);
    console.log('📊 Gelen alternatif sayısı:', alternatives.length);
    alternatives.forEach(alt => {
        console.log(`  - ${alt.dept}: ${alt.universities ? alt.universities.length : 0} üniversite`);
    });

    const validAlternatives = alternatives.filter(alt => alt.universities && alt.universities.length > 0);
    console.log('✅ Valid alternatif sayısı:', validAlternatives.length);

    // Eğer hiç valid alternatif yoksa hiçbir şey gösterme
    if (validAlternatives.length === 0) {
        console.log(`⚠️ ${title} için hiç üniversite bulunamadı, kart gösterilmiyor`);
        return;
    }

    // Başlık kartı
    const titleEl = document.createElement('div');
    titleEl.className = 'result-card';
    titleEl.style.cssText = `
        max-width: 1400px;
        margin: 2.5rem auto 1rem;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border-radius: 16px;
        padding: 1.8rem;
        text-align: center;
        animation: fadeIn 0.5s ease;
        box-shadow: 0 8px 32px ${color}40;
        height: auto;
        min-height: fit-content;
    `;
    titleEl.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${icon}</div>
        <h3 style="color: white; font-size: 1.8rem; margin: 0; font-weight: 800;">
            ${title}
        </h3>
        <p style="color: rgba(255,255,255,0.9); font-size: 1rem; margin-top: 0.5rem;">
            ${validAlternatives.length} program bulundu
        </p>
    `;

    chatMessages.appendChild(titleEl);

    validAlternatives.forEach((alt, index) => {
        setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.cssText = `
                background: var(--bg-surface);
                border: 2px solid var(--border);
                border-radius: 20px;
                padding: 1.5rem;
                animation: scaleIn 0.5s ease;
                animation-delay: ${index * 0.05}s;
                opacity: 0;
                animation-fill-mode: forwards;
                box-shadow: 0 8px 24px var(--shadow);
                transition: all 0.4s ease;
                height: 100%;
                display: flex;
                flex-direction: column;
            `;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; gap: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: var(--text-primary); font-size: 1.4rem; margin-bottom: 0.8rem; font-weight: 800; line-height: 1.3;">
                            ${alt.dept}
                        </h4>
                        <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.7;">
                            ${alt.description}
                        </p>
                    </div>
                    <span style="background: ${color}; color: white; padding: 0.6rem 1.2rem; border-radius: 25px; font-size: 0.9rem; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px ${color}40;">
                        ${alt.type}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                    <div style="background: linear-gradient(135deg, var(--bg-dark), var(--bg-hover)); padding: 1.2rem; border-radius: 16px; border-left: 5px solid ${color};">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">🎯 Taban Sıralama</div>
                        <div style="color: var(--text-primary); font-weight: 800; font-size: 1.2rem;">~${alt.threshold.toLocaleString('tr-TR').replace(/,/g, '.')}</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, var(--bg-dark), var(--bg-hover)); padding: 1.2rem; border-radius: 16px; border-left: 5px solid #10a37f;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">✅ Durum</div>
                        <div style="color: #10a37f; font-weight: 800; font-size: 1.1rem;">Uygun!</div>
                    </div>
                    
                    ${alt.dgs ? `
                    <div style="background: linear-gradient(135deg, rgba(16, 163, 127, 0.2), rgba(96, 165, 250, 0.2)); padding: 1.2rem; border-radius: 16px; border: 2px solid #10a37f;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">🔄 DGS Geçiş</div>
                        <div style="color: #10a37f; font-weight: 800; font-size: 1.1rem;">Mümkün!</div>
                    </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 1.2rem; padding: 1.2rem; background: linear-gradient(135deg, ${color}15, transparent); border-radius: 12px; border: 2px dashed ${color};">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="color: var(--text-primary); font-weight: 700; font-size: 1.05rem;">
                            🏛️ ${alt.universities.length} Üniversite Bulundu
                        </span>
                        <button style="background: ${color}; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.9rem;" onclick="showUniversityModal('${alt.dept.replace(/'/g, "\\'")}', ${JSON.stringify(alt.universities).replace(/"/g, '&quot;')})">
                            Detaylar
                        </button>
                    </div>
                </div>
            `;

            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-8px)';
                this.style.boxShadow = `0 12px 40px ${color}30`;
                this.style.borderColor = color;
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 8px 24px var(--shadow)';
                this.style.borderColor = 'var(--border)';
            });

            chatMessages.appendChild(card);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, index * 150);
    });
}

// Create Info Card (returns element)
function createInfoCard(formData, tytRanking, aytRanking) {
    const infoCard = document.createElement('div');
    infoCard.className = 'result-card';
    infoCard.style.cssText = `
        background: linear-gradient(135deg, var(--bg-surface), var(--bg-hover));
        border: 2px solid var(--primary);
        border-radius: 12px;
        padding: 1rem;
        animation: scaleIn 0.5s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
    `;

    infoCard.innerHTML = `
        <div style="text-align: center; margin-bottom: 0.8rem;">
            <h3 style="color: var(--primary); font-size: 1.1rem; margin: 0; font-weight: 800;">
                📊 Analiz Raporu
            </h3>
        </div>
        
        <div style="display: grid; gap: 0.6rem; flex: 1;">
            <div style="background: var(--bg-dark); padding: 0.7rem; border-radius: 8px; border-left: 3px solid #60a5fa;">
                <div style="color: var(--text-secondary); font-size: 0.7rem; margin-bottom: 0.2rem;">📘 TYT</div>
                <div style="color: var(--text-primary); font-weight: 700; font-size: 0.95rem;">${tytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</div>
            </div>
            
            <div style="background: var(--bg-dark); padding: 0.7rem; border-radius: 8px; border-left: 3px solid #10a37f;">
                <div style="color: var(--text-secondary); font-size: 0.7rem; margin-bottom: 0.2rem;">📗 AYT</div>
                <div style="color: var(--text-primary); font-weight: 700; font-size: 0.95rem;">${aytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</div>
            </div>
            
            <div style="background: var(--bg-dark); padding: 0.7rem; border-radius: 8px; border-left: 3px solid #f59e0b;">
                <div style="color: var(--text-secondary); font-size: 0.7rem; margin-bottom: 0.2rem;">💭 Hedef</div>
                <div style="color: var(--text-primary); font-weight: 700; font-size: 0.85rem; line-height: 1.2;">${formData.dreamDept}</div>
            </div>
            
            <div style="background: var(--bg-dark); padding: 0.7rem; border-radius: 8px; border-left: 3px solid #a855f7;">
                <div style="color: var(--text-secondary); font-size: 0.7rem; margin-bottom: 0.2rem;">🏙️ Şehir</div>
                <div style="color: var(--text-primary); font-weight: 700; font-size: 0.8rem; line-height: 1.2;">${formData.city}</div>
            </div>
        </div>
    `;

    return infoCard;
}

// Create Success Card (returns element)
function createSuccessCard(dreamDept) {
    const successCard = document.createElement('div');
    successCard.className = 'result-card success-animation';
    successCard.style.cssText = `
        background: linear-gradient(135deg, rgba(16, 163, 127, 0.15), rgba(102, 126, 234, 0.1));
        border: 2px solid #10a37f;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        animation: scaleIn 0.5s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    `;

    successCard.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.6rem; animation: float 2s ease-in-out infinite;">🎉</div>
        <h3 style="color: #10a37f; font-size: 1.1rem; margin-bottom: 0.6rem; font-weight: 800;">
            Harika Haber!
        </h3>
        <p style="color: var(--text-primary); font-size: 0.85rem; line-height: 1.3; margin: 0;">
            <strong>${dreamDept}</strong> için sıralamanız yeterli!
        </p>
    `;

    return successCard;
}

// Create Status Card (returns element)
function createStatusCard(dreamDept, aytRanking, lowestRanking = null, rankingType = 'AYT') {
    const statusCard = document.createElement('div');
    statusCard.className = 'result-card';
    statusCard.style.cssText = `
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1));
        border: 2px solid #f59e0b;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        animation: scaleIn 0.5s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    `;

    statusCard.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
        <h3 style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.6rem; font-weight: 800;">
            Durum Değerlendirmesi
        </h3>
        <p style="color: var(--text-primary); font-size: 0.85rem; line-height: 1.3; margin-bottom: 0.3rem;">
            <strong>${dreamDept}</strong> için yetmiyor
        </p>
        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.3rem;">
            ${rankingType || 'AYT'}: <strong>${aytRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</strong>
        </p>
        ${lowestRanking ? `
        <div style="background: rgba(239, 68, 68, 0.1); padding: 0.6rem; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 0.8rem;">
            <p style="color: #ef4444; font-size: 0.7rem; margin: 0; line-height: 1.4;">
                📊 <strong>${dreamDept}</strong> en yüksek kabul edilen sıralama:<br>
                <span style="font-size: 0.85rem; font-weight: 800;">${lowestRanking.toLocaleString('tr-TR').replace(/,/g, '.')}</span>
                <span style="font-size: 0.65rem; display: block; margin-top: 0.2rem; color: #dc2626;">
                    (Bu sıralamanın altında giremezsiniz)
                </span>
            </p>
        </div>
        ` : ''}
        <div style="background: rgba(16, 163, 127, 0.1); padding: 0.7rem; border-radius: 8px; border: 2px dashed #10a37f;">
            <p style="color: #10a37f; font-size: 0.9rem; font-weight: 700; margin-bottom: 0.2rem;">
                😊 Umut Var!
            </p>
            <p style="color: var(--text-primary); font-size: 0.75rem; margin: 0;">
                Alternatif yollar
            </p>
        </div>
    `;

    return statusCard;
}

// Add University Cards in Beautiful Boxes
function addUniversityCardsInBoxes(universities, formData) {
    // Tek bir özet kartı göster
    const summaryCard = document.createElement('div');
    summaryCard.className = 'result-card';
    summaryCard.style.cssText = `
        background: var(--bg-surface);
        border: 2px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        animation: scaleIn 0.5s ease;
        box-shadow: 0 8px 24px var(--shadow);
        transition: all 0.4s ease;
        max-width: 600px;
        margin: 1rem auto;
    `;

    const devletCount = universities.filter(u => u.type === 'Devlet').length;
    const vakifCount = universities.filter(u => u.type === 'Vakıf').length;
    const cities = [...new Set(universities.map(u => u.city))];
    const cityText = formData.city && formData.city.toLowerCase() !== 'fark etmez' && formData.city.toLowerCase() !== 'farketmez'
        ? formData.city
        : cities.join(', ') || 'Tüm Türkiye';

    summaryCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; gap: 1rem;">
            <div style="flex: 1;">
                <h4 style="color: var(--text-primary); font-size: 1.4rem; margin-bottom: 0.8rem; font-weight: 800; line-height: 1.3;">
                    ${formData.dreamDept}
                </h4>
                <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.7; margin-bottom: 0.8rem;">
                    Hedef bölümünüz için uygun programlar
                </p>
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05)); padding: 0.5rem 1rem; border-radius: 12px; border: 2px solid #a855f7;">
                    <span style="font-size: 1.2rem;">🏙️</span>
                    <span style="color: var(--text-primary); font-weight: 600; font-size: 0.9rem;">${cityText}</span>
                </div>
            </div>
            <span style="background: #10a37f; color: white; padding: 0.6rem 1.2rem; border-radius: 25px; font-size: 0.9rem; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.4);">
                Uygun
            </span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.2rem;">
            <div style="background: linear-gradient(135deg, var(--bg-dark), var(--bg-hover)); padding: 1.2rem; border-radius: 16px; border-left: 5px solid #10a37f;">
                <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">🏛️ Devlet</div>
                <div style="color: var(--text-primary); font-weight: 800; font-size: 1.2rem;">${devletCount} Üniversite</div>
            </div>
            
            <div style="background: linear-gradient(135deg, var(--bg-dark), var(--bg-hover)); padding: 1.2rem; border-radius: 16px; border-left: 5px solid #f59e0b;">
                <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">💼 Vakıf</div>
                <div style="color: var(--text-primary); font-weight: 800; font-size: 1.2rem;">${vakifCount} Üniversite</div>
            </div>
        </div>
        
        <div style="margin-top: 1.2rem; padding: 1.2rem; background: linear-gradient(135deg, rgba(16, 163, 127, 0.15), transparent); border-radius: 12px; border: 2px dashed #10a37f;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: var(--text-primary); font-weight: 700; font-size: 1.05rem;">
                    🏛️ ${universities.length} Üniversite Bulundu
                </span>
                <button id="detailsBtn-${Date.now()}" style="background: #10a37f; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                    Detaylar
                </button>
            </div>
        </div>
    `;

    summaryCard.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-8px)';
        this.style.boxShadow = '0 12px 40px rgba(16, 163, 127, 0.3)';
        this.style.borderColor = '#10a37f';
    });

    summaryCard.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 8px 24px var(--shadow)';
        this.style.borderColor = 'var(--border)';
    });

    chatMessages.appendChild(summaryCard);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Detaylar butonuna event listener ekle
    currentEligibleUniversities = universities;
    setTimeout(() => {
        const detailsBtn = summaryCard.querySelector('[id^="detailsBtn-"]');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                showEligibleUniversityModal(formData.dreamDept, currentEligibleUniversities);
            });
        }
    }, 100);
}

// Yeni fonksiyon: Uygun üniversiteler için detaylı modal
function showEligibleUniversityModal(deptName, universities) {
    // Debug: Gelen verileri logla
    console.log('🔍 showEligibleUniversityModal çağrıldı');
    console.log('📊 Bölüm:', deptName);
    console.log('📊 Üniversite sayısı:', universities ? universities.length : 0);
    console.log('📊 İlk üniversite:', universities && universities[0] ? universities[0] : 'YOK');

    // Seçili üniversiteleri temizle
    selectedUniversities.clear();

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'universitySelectionModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
        padding: 2rem;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-dark);
        border-radius: 24px;
        padding: 2rem;
        max-width: 900px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
    `;

    const devletUnis = universities.filter(u => u.type === 'Devlet');
    const vakifUnis = universities.filter(u => u.type === 'Vakıf');

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="color: var(--primary); margin: 0; font-size: 1.8rem;">🎓 ${deptName}</h2>
            <button onclick="this.closest('.modal-overlay').remove()" style="background: transparent; border: none; font-size: 2rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05)); padding: 1.5rem; border-radius: 12px; border: 2px solid #10a37f; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">Toplam Üniversite</div>
            <div style="color: var(--primary); font-size: 2.5rem; font-weight: 800;">${universities.length}</div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    <span style="color: #10a37f;">🏛️</span> ${devletUnis.length} Devlet
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    <span style="color: #f59e0b;">💼</span> ${vakifUnis.length} Vakıf
                </div>
            </div>
        </div>
        
        ${devletUnis.length > 0 ? `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: #10a37f; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                🏛️ Devlet Üniversiteleri (${devletUnis.length})
            </h3>
            <div style="display: grid; gap: 1rem;">
                ${devletUnis.map((uni, idx) => `
                    <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: 12px; border-left: 4px solid #10a37f; position: relative;">
                        <label style="position: absolute; top: 1rem; right: 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" 
                                id="uni-check-devlet-` + idx + `" 
                                data-uni='` + JSON.stringify(uni).replace(/'/g, "&#39;") + `' 
                                onchange="toggleUniversitySelection(this)"
                                style="width: 20px; height: 20px; cursor: pointer; accent-color: #10a37f;">
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">Seç</span>
                        </label>
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.8rem; font-size: 1.1rem; padding-right: 70px;">${uni.name}</div>
                        <div style="display: grid; gap: 0.5rem; font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            <div>📍 ${uni.city}</div>
                            <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                            <div>🎯 Taban Sıralama: ${(uni.ranking || uni.minRanking)?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                            <div>👥 Kontenjan: ${uni.quota}</div>
                            ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #10a37f; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                        </div>
                        <button 
                            data-uni-name="${uni.name}" 
                            data-uni-city="${uni.city}" 
                            data-uni-campus="${uni.campus || 'Ana Kampüs'}" 
                            data-uni-type="Devlet" 
                            data-uni-condition-numbers="${uni.conditionNumbers || ''}" 
                            onclick="
                                event.stopPropagation(); 
                                console.log('🎯 BUTONA TIKLANDI!', event.currentTarget.dataset);
                                const modal = document.getElementById('universitySelectionModal');
                                if (modal) modal.remove();
                                const btn = event.currentTarget;
                                showDetailedConditionsModal(
                                    btn.dataset.uniName, 
                                    [], 
                                    btn.dataset.uniConditionNumbers, 
                                    btn.dataset.uniCity, 
                                    btn.dataset.uniCampus, 
                                    btn.dataset.uniType
                                );
                            " 
                            style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); margin-top: 1rem;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                            🔍 ÖSYM Şartları ve Harita Detayı
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${vakifUnis.length > 0 ? `
        <div>
            <h3 style="color: #f59e0b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                💼 Vakıf Üniversiteleri (${vakifUnis.length})
            </h3>
            <div style="display: grid; gap: 1rem;">
                ${vakifUnis.map((uni, idx) => `
                    <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: 12px; border-left: 4px solid #f59e0b; position: relative;">
                        <label style="position: absolute; top: 1rem; right: 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" 
                                id="uni-check-vakif-` + idx + `" 
                                data-uni='` + JSON.stringify(uni).replace(/'/g, "&#39;") + `' 
                                onchange="toggleUniversitySelection(this)"
                                style="width: 20px; height: 20px; cursor: pointer; accent-color: #f59e0b;">
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">Seç</span>
                        </label>
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.8rem; font-size: 1.1rem; padding-right: 70px;">${uni.name}</div>
                        <div style="display: grid; gap: 0.5rem; font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            <div>📍 ${uni.city}</div>
                            <div>🏫 ${uni.campus || 'Ana Kampüs'}</div>
                            <div>🎯 Taban Sıralama: ${(uni.ranking || uni.minRanking)?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</div>
                            <div>👥 Kontenjan: ${uni.quota}</div>
                            ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #f59e0b; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                        </div>
                        <button 
                            data-uni-name="${uni.name}" 
                            data-uni-city="${uni.city}" 
                            data-uni-campus="${uni.campus || 'Ana Kampüs'}" 
                            data-uni-type="Vakıf" 
                            data-uni-condition-numbers="${uni.conditionNumbers || ''}" 
                            onclick="
                                event.stopPropagation(); 
                                console.log('🎯 BUTONA TIKLANDI!', event.currentTarget.dataset);
                                const modal = document.getElementById('universitySelectionModal');
                                if (modal) modal.remove();
                                const btn = event.currentTarget;
                                showDetailedConditionsModal(
                                    btn.dataset.uniName, 
                                    [], 
                                    btn.dataset.uniConditionNumbers, 
                                    btn.dataset.uniCity, 
                                    btn.dataset.uniCampus, 
                                    btn.dataset.uniType
                                );
                            " 
                            style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); margin-top: 1rem;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                            🔍 ÖSYM Şartları ve Harita Detayı
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Google Sheets Export Butonu -->
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
            <div id="selectedCountInfo" style="text-align: center; margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.95rem;">
                <span id="selectedCount">0</span> üniversite seçildi
            </div>
            <button id="exportToSheetsBtn" onclick="exportSelectedToGoogleSheets('${deptName.replace(/'/g, "\\'")}', ${JSON.stringify(universities).replace(/"/g, '&quot;')})" 
                style="
                    width: 100%;
                    background: linear-gradient(135deg, #34A853, #0F9D58);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(52, 168, 83, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(52, 168, 83, 0.4)'" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(52, 168, 83, 0.3)'">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
                </svg>
                Seçilenleri Google Sheets'e Aktar
            </button>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
}

// Initialize
console.log('🎓 Tercih AI başlatıldı');
console.log('📡 API URL:', API_URL);
console.log('⚠️ Backend sunucusunu başlatmayı unutmayın: cd backend && npm start');

// Üniversite Modal
function showUniversityModal(deptName, universities) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-dark);
        border-radius: 20px;
        padding: 2rem;
        max-width: 900px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid var(--border);
    `;

    const devletUnis = universities.filter(u => u.type === 'Devlet');
    const vakifUnis = universities.filter(u => u.type === 'Vakıf');

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="color: var(--primary); margin: 0; font-size: 1.8rem;">🏛️ ${deptName}</h2>
            <button onclick="this.closest('.modal-overlay').remove()" style="background: transparent; border: none; font-size: 2rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>
        
        <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05)); padding: 1rem; border-radius: 12px; border: 2px solid #10a37f;">
                <div style="color: var(--text-secondary); font-size: 0.9rem;">Toplam Üniversite</div>
                <div style="color: var(--primary); font-size: 2rem; font-weight: 800;">${universities.length}</div>
            </div>
        </div>
        
        ${devletUnis.length > 0 ? `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: #10a37f; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                🏛️ Devlet Üniversiteleri (${devletUnis.length})
            </h3>
            <div style="display: grid; gap: 1rem;">
                ${devletUnis.map((uni, idx) => `
                    <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: 12px; border-left: 4px solid #10a37f; position: relative;">
                        <div style="display: flex; align-items: start; gap: 1rem;">
                            <input type="checkbox" class="uni-checkbox" data-uni-id="devlet-${idx}" 
                                data-uni-name="${uni.name}" 
                                data-uni-city="${uni.city}" 
                                data-uni-campus="${uni.campus || 'Ana Kampüs'}"
                                data-uni-ranking="${uni.ranking || ''}"
                                data-uni-quota="${uni.quota || ''}"
                                data-uni-type="Devlet"
                                data-uni-dept="${deptName}"
                                style="width: 20px; height: 20px; cursor: pointer; margin-top: 4px; flex-shrink: 0;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${uni.name}</div>
                                <div style="display: grid; gap: 0.3rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                    <div>📍 ${uni.city}</div>
                                    ${uni.campus ? `<div>🏫 ${uni.campus}</div>` : ''}
                                    ${uni.ranking ? `<div>📊 Taban Sıralama: ${uni.ranking.toLocaleString('tr-TR').replace(/,/g, '.')}</div>` : ''}
                                    ${uni.quota ? `<div>👥 Kontenjan: ${uni.quota}</div>` : ''}
                                    ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #10a37f; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                                </div>
                                <button data-uni-name="${uni.name}" data-uni-city="${uni.city}" data-uni-campus="${uni.campus || 'Ana Kampüs'}" data-uni-type="Devlet" data-uni-condition-numbers="${uni.conditionNumbers || ''}" onclick="const btn = event.currentTarget; showDetailedConditionsModal(btn.dataset.uniName, [], btn.dataset.uniConditionNumbers, btn.dataset.uniCity, btn.dataset.uniCampus, btn.dataset.uniType)" 
                                    style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" 
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                                    🔍 ÖSYM Şartları ve Harita Detayı
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${vakifUnis.length > 0 ? `
        <div>
            <h3 style="color: #f59e0b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                💼 Vakıf Üniversiteleri (${vakifUnis.length})
            </h3>
            <div style="display: grid; gap: 1rem;">
                ${vakifUnis.map((uni, idx) => `
                    <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: 12px; border-left: 4px solid #f59e0b; position: relative;">
                        <div style="display: flex; align-items: start; gap: 1rem;">
                            <input type="checkbox" class="uni-checkbox" data-uni-id="vakif-${idx}" 
                                data-uni-name="${uni.name}" 
                                data-uni-city="${uni.city}" 
                                data-uni-campus="${uni.campus || 'Ana Kampüs'}"
                                data-uni-ranking="${uni.ranking || ''}"
                                data-uni-quota="${uni.quota || ''}"
                                data-uni-type="Vakıf"
                                data-uni-dept="${deptName}"
                                style="width: 20px; height: 20px; cursor: pointer; margin-top: 4px; flex-shrink: 0;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${uni.name}</div>
                                <div style="display: grid; gap: 0.3rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                    <div>📍 ${uni.city}</div>
                                    ${uni.campus ? `<div>🏫 ${uni.campus}</div>` : ''}
                                    ${uni.ranking ? `<div>📊 Taban Sıralama: ${uni.ranking.toLocaleString('tr-TR').replace(/,/g, '.')}</div>` : ''}
                                    ${uni.quota ? `<div>👥 Kontenjan: ${uni.quota}</div>` : ''}
                                    ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `<div style="color: #f59e0b; font-weight: 600;">📋 ÖSYM Şartları: Madde ${uni.conditionNumbers}</div>` : ''}
                                </div>
                                <button data-uni-name="${uni.name}" data-uni-city="${uni.city}" data-uni-campus="${uni.campus || 'Ana Kampüs'}" data-uni-type="Vakıf" data-uni-condition-numbers="${uni.conditionNumbers || ''}" onclick="const btn = event.currentTarget; showDetailedConditionsModal(btn.dataset.uniName, [], btn.dataset.uniConditionNumbers, btn.dataset.uniCity, btn.dataset.uniCampus, btn.dataset.uniType)" 
                                    style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" 
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                                    🔍 ÖSYM Şartları ve Harita Detayı
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <div style="color: var(--text-secondary); font-size: 0.95rem;">
                    <span id="selectedCountText">Seçili: 0 üniversite</span>
                </div>
                <button id="selectAllBtn" style="background: transparent; color: var(--primary); border: 2px solid var(--primary); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                    Tümünü Seç
                </button>
            </div>
            <button id="exportToSheetsBtn" disabled style="width: 100%; background: linear-gradient(135deg, #10a37f, #0d8a6a); color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                ➕ Seçilenleri Listemde Ekle
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    modal.className = 'modal-overlay';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);

    // Checkbox event listeners ekle
    const checkboxes = modalContent.querySelectorAll('.uni-checkbox');
    const exportBtn = modalContent.querySelector('#exportToSheetsBtn');
    const selectedCountText = modalContent.querySelector('#selectedCountText');
    const selectAllBtn = modalContent.querySelector('#selectAllBtn');

    function updateExportButton() {
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        selectedCountText.textContent = `Seçili: ${checkedCount} üniversite`;
        exportBtn.disabled = checkedCount === 0;
        exportBtn.style.opacity = checkedCount === 0 ? '0.5' : '1';
        exportBtn.style.cursor = checkedCount === 0 ? 'not-allowed' : 'pointer';
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateExportButton);
    });

    selectAllBtn.addEventListener('click', () => {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        selectAllBtn.textContent = allChecked ? 'Tümünü Seç' : 'Tümünü Kaldır';
        updateExportButton();
    });

    exportBtn.addEventListener('click', () => {
        const selectedFromThisModal = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ({
                name: cb.dataset.uniName,
                city: cb.dataset.uniCity,
                campus: cb.dataset.uniCampus,
                ranking: cb.dataset.uniRanking,
                quota: cb.dataset.uniQuota,
                type: cb.dataset.uniType,
                department: cb.dataset.uniDept
            }));

        if (selectedFromThisModal.length > 0) {
            // Global listeye ekle (tekrar eklemeden önce kontrol et)
            selectedFromThisModal.forEach(uni => {
                const exists = globalSelectedUniversities.find(u =>
                    u.name === uni.name && u.department === uni.department
                );
                if (!exists) {
                    globalSelectedUniversities.push(uni);
                }
            });

            // Kullanıcıya bilgi ver
            addMessage(`✅ ${selectedFromThisModal.length} üniversite seçim listenize eklendi!\n\nToplam seçili: ${globalSelectedUniversities.length} üniversite\n\n💡 Sol üst köşedeki "📋 Seçimlerim (${globalSelectedUniversities.length})" butonuna tıklayarak tüm seçimlerinizi görüntüleyebilir ve Google Sheets'e aktarabilirsiniz.`, 'ai');

            // Modal'ı kapat
            modal.remove();

            // Seçimler butonunu güncelle
            updateSelectionButton();
        }
    });
}

// Global scope'a ekle
window.showUniversityModal = showUniversityModal;

// Google Sheets'e veri aktarma fonksiyonu
async function exportToGoogleSheets(universities) {
    try {
        // Kullanıcı giriş yapmış mı kontrol et
        if (!userProfile || !userProfile.email) {
            addMessage('❌ Google Sheets\'e aktarmak için önce Google ile giriş yapmanız gerekiyor.', 'ai');
            return;
        }

        // CSV formatında veri hazırla
        const csvHeaders = ['Sıra', 'Üniversite Adı', 'Şehir', 'Kampüs', 'Bölüm', 'Tür', 'Taban Sıralama', 'Kontenjan', 'ÖSYM Şart Maddeleri'];
        const csvRows = universities.map((uni, index) => [
            index + 1,
            uni.name,
            uni.city,
            uni.campus,
            uni.department,
            uni.type,
            uni.ranking || '-',
            uni.quota || '-',
            uni.conditionNumbers ? `Madde ${uni.conditionNumbers}` : 'Yok'
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Google Sheets URL'ini oluştur
        const encodedData = encodeURIComponent(csvContent);
        const sheetTitle = `Tercih Listesi - ${new Date().toLocaleDateString('tr-TR')}`;

        // CSV dosyasını indirme alternatifi sunalım
        // UTF-8 BOM ekle - Excel'in Türkçe karakterleri doğru göstermesi için gerekli
        const BOM = '\uFEFF';
        const csvContentWithBOM = BOM + csvContent;
        const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tercih_listesi_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);

        // Kullanıcıya seçenek sun
        const message = `
            ✅ ${universities.length} üniversite seçildi!\n\n
            📊 Seçenekler:\n
            1️⃣ CSV dosyası indirildi - Bu dosyayı Google Sheets'e yükleyebilirsiniz\n
            2️⃣ Ya da Google Sheets'i açıp "Dosya > İçe Aktar > Yükle" seçeneğiyle CSV'yi içe aktarabilirsiniz\n\n
            💡 İpucu: İndirilen CSV dosyasını doğrudan Google Drive'a sürükleyip Sheets olarak açabilirsiniz!
        `;

        addMessage(message, 'ai', ['Yeni analiz yap', 'Başka bölüm sor']);

        // CSV'yi indir
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Ayrıca backend'e kaydet (opsiyonel)
        try {
            await fetch(`${API_URL}/api/save-selections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: userProfile.email,
                    universities: universities,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('✅ Seçimler backend\'e kaydedildi');
        } catch (backendError) {
            console.warn('⚠️ Backend\'e kaydedilemedi:', backendError);
        }

    } catch (error) {
        console.error('❌ Export hatası:', error);
        addMessage('❌ Veri aktarımında bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
    }
}

window.exportToGoogleSheets = exportToGoogleSheets;

// Seçimler butonunu güncelle
function updateSelectionButton() {
    const selectionsBtn = document.getElementById('selectionsBtn');
    const selectionCount = document.getElementById('selectionCount');

    if (selectionsBtn && selectionCount) {
        selectionCount.textContent = globalSelectedUniversities.length;

        if (globalSelectedUniversities.length > 0) {
            selectionsBtn.style.display = 'flex';
        } else {
            selectionsBtn.style.display = 'none';
        }
    }
}

// Seçimler modalını göster
function showSelectionsModal() {
    if (globalSelectedUniversities.length === 0) {
        addMessage('❌ Henüz hiç üniversite seçmediniz. Önce bir analiz yapıp üniversiteleri seçin.', 'ai');
        return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;

    // Bölümlere göre grupla
    const byDepartment = {};
    globalSelectedUniversities.forEach(uni => {
        if (!byDepartment[uni.department]) {
            byDepartment[uni.department] = [];
        }
        byDepartment[uni.department].push(uni);
    });

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-dark);
        border-radius: 20px;
        padding: 2rem;
        max-width: 1000px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid var(--border);
    `;

    const departmentSections = Object.entries(byDepartment).map(([dept, unis]) => `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                🎯 ${dept} (${unis.length})
            </h3>
            <div style="display: grid; gap: 0.75rem;">
                ${unis.map((uni, idx) => `
                    <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border-left: 4px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'}; display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem;">${uni.name}</div>
                            <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-secondary); flex-wrap: wrap;">
                                <span>📍 ${uni.city}</span>
                                <span>🏫 ${uni.campus}</span>
                                <span>🏢 ${uni.type}</span>
                                ${uni.ranking ? `<span>📊 ${uni.ranking}</span>` : ''}
                            </div>
                        </div>
                        <button onclick="removeFromGlobalSelections('${dept}', ${idx})" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                            Kaldır
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="color: var(--primary); margin: 0; font-size: 1.8rem;">📋 Seçtiğim Üniversiteler</h2>
            <button onclick="this.closest('.selections-modal-overlay').remove()" style="background: transparent; border: none; font-size: 2rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05)); padding: 1rem; border-radius: 12px; border: 2px solid #10a37f; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">Toplam Seçili Üniversite</div>
            <div style="color: var(--primary); font-size: 2rem; font-weight: 800;">${globalSelectedUniversities.length}</div>
        </div>
        
        ${departmentSections}
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border); display: flex; gap: 1rem;">
            <button onclick="clearAllSelections()" style="flex: 1; background: #ef4444; color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease;">
                🗑️ Tümünü Temizle
            </button>
            <button onclick="exportAllSelectionsToSheets()" style="flex: 2; background: linear-gradient(135deg, #34a853, #0f9d58); color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                Tüm Seçimlerimi Google Sheets'e Aktar
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    modal.className = 'selections-modal-overlay';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

// Global seçimlerden kaldır
function removeFromGlobalSelections(department, index) {
    const filtered = globalSelectedUniversities.filter(u => u.department === department);
    const toRemove = filtered[index];

    globalSelectedUniversities = globalSelectedUniversities.filter(u =>
        !(u.name === toRemove.name && u.department === toRemove.department)
    );

    updateSelectionButton();

    // Modal'ı yeniden aç
    document.querySelector('.selections-modal-overlay')?.remove();
    showSelectionsModal();
}

// Tüm seçimleri temizle
function clearAllSelections() {
    if (confirm('Tüm seçimlerinizi silmek istediğinizden emin misiniz?')) {
        globalSelectedUniversities = [];
        updateSelectionButton();
        document.querySelector('.selections-modal-overlay')?.remove();
        addMessage('✅ Tüm seçimler temizlendi.', 'ai');
    }
}

// Tüm seçimleri Sheets'e aktar
function exportAllSelectionsToSheets() {
    if (globalSelectedUniversities.length > 0) {
        exportToGoogleSheets(globalSelectedUniversities);
        document.querySelector('.selections-modal-overlay')?.remove();
    }
}

// Global fonksiyonlar
window.showSelectionsModal = showSelectionsModal;
window.removeFromGlobalSelections = removeFromGlobalSelections;
window.clearAllSelections = clearAllSelections;
window.exportAllSelectionsToSheets = exportAllSelectionsToSheets;
window.updateSelectionButton = updateSelectionButton;

// TYT ve AYT input'larına otomatik formatlama ekle
document.addEventListener('DOMContentLoaded', function () {
    const tytInput = document.getElementById('quickTytRanking');
    const aytInput = document.getElementById('quickAytRanking');

    function setupNumberFormatting(input) {
        if (!input) return;

        // Input sırasında formatla
        input.addEventListener('input', function (e) {
            const cursorPosition = this.selectionStart;
            const oldLength = this.value.length;

            // Formatla
            const formatted = formatNumberWithDots(this.value);
            this.value = formatted;

            // Cursor pozisyonunu ayarla
            const newLength = formatted.length;
            const newCursorPosition = cursorPosition + (newLength - oldLength);
            this.setSelectionRange(newCursorPosition, newCursorPosition);
        });

        // Paste olayında formatla
        input.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const formatted = formatNumberWithDots(pastedText);
            this.value = formatted;
        });
    }

    setupNumberFormatting(tytInput);
    setupNumberFormatting(aytInput);
});

// Üniversite Detay Modal (ÖSYM Şartları + Google Maps)
function showUniversityDetailModal(uni, program) {
    console.log('🏛️ Detay Modal Açılıyor:', uni.name);

    // Şartları hazırla - Daha kapsamlı şart kontrolü
    let conditions = [];
    if (program && program.admissionConditions && program.admissionConditions.length > 0) {
        conditions = program.admissionConditions;
    } else if (uni.conditions && uni.conditions.length > 0) {
        conditions = uni.conditions.map(c => c.text || c.conditionText || c);
    }

    // ÖSYM şartları için örnek veri (eğer yoksa)
    if (conditions.length === 0 && uni.conditionNumbers) {
        conditions = [
            "Adayların yerleştirme puan türlerinden aldıkları puanlar sıfırdan büyük olmalıdır.",
            "İngilizce öğretimi yapılan programlardır.",
            "Bu program ERASMUS değişim programına dahildir.",
            "Lisans mezunlarının başvurabileceği programdır."
        ];
    }

    const modalHTML = `
        <div id="universityDetailModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
            animation: fadeIn 0.3s ease;
        ">
            <div style="
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-radius: 20px;
                max-width: 1000px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                padding: 0;
                position: relative;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                border: 2px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, ${uni.type === 'Devlet' ? '#10a37f, #0d8a6a' : '#f59e0b, #d97706'});
                    padding: 25px 30px;
                    border-radius: 20px 20px 0 0;
                    position: relative;
                ">
                    <button onclick="closeUniversityDetailModal()" style="
                        position: absolute;
                        top: 20px;
                        right: 70px;
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        font-size: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ×
                    </button>
                    
                    <!-- Checkbox -->
                    <label style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 5px;
                        background: rgba(255, 255, 255, 0.15);
                        padding: 10px;
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                        <input type="checkbox" 
                            id="uni-detail-check" 
                            data-uni='` + JSON.stringify(uni).replace(/'/g, "&#39;") + `' 
                            onchange="toggleUniversitySelection(this)"
                            style="width: 24px; height: 24px; cursor: pointer; accent-color: white;">
                        <span style="font-size: 0.75rem; color: white; font-weight: 600;">Seç</span>
                    </label>
                    
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="
                            background: rgba(255, 255, 255, 0.2);
                            padding: 15px;
                            border-radius: 12px;
                            backdrop-filter: blur(10px);
                        ">
                            <span style="font-size: 2.5rem;">${uni.type === 'Devlet' ? '🏛️' : '💼'}</span>
                        </div>
                        <div style="flex: 1; padding-right: 120px;">
                            <h2 style="color: white; margin: 0 0 8px 0; font-size: 1.8rem; font-weight: 800;">${uni.name}</h2>
                            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 1rem;">
                                📍 ${uni.city} • ${uni.campus || 'Ana Kampüs'}
                            </p>
                        </div>
                    </div>
                    
                    ${program && program.name ? `
                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        padding: 12px 18px;
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                    ">
                        <p style="color: white; margin: 0; font-weight: 600; font-size: 1.1rem;">
                            📚 ${program.name}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    
                    <!-- Program Bilgileri -->
                    ${program ? `
                    <div style="
                        background: #0f172a;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 25px;
                        border: 1px solid #334155;
                    ">
                        <h3 style="color: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'}; margin-bottom: 15px; font-size: 1.3rem; font-weight: 700;">
                            📊 Program Bilgileri
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="background: #1e293b; padding: 15px; border-radius: 8px; border-left: 4px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};">
                                <span style="color: #94a3b8; font-size: 13px;">🎯 Taban Sıralama</span><br>
                                <strong style="color: #fff; font-size: 1.3rem;">~${program.minRanking?.toLocaleString('tr-TR').replace(/,/g, '.') || 'N/A'}</strong>
                            </div>
                            <div style="background: #1e293b; padding: 15px; border-radius: 8px; border-left: 4px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};">
                                <span style="color: #94a3b8; font-size: 13px;">👥 Kontenjan</span><br>
                                <strong style="color: #fff; font-size: 1.3rem;">${program.quota || 'N/A'}</strong>
                            </div>
                            ${uni.type !== 'Devlet' && program.scholarshipConditions ? `
                            <div style="background: #1e293b; padding: 15px; border-radius: 8px; border-left: 4px solid #10a37f;">
                                <span style="color: #94a3b8; font-size: 13px;">🎓 Burs</span><br>
                                <strong style="color: #10a37f; font-size: 1.1rem;">Mevcut</strong>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- ÖSYM Tercih Şartları -->
                    ${conditions.length > 0 ? `
                    <div style="
                        background: linear-gradient(135deg, ${uni.type === 'Devlet' ? 'rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05)' : 'rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)'});
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 25px;
                        border: 2px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};
                    ">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="
                                    background: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                    width: 50px;
                                    height: 50px;
                                    border-radius: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 1.8rem;
                                ">📋</div>
                                <h3 style="color: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'}; margin: 0; font-size: 1.3rem; font-weight: 700;">
                                    ÖSYM 2025 Tercih Şartları
                                </h3>
                            </div>
                            <button data-uni-name="${uni.name}" data-uni-city="${uni.city}" data-uni-campus="${uni.campus || 'Ana Kampüs'}" data-uni-type="${uni.type}" data-uni-condition-numbers="${uni.conditionNumbers || ''}" onclick="const btn = event.currentTarget; showDetailedConditionsModal(btn.dataset.uniName, [], btn.dataset.uniConditionNumbers, btn.dataset.uniCity, btn.dataset.uniCampus, btn.dataset.uniType)" 
                                style="
                                    background: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                    color: white;
                                    border: none;
                                    padding: 8px 16px;
                                    border-radius: 20px;
                                    font-size: 12px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                "
                                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'"
                                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)'">
                                🔍 Detaylı Görüntüle
                            </button>
                        </div>
                        <div style="background: #0f172a; padding: 20px; border-radius: 10px;">
                            <ul style="
                                color: #e2e8f0;
                                font-size: 14px;
                                line-height: 1.8;
                                padding-left: 25px;
                                margin: 0;
                                max-height: 150px;
                                overflow-y: auto;
                            ">
                                ${conditions.slice(0, 3).map((condition, index) => `
                                    <li style="margin-bottom: 8px;">
                                        <span style="color: #94a3b8; font-weight: 500;">${condition}</span>
                                    </li>
                                `).join('')}
                                ${conditions.length > 3 ? `
                                    <li style="margin-bottom: 8px; color: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'}; font-weight: 600;">
                                        ... ve ${conditions.length - 3} madde daha
                                    </li>
                                ` : ''}
                            </ul>
                        </div>
                        ${uni.conditionNumbers && uni.conditionNumbers.trim() ? `
                        <div style="
                            background: rgba(255, 255, 255, 0.05);
                            padding: 12px 18px;
                            border-radius: 8px;
                            margin-top: 15px;
                            border-left: 4px solid ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};
                        ">
                            <p style="color: #e2e8f0; margin: 0; font-size: 13px;">
                                <strong style="color: ${uni.type === 'Devlet' ? '#10a37f' : '#f59e0b'};">📌 Madde Numarası:</strong> ${uni.conditionNumbers}
                            </p>
                        </div>
                        ` : ''}
                    </div>
                    ` : `
                    <div style="
                        background: rgba(148, 163, 184, 0.1);
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 25px;
                        border: 1px dashed #475569;
                        text-align: center;
                    ">
                        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                            ℹ️ Bu program için özel tercih şartı bulunmamaktadır.
                        </p>
                    </div>
                    `}
                    
                    <!-- Google Maps -->
                    <div style="
                        background: #0f172a;
                        border-radius: 12px;
                        padding: 20px;
                        border: 1px solid #334155;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
                            <div style="
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                width: 50px;
                                height: 50px;
                                border-radius: 12px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.8rem;
                            ">🗺️</div>
                            <h3 style="color: #667eea; margin: 0; font-size: 1.3rem; font-weight: 700;">
                                Kampüs Konumu
                            </h3>
                        </div>
                        <div style="
                            background: #1e293b;
                            border-radius: 10px;
                            overflow: hidden;
                            height: 400px;
                            border: 2px solid #334155;
                        ">
                            <iframe
                                width="100%"
                                height="100%"
                                frameborder="0"
                                style="border:0"
                                referrerpolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(uni.name + ' ' + uni.city + ' ' + (uni.campus || 'kampüs'))}&zoom=15"
                                allowfullscreen>
                            </iframe>
                        </div>
                        <div style="
                            background: rgba(102, 126, 234, 0.1);
                            padding: 12px 18px;
                            border-radius: 8px;
                            margin-top: 15px;
                            border-left: 4px solid #667eea;
                        ">
                            <p style="color: #e2e8f0; margin: 0; font-size: 13px;">
                                💡 <strong>İpucu:</strong> Haritada yakınlaştırma ve konumu keşfetme yapabilirsiniz.
                            </p>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Modal dışına tıklandığında kapat
    document.getElementById('universityDetailModal').addEventListener('click', function (e) {
        if (e.target.id === 'universityDetailModal') {
            closeUniversityDetailModal();
        }
    });
}

function closeUniversityDetailModal() {
    const modal = document.getElementById('universityDetailModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Close university modal
function closeUniversityModal() {
    const modals = document.querySelectorAll('[style*="z-index: 10000"]');
    modals.forEach(modal => modal.remove());
}

// Detaylı ÖSYM Şartları ve Harita Modal
async function showDetailedConditionsModal(uniName, conditions, conditionNumbers, city, campus, uniType, uni = null) {
    console.log('🔥🔥🔥 BUTON ÇALIŞTI! showDetailedConditionsModal çağrıldı 🔥🔥🔥');
    console.log('📋 Detaylı Şartlar Modal Açılıyor:', uniName);
    console.log('Parametreler:', { uniName, conditions, conditionNumbers, city, campus, uniType });

    // Loading modal göster
    showLoadingModal('ÖSYM şartları yükleniyor...');

    // Gerçek ÖSYM şartlarını API'den çek
    let parsedConditions = [];
    let realConditions = [];

    try {
        // Backend'den gerçek ÖSYM şartlarını çek
        const response = await fetch(`${API_URL}/api/conditions/${encodeURIComponent(uniName)}/${encodeURIComponent(window.currentDepartment || 'Bilgisayar Mühendisliği')}`);
        if (response.ok) {
            const data = await response.json();
            realConditions = data.conditions || [];
            console.log('✅ Gerçek ÖSYM şartları alındı:', realConditions);
        }
    } catch (error) {
        console.warn('⚠️ ÖSYM şartları alınamadı:', error);
    }

    // Gerçek şartları kullan, yoksa mevcut şartları parse et
    if (realConditions.length > 0) {
        parsedConditions = realConditions.map(c => c.conditionText || c.text || c);
        conditionNumbers = realConditions.map(c => c.conditionNumber || c.number).join(', ');
    } else {
        try {
            parsedConditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
        } catch (e) {
            parsedConditions = Array.isArray(conditions) ? conditions : [conditions];
        }
    }

    // Eğer hiç şart yoksa genel ÖSYM şartlarını göster
    if (parsedConditions.length === 0 || (parsedConditions.length === 1 && !parsedConditions[0])) {
        parsedConditions = [
            "Adayların yerleştirme puan türlerinden aldıkları puanlar sıfırdan büyük olmalıdır.",
            "Bu programa özel tercih şartı bulunmamaktadır.",
            "Genel ÖSYM tercih kuralları geçerlidir.",
            "Ön kayıt yaptırmayan adaylar yerleştirme işlemlerinde dikkate alınmazlar."
        ];
    }

    // Loading modal'ı kapat
    closeLoadingModal();

    const modalHTML = `
        <div id="detailedConditionsModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
            animation: fadeIn 0.3s ease;
        ">
            <div style="
                background: linear-gradient(135deg, #0f172a, #1e293b);
                border-radius: 20px;
                max-width: 1200px;
                width: 100%;
                max-height: 95vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
                border: 2px solid ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, ${uniType === 'Devlet' ? '#10a37f, #0d8a6a' : '#f59e0b, #d97706'});
                    padding: 25px 30px;
                    border-radius: 20px 20px 0 0;
                    position: relative;
                ">
                    <button onclick="closeDetailedConditionsModal()" style="
                        position: absolute;
                        top: 20px;
                        right: 75px;
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 45px;
                        height: 45px;
                        font-size: 28px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ×
                    </button>
                    
                    ${uni ? `
                    <!-- Checkbox -->
                    <label style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 5px;
                        background: rgba(255, 255, 255, 0.15);
                        padding: 10px;
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                        <input type="checkbox" 
                            id="uni-detailed-check" 
                            data-uni='` + JSON.stringify(uni).replace(/'/g, "&#39;") + `' 
                            onchange="toggleUniversitySelection(this)"
                            style="width: 24px; height: 24px; cursor: pointer; accent-color: white;">
                        <span style="font-size: 0.75rem; color: white; font-weight: 600;">Seç</span>
                    </label>
                    ` : ''}
                    
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="
                            background: rgba(255, 255, 255, 0.2);
                            padding: 20px;
                            border-radius: 15px;
                            backdrop-filter: blur(10px);
                        ">
                            <span style="font-size: 3rem;">📋</span>
                        </div>
                        <div style="flex: 1; padding-right: ${uni ? '100px' : '60px'};">
                            <h1 style="color: white; margin: 0 0 10px 0; font-size: 2.2rem; font-weight: 800;">
                                ${uniName}
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 1.1rem; font-weight: 500;">
                                📍 ${city} • ${campus}
                            </p>
                            <div style="
                                background: rgba(255, 255, 255, 0.15);
                                padding: 8px 15px;
                                border-radius: 25px;
                                backdrop-filter: blur(10px);
                                display: inline-block;
                                margin-top: 10px;
                            ">
                                <span style="color: white; font-weight: 600; font-size: 0.9rem;">
                                    📋 ÖSYM Şartları ve Kampüs Konumu
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;" class="modal-content-grid">
                    
                    <!-- ÖSYM Şartları -->
                    <div style="
                        background: linear-gradient(135deg, ${uniType === 'Devlet' ? 'rgba(16, 163, 127, 0.1), rgba(16, 163, 127, 0.05)' : 'rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)'});
                        border-radius: 15px;
                        padding: 25px;
                        border: 2px solid ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
                        height: fit-content;
                    ">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="
                                background: ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                width: 60px;
                                height: 60px;
                                border-radius: 15px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 2rem;
                            ">📋</div>
                            <div>
                                <h2 style="color: ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'}; margin: 0; font-size: 1.5rem; font-weight: 800;">
                                    ÖSYM 2025 Tercih Şartları
                                </h2>
                                ${conditionNumbers && conditionNumbers.trim() ? `
                                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 0.9rem;">
                                    📌 Madde Numarası: ${conditionNumbers}
                                </p>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div style="
                            background: #0f172a;
                            border-radius: 12px;
                            padding: 20px;
                            max-height: 400px;
                            overflow-y: auto;
                        ">
                            <div style="
                                color: #e2e8f0;
                                font-size: 14px;
                                line-height: 1.8;
                            ">
                                ${parsedConditions.map((condition, index) => {
        // Şart numarasını ve metnini tespit et
        let conditionText, conditionNumber, category;

        if (typeof condition === 'object') {
            conditionText = condition.conditionText || condition.text || condition;
            conditionNumber = condition.conditionNumber || condition.number || '';
            category = condition.category || '';
        } else {
            conditionText = condition;
            conditionNumber = '';
            category = '';
        }

        // Kategori ikonları
        const categoryIcon = {
            'Öğretim': '🎓',
            'Ücret': '💰',
            'Dil': '🌍',
            'Özel': '⭐',
            'Genel': '📋'
        }[category] || '📋';

        return `
                                    <div style="
                                        display: flex;
                                        align-items: flex-start;
                                        gap: 15px;
                                        margin-bottom: 16px;
                                        padding: 18px;
                                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
                                        border-radius: 12px;
                                        border-left: 4px solid ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                        border: 1px solid rgba(255, 255, 255, 0.1);
                                        transition: all 0.3s ease;
                                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'; this.style.transform='translateX(4px)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))'; this.style.transform='translateX(0)'">
                                        <div style="
                                            background: ${uniType === 'Devlet' ? 'linear-gradient(135deg, #10a37f, #0d8a6a)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
                                            color: white;
                                            min-width: 36px;
                                            height: 36px;
                                            border-radius: 10px;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: 14px;
                                            font-weight: 800;
                                            flex-shrink: 0;
                                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                        ">${conditionNumber || (index + 1)}</div>
                                        <div style="flex: 1;">
                                            <div style="
                                                color: #e2e8f0; 
                                                font-weight: 500; 
                                                line-height: 1.7;
                                                font-size: 14px;
                                                margin-bottom: 8px;
                                            ">${conditionText}</div>
                                            <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
                                                ${conditionNumber ? `
                                                    <div style="
                                                        background: rgba(${uniType === 'Devlet' ? '16, 163, 127' : '245, 158, 11'}, 0.2);
                                                        color: ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                                        padding: 4px 8px;
                                                        border-radius: 6px;
                                                        font-size: 11px;
                                                        font-weight: 700;
                                                        border: 1px solid ${uniType === 'Devlet' ? '#10a37f' : '#f59e0b'};
                                                    ">📄 ÖSYM Madde ${conditionNumber}</div>
                                                ` : ''}
                                                ${category ? `
                                                    <div style="
                                                        background: rgba(102, 126, 234, 0.2);
                                                        color: #667eea;
                                                        padding: 4px 8px;
                                                        border-radius: 6px;
                                                        font-size: 11px;
                                                        font-weight: 600;
                                                        border: 1px solid #667eea;
                                                    ">${categoryIcon} ${category}</div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    `;
    }).join('')}
                            </div>
                        </div>
                        
                        <div style="
                            background: rgba(102, 126, 234, 0.1);
                            padding: 15px;
                            border-radius: 10px;
                            margin-top: 20px;
                            border-left: 4px solid #667eea;
                        ">
                            <p style="color: #e2e8f0; margin: 0; font-size: 13px; line-height: 1.6;">
                                ${realConditions.length > 0 ?
            `✅ <strong style="color: #10a37f;">Güncel Veriler:</strong> Bu şartlar ÖSYM 2025 Yükseköğretim Programları ve Kontenjanları Kılavuzu'ndan gerçek zamanlı olarak alınmıştır. Son güncelleme: ${new Date().toLocaleDateString('tr-TR')}`
            :
            `💡 <strong style="color: #667eea;">Önemli Not:</strong> Bu üniversite için özel şart bulunamadı. Genel ÖSYM kuralları geçerlidir. Güncel şartlar için mutlaka resmi ÖSYM kılavuzunu kontrol ediniz.`
        }
                            </p>
                        </div>
                    </div>
                    
                    <!-- Google Maps (Her zaman sağda) -->
                    <div style="
                        background: #0f172a;
                        border-radius: 15px;
                        padding: 25px;
                        border: 2px solid #334155;
                    ">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                width: 60px;
                                height: 60px;
                                border-radius: 15px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 2rem;
                            ">🗺️</div>
                            <div>
                                <h2 style="color: #667eea; margin: 0; font-size: 1.5rem; font-weight: 800;">
                                    Kampüs Konumu
                                </h2>
                                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 0.9rem;">
                                    📍 ${city} - ${campus}
                                </p>
                            </div>
                        </div>
                        
                        <div style="
                            background: #1e293b;
                            border-radius: 12px;
                            overflow: hidden;
                            height: 450px;
                            border: 2px solid #334155;
                            position: relative;
                        ">
                            <iframe
                                width="100%"
                                height="100%"
                                frameborder="0"
                                style="border:0"
                                referrerpolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(uniName + ' ' + city + ' ' + campus)}&zoom=16"
                                allowfullscreen>
                            </iframe>
                        </div>
                        
                        <!-- Ulaşım Rotası Planlayın Butonu -->
                        <button 
                            id="planRouteBtn"
                            onclick="planRoute('${uniName}', '${city}', '${campus}')"
                            style="
                                width: 100%;
                                background: linear-gradient(135deg, #10a37f, #0d8a6a);
                                color: white;
                                border: none;
                                padding: 15px 20px;
                                border-radius: 12px;
                                font-size: 15px;
                                font-weight: 700;
                                cursor: pointer;
                                margin-top: 20px;
                                transition: all 0.3s ease;
                                box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 10px;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 163, 127, 0.4)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 163, 127, 0.3)'">
                            🚍 Ulaşım Rotası Planlayın
                        </button>
                        
                        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 12px; text-align: center;">
                            📱 Konumunuzdan kampüse otobüs, tramvay ve yürüyüş rotası
                        </p>
                    </div>
                </div>
                
                ${uniType === 'Vakıf' ? `
                <!-- Ücret Bilgileri (ÖSYM'nin altında, tam genişlik) -->
                <div style="padding: 0 30px 30px 30px;">
                    <div id="tuitionInfoContainer" style="
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
                        border-radius: 15px;
                        padding: 25px;
                        border: 2px solid #f59e0b;
                    ">
                        <div style="text-align: center; padding: 40px;">
                            <div class="loading-spinner" style="display: inline-block;"></div>
                            <p style="color: #f59e0b; margin-top: 15px; font-size: 1.1rem;">
                                💰 Ücret bilgileri yükleniyor...
                            </p>
                        </div>
                    </div>
                </div>
                ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Vakıf üniversitesi için ücret bilgisini yükle
    if (uniType === 'Vakıf') {
        loadTuitionFee(uniName, window.currentDepartment || 'Bilgisayar Mühendisliği', 1);
    }

    // Responsive grid kontrolü
    const modalContent = document.querySelector('#detailedConditionsModal .modal-content-grid');
    if (window.innerWidth <= 768) {
        modalContent.style.gridTemplateColumns = '1fr';
        modalContent.style.gap = '20px';
        modalContent.style.padding = '15px';
    }

    // Modal dışına tıklandığında kapat
    document.getElementById('detailedConditionsModal').addEventListener('click', function (e) {
        if (e.target.id === 'detailedConditionsModal') {
            closeDetailedConditionsModal();
        }
    });

    // Escape tuşu ile kapat
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDetailedConditionsModal();
        }
    });
}

function closeDetailedConditionsModal() {
    const modal = document.getElementById('detailedConditionsModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Ulaşım Rotası Planlama Fonksiyonu
async function planRoute(uniName, city, campus) {
    console.log('🚍 Ulaşım rotası planlanıyor:', { uniName, city, campus });

    const destination = `${uniName} ${city} ${campus}`;

    // Konum izni kontrolü
    if (!navigator.geolocation) {
        alert('❌ Tarayıcınız konum hizmetlerini desteklemiyor.');
        return;
    }

    // Butonu devre dışı bırak ve yükleniyor göster
    const btn = document.getElementById('planRouteBtn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = '📍 Konumunuz alınıyor...';

    // Kullanıcının konumunu al
    navigator.geolocation.getCurrentPosition(
        // Başarılı
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log('✅ Konum alındı:', { lat, lng });

            // Google Maps yol tarifi URL'i (toplu taşıma modu ile)
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destination)}&travelmode=transit`;

            // Yeni sekmede aç
            window.open(mapsUrl, '_blank');

            // Butonu eski haline getir
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHTML;

            // Başarı mesajı göster
            showTemporaryMessage('✅ Yol tarifi Google Maps\'te açıldı!', 'success');
        },
        // Hata
        (error) => {
            console.error('❌ Konum hatası:', error);

            let errorMessage = '';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '❌ Konum izni reddedildi. Lütfen tarayıcı ayarlarınızdan konum iznini etkinleştirin.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '❌ Konum bilgisi alınamıyor. İnternet bağlantınızı kontrol edin.';
                    break;
                case error.TIMEOUT:
                    errorMessage = '❌ Konum alma zaman aşımına uğradı. Lütfen tekrar deneyin.';
                    break;
                default:
                    errorMessage = '❌ Konum alınırken bir hata oluştu.';
            }

            // Konum olmadan da Google Maps'i aç
            const mapsUrlNoOrigin = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;

            if (confirm(errorMessage + '\n\nKonumunuzu manuel olarak girmek için Google Maps\'i açmak ister misiniz?')) {
                window.open(mapsUrlNoOrigin, '_blank');
            }

            // Butonu eski haline getir
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHTML;
        },
        // Seçenekler
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Geçici mesaj göster
function showTemporaryMessage(message, type = 'info') {
    const bgColors = {
        'success': 'linear-gradient(135deg, #10a37f, #0d8a6a)',
        'error': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'info': 'linear-gradient(135deg, #667eea, #764ba2)'
    };

    const messageHTML = `
        <div id="tempMessage" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColors[type]};
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            z-index: 10004;
            font-size: 14px;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        ">
            ${message}
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', messageHTML);

    // 3 saniye sonra kaldır
    setTimeout(() => {
        const msg = document.getElementById('tempMessage');
        if (msg) {
            msg.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }
    }, 3000);
}

// Global scope'a ekle
window.planRoute = planRoute;

// Loading Modal Functions
function showLoadingModal(message = 'Yükleniyor...') {
    const loadingHTML = `
        <div id="loadingModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        ">
            <div style="
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                border: 2px solid #10a37f;
                max-width: 400px;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #334155;
                    border-top: 4px solid #10a37f;
                    border-radius: 50%;
                    margin: 0 auto 20px auto;
                    animation: spin 1s linear infinite;
                "></div>
                <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem;">${message}</h3>
                <p style="color: #94a3b8; margin: 0; font-size: 0.9rem;">ÖSYM 2025 verilerinden çekiliyor...</p>
            </div>
        </div>
        
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function closeLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Global scope'a ekle
window.showUniversityDetailModal = showUniversityDetailModal;
window.closeUniversityDetailModal = closeUniversityDetailModal;
window.closeUniversityModal = closeUniversityModal;
window.showDetailedConditionsModal = showDetailedConditionsModal;
window.closeDetailedConditionsModal = closeDetailedConditionsModal;
window.showEligibleUniversityModal = showEligibleUniversityModal;

// Test log
console.log('🎯 Detaylı modal fonksiyonları yüklendi:', {
    showDetailedConditionsModal: typeof showDetailedConditionsModal,
    closeDetailedConditionsModal: typeof closeDetailedConditionsModal
});

// ============================================
// GOOGLE SHEETS ENTEGRASYONU
// ============================================

// Üniversite seçim toggle
function toggleUniversitySelection(checkbox) {
    const uniData = JSON.parse(checkbox.getAttribute('data-uni').replace(/&#39;/g, "'"));

    if (checkbox.checked) {
        selectedUniversities.add(JSON.stringify(uniData));
    } else {
        selectedUniversities.delete(JSON.stringify(uniData));
    }

    // Seçili sayısını güncelle
    updateSelectedCount();
}

// Seçili üniversite sayısını güncelle
function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    const exportBtn = document.getElementById('exportToSheetsBtn');

    if (countElement) {
        countElement.textContent = selectedUniversities.size;
    }

    if (exportBtn) {
        if (selectedUniversities.size === 0) {
            exportBtn.style.opacity = '0.5';
            exportBtn.style.cursor = 'not-allowed';
            exportBtn.disabled = true;
        } else {
            exportBtn.style.opacity = '1';
            exportBtn.style.cursor = 'pointer';
            exportBtn.disabled = false;
        }
    }
}

// Google Sheets'e aktar
async function exportSelectedToGoogleSheets(deptName, allUniversities) {
    if (selectedUniversities.size === 0) {
        showNotification('⚠️ Lütfen en az bir üniversite seçin!', 'warning');
        return;
    }

    // Seçili üniversiteleri parse et
    const selectedUnis = Array.from(selectedUniversities).map(uniStr => JSON.parse(uniStr));

    console.log('📊 Google Sheets\'e aktarılıyor:', {
        department: deptName,
        selectedCount: selectedUnis.length,
        universities: selectedUnis.map(u => u.name)
    });

    // Loading göster
    const exportBtn = document.getElementById('exportToSheetsBtn');
    const originalContent = exportBtn.innerHTML;
    exportBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Google Sheets oluşturuluyor...
    `;
    exportBtn.disabled = true;
    exportBtn.style.cursor = 'not-allowed';

    try {
        const response = await fetch(`${API_URL}/api/export-to-sheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `${deptName} - Seçtiğim Üniversiteler - ${new Date().toLocaleDateString('tr-TR')}`,
                universities: selectedUnis,
                userEmail: userProfile?.email || null
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Google Sheets oluşturuldu:', result.spreadsheetUrl);

            // Başarı mesajı göster
            showNotification('✅ Google Sheets başarıyla oluşturuldu!', 'success');

            // Modal kapat ve Google Sheets'i aç
            document.getElementById('universitySelectionModal')?.remove();

            // Yeni sekmede aç
            window.open(result.spreadsheetUrl, '_blank');

            // Seçimi temizle
            selectedUniversities.clear();

        } else {
            throw new Error(result.message || result.error || 'Bilinmeyen hata');
        }

    } catch (error) {
        console.error('❌ Google Sheets export hatası:', error);

        let errorMessage = '❌ Google Sheets oluşturulamadı!';
        if (error.message.includes('google-credentials.json')) {
            errorMessage += ' Google Service Account credentials dosyası bulunamadı.';
        } else {
            errorMessage += ' ' + error.message;
        }

        showNotification(errorMessage, 'error');

        // Butonu eski haline getir
        exportBtn.innerHTML = originalContent;
        exportBtn.disabled = false;
        exportBtn.style.cursor = 'pointer';
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10a37f' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 100000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// CSS animasyonları ekle
if (!document.getElementById('googleSheetsAnimations')) {
    const style = document.createElement('style');
    style.id = 'googleSheetsAnimations';
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}







// ============================================
// ANALİZ SEÇİM SİSTEMİ (Tercih vs Hedef)
// ============================================

function setupAnalysisChoiceCards() {
    const tercihCard = document.getElementById('tercihAnalysisCard');
    const hedefCard = document.getElementById('hedefAnalysisCard');
    const choiceContainer = document.getElementById('analysisChoiceContainer');
    const tercihForm = document.getElementById('tercihAnalysisForm');
    const hedefForm = document.getElementById('hedefAnalysisForm');
    const backFromTercih = document.getElementById('backFromTercih');
    const backFromHedef = document.getElementById('backFromHedef');

    // Tercih Analizi kartına tıklama
    tercihCard?.addEventListener('click', () => {
        choiceContainer.style.display = 'none';
        tercihForm.style.display = 'block';
    });

    // Hedef Analizi kartına tıklama
    hedefCard?.addEventListener('click', () => {
        choiceContainer.style.display = 'none';
        hedefForm.style.display = 'block';
    });

    // Geri butonları
    backFromTercih?.addEventListener('click', () => {
        tercihForm.style.display = 'none';
        choiceContainer.style.display = 'grid';
    });

    backFromHedef?.addEventListener('click', () => {
        hedefForm.style.display = 'none';
        choiceContainer.style.display = 'grid';
    });
}

// ============================================
// AYT DİNAMİK NET GİRİŞİ
// ============================================

function showAytNets() {
    const aytAlan = document.getElementById('aytAlan').value;
    const aytNetsSection = document.getElementById('aytNetsSection');
    const aytNetsContainer = document.getElementById('aytNetsContainer');

    if (!aytAlan) {
        aytNetsSection.style.display = 'none';
        return;
    }

    aytNetsSection.style.display = 'block';
    aytNetsContainer.innerHTML = '';

    let fields = [];

    if (aytAlan === 'sayisal') {
        fields = [
            { id: 'aytMat', label: 'Matematik', max: 40 },
            { id: 'aytFen', label: 'Fen Bilimleri', max: 40 }
        ];
    } else if (aytAlan === 'esit') {
        fields = [
            { id: 'aytMat', label: 'Matematik', max: 40 },
            { id: 'aytEdebiyat', label: 'Türk Dili ve Edebiyatı', max: 24 },
            { id: 'aytSosyal', label: 'Sosyal Bilimler', max: 24 }
        ];
    } else if (aytAlan === 'sozel') {
        fields = [
            { id: 'aytEdebiyat', label: 'Türk Dili ve Edebiyatı', max: 24 },
            { id: 'aytTarih', label: 'Tarih', max: 10 },
            { id: 'aytCografya', label: 'Coğrafya', max: 6 },
            { id: 'aytFelsefe', label: 'Felsefe', max: 12 },
            { id: 'aytDin', label: 'Din Kültürü ve Ahlak Bilgisi', max: 6 }
        ];
    }

    fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label>${field.label} (Max: ${field.max})</label>
            <input type="number" id="${field.id}" placeholder="Örn: 15.25" min="0" max="${field.max}" step="0.01" required>
            <small>Ondalıklı net girebilirsiniz (örn: 15.25, 20.5)</small>
        `;
        aytNetsContainer.appendChild(formGroup);
        
        // Dinamik validasyon ekle
        const input = formGroup.querySelector('input');
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value > field.max) {
                e.target.value = field.max;
                showToast(`⚠️ ${field.label} için maksimum ${field.max} net girebilirsiniz`);
            } else if (value < 0) {
                e.target.value = 0;
            }
        });
    });
}

// Toast bildirimi göster
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutToTop 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// HEDEF ANALİZİ İŞLEME
// ============================================

async function handleHedefAnalysis(e) {
    e.preventDefault();

    // Form verilerini topla
    const tytNets = {
        turkce: parseFloat(document.getElementById('tytTurkce').value) || 0,
        mat: parseFloat(document.getElementById('tytMat').value) || 0,
        sosyal: parseFloat(document.getElementById('tytSosyal').value) || 0,
        fen: parseFloat(document.getElementById('tytFen').value) || 0
    };

    const aytAlan = document.getElementById('aytAlan').value;
    const hedefBolum = document.getElementById('hedefBolum').value.trim();
    const aytNets = {};

    if (aytAlan === 'sayisal') {
        aytNets.mat = parseFloat(document.getElementById('aytMat').value) || 0;
        aytNets.fen = parseFloat(document.getElementById('aytFen').value) || 0;
    } else if (aytAlan === 'esit') {
        aytNets.mat = parseFloat(document.getElementById('aytMat').value) || 0;
        aytNets.edebiyat = parseFloat(document.getElementById('aytEdebiyat').value) || 0;
        aytNets.sosyal = parseFloat(document.getElementById('aytSosyal').value) || 0;
    } else if (aytAlan === 'sozel') {
        aytNets.edebiyat = parseFloat(document.getElementById('aytEdebiyat').value) || 0;
        aytNets.tarih = parseFloat(document.getElementById('aytTarih').value) || 0;
        aytNets.cografya = parseFloat(document.getElementById('aytCografya').value) || 0;
        aytNets.felsefe = parseFloat(document.getElementById('aytFelsefe').value) || 0;
        aytNets.din = parseFloat(document.getElementById('aytDin').value) || 0;
    }

    // Validasyon
    if (!hedefBolum) {
        showToast('⚠️ Lütfen hayalinizdeki bölümü giriniz');
        return;
    }

    // Welcome screen'i gizle
    hideWelcomeScreen();

    // Kullanıcı mesajını göster
    const totalTytNet = (tytNets.turkce + tytNets.mat + tytNets.sosyal + tytNets.fen).toFixed(2);
    const totalAytNet = Object.values(aytNets).reduce((a, b) => a + b, 0).toFixed(2);
    
    const alanIsim = aytAlan === 'sayisal' ? 'Sayısal (MF)' : 
                     aytAlan === 'esit' ? 'Eşit Ağırlık (TM)' : 
                     'Sözel (TS)';

    const userMessage = `
🚀 **Hedef Analizi İsteği**

💭 **Hayalimdeki Bölüm:** ${hedefBolum}

📘 **TYT Netlerim:**
• Türkçe: ${tytNets.turkce.toFixed(2)}
• Matematik: ${tytNets.mat.toFixed(2)}
• Sosyal: ${tytNets.sosyal.toFixed(2)}
• Fen: ${tytNets.fen.toFixed(2)}
**Toplam TYT Net: ${totalTytNet}**

📗 **AYT Alanım:** ${alanIsim}
${Object.entries(aytNets).map(([key, val]) => {
    const labels = {
        mat: 'Matematik',
        fen: 'Fen Bilimleri',
        edebiyat: 'Türk Dili ve Edebiyatı',
        sosyal: 'Sosyal Bilimler',
        tarih: 'Tarih',
        cografya: 'Coğrafya',
        felsefe: 'Felsefe',
        din: 'Din Kültürü'
    };
    return `• ${labels[key] || key}: ${val.toFixed(2)}`;
}).join('\n')}
**Toplam AYT Net: ${totalAytNet}**
    `.trim();

    addMessage(userMessage, 'user');

    // AI yanıtını bekle
    showTypingIndicator();

    try {
        const response = await fetch(`${API_URL}/api/hedef-analiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tytNets, aytNets, aytAlan, hedefBolum })
        });

        const data = await response.json();
        removeTypingIndicator();

        if (data.success) {
            // Yeni formatı kullan
            const formattedHTML = formatHedefAnalysisResult(data.data, data.message);
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai';
            messageDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    ${formattedHTML}
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            scrollToBottom();
        } else {
            addMessage('❌ Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
        }
    } catch (error) {
        console.error('Hedef analiz hatası:', error);
        removeTypingIndicator();
        addMessage('❌ Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.', 'ai');
    }
}

// Typing indicator fonksiyonları
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message ai typing-indicator-msg';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// NET GİRİŞ VALIDASYONU
// ============================================

function setupNetValidation(inputId, maxValue) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', (e) => {
        let value = parseFloat(e.target.value);
        
        // Değer kontrolü
        if (isNaN(value)) return;
        
        if (value > maxValue) {
            e.target.value = maxValue;
            showToast(`⚠️ Maksimum ${maxValue} net girebilirsiniz`);
        } else if (value < 0) {
            e.target.value = 0;
            showToast(`⚠️ Net değeri negatif olamaz`);
        }
        
        // 2 ondalık basamağa yuvarla
        if (value.toString().includes('.')) {
            const parts = value.toString().split('.');
            if (parts[1] && parts[1].length > 2) {
                e.target.value = value.toFixed(2);
            }
        }
    });

    // Blur olayında son kontrol
    input.addEventListener('blur', (e) => {
        let value = parseFloat(e.target.value);
        if (!isNaN(value) && value > 0) {
            e.target.value = value.toFixed(2);
        }
    });

    // Virgül yerine nokta kullanımını zorla
    input.addEventListener('keypress', (e) => {
        if (e.key === ',') {
            e.preventDefault();
            const cursorPos = e.target.selectionStart;
            e.target.value = e.target.value.slice(0, cursorPos) + '.' + e.target.value.slice(cursorPos);
            e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
        }
    });
}

// ============================================
// HEDEF ANALİZİ SONUÇ FORMATLAMA
// ============================================

function formatHedefAnalysisResult(data, aiText) {
    // Mesajı parse et
    const lines = aiText.split('\n').filter(line => line.trim());
    
    // Seviye class belirleme
    const seviyeClassMap = {
        'Mükemmel': 'seviye-mukemmel',
        'Çok İyi': 'seviye-cok-iyi',
        'İyi': 'seviye-iyi',
        'Orta': 'seviye-orta',
        'Başlangıç': 'seviye-gelistirilmeli'
    };
    
    const seviyeClass = seviyeClassMap[data.seviye] || 'seviye-iyi';
    
    return `
        <div class="hedef-sonuc-container">
            <!-- Başlık Kartı -->
            <div class="hedef-baslik-card">
                <h2>🎯 Hedef Analiz Sonucunuz</h2>
                <div class="hedef-isim">💭 ${data.hedefBolum || 'Hedef Bölüm'}</div>
                <div class="seviye-badge-hero ${seviyeClass}">
                    ${getSeviyeEmoji(data.seviye)} ${data.seviye || 'İyi'} Seviye
                </div>
            </div>

            <!-- Net Kartları -->
            <div class="net-showcase">
                <div class="net-showcase-item">
                    <div class="net-showcase-label">📘 TYT</div>
                    <div class="net-showcase-value">${data.tytNet}</div>
                    <div class="net-showcase-sublabel">net</div>
                </div>
                <div class="net-showcase-item">
                    <div class="net-showcase-label">📗 AYT</div>
                    <div class="net-showcase-value">${data.aytNet}</div>
                    <div class="net-showcase-sublabel">net</div>
                </div>
                <div class="net-showcase-item">
                    <div class="net-showcase-label">🎯 TOPLAM</div>
                    <div class="net-showcase-value">${data.toplamNet}</div>
                    <div class="net-showcase-sublabel">net</div>
                </div>
            </div>

            <!-- AI Analiz -->
            <div class="ai-analiz-section">
                <h3>🤖 Kişisel Değerlendirmeniz</h3>
                <div class="ai-analiz-content">
                    ${aiText.split('\n').map(line => {
                        line = line.trim();
                        if (line.startsWith('━')) return '';
                        if (line.includes('**') || line.length > 0) {
                            return `<p>${line.replace(/\*\*/g, '<strong>').replace(/\*/g, '')}</p>`;
                        }
                        return '';
                    }).filter(l => l).join('')}
                </div>
            </div>

            <!-- Bölümler Grid -->
            ${data.programs && data.programs.length > 0 ? `
            <div class="ai-analiz-section">
                <h3>🎓 ${data.alan} Alanında Kazanılabilecek Bölümler</h3>
                <div class="bolumler-grid">
                    ${data.programs.slice(0, 8).map((prog, index) => `
                        <div class="bolum-card">
                            <div class="bolum-card-header">
                                <div class="bolum-card-number">${index + 1}</div>
                                <div class="bolum-card-type ${prog.type === 'Devlet' ? 'devlet' : 'vakif'}">
                                    ${prog.type === 'Devlet' ? '🏛️' : '🏢'} ${prog.type}
                                </div>
                            </div>
                            <div class="bolum-card-title">${prog.department}</div>
                            <div class="bolum-card-info">
                                <div class="bolum-info-row">
                                    🏛️ <strong>${prog.name}</strong>
                                </div>
                                <div class="bolum-info-row">
                                    📍 ${prog.city || 'Belirtilmemiş'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- CTA -->
            <div class="hedef-cta">
                <h3>💡 Bir Sonraki Adım</h3>
                <p>Daha detaylı analiz için tercih analizi yapabilirsiniz</p>
                <button class="hedef-cta-btn" onclick="window.location.reload()">
                    🎯 Tercih Analizi Yap
                </button>
            </div>
        </div>
    `;
}

function getSeviyeEmoji(seviye) {
    const emojiMap = {
        'Mükemmel': '🌟',
        'Çok İyi': '⭐',
        'İyi': '��',
        'Orta': '📈',
        'Başlangıç': '💪'
    };
    return emojiMap[seviye] || '👍';
}

// ============================================
// 💰 VAKIF ÜNİVERSİTESİ ÜCRET BİLGİSİ YÜKLEME
// ============================================

async function loadTuitionFee(university, department, preferenceOrder = null) {
    console.log(`💰 Ücret bilgisi yükleniyor: ${university} - ${department}`);

    const container = document.getElementById('tuitionInfoContainer');
    if (!container) {
        console.warn('⚠️ Ücret bilgisi container bulunamadı');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/tuition-fee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ university, department, preferenceOrder })
        });

        const data = await response.json();

        if (data.success && data.html) {
            // HTML'i container'a yerleştir
            container.innerHTML = data.html;
            console.log('✅ Ücret bilgisi yüklendi');
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <p style="color: #f59e0b; font-size: 1.1rem;">
                        💡 Bu üniversite için ücret bilgisi bulunamadı
                    </p>
                    <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px;">
                        Güncel ücret bilgileri için üniversitenin resmi web sitesini ziyaret edebilirsiniz.
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Ücret bilgisi yüklenirken hata:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <p style="color: #ef4444; font-size: 1.1rem;">
                    ❌ Ücret bilgisi yüklenemedi
                </p>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px;">
                    ${error.message || 'Bir hata oluştu'}
                </p>
            </div>
        `;
    }
}
