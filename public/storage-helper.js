// localStorage güvenli erişim helper'ı
const StorageHelper = {
    isAvailable: false,
    
    // localStorage kullanılabilir mi kontrol et
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.isAvailable = true;
            return true;
        } catch (e) {
            this.isAvailable = false;
            console.warn('localStorage kullanılamıyor, geçici depolama kullanılacak');
            return false;
        }
    },
    
    // Geçici depolama (localStorage kullanılamazsa)
    tempStorage: {},
    
    // Öğe kaydet
    setItem(key, value) {
        if (this.isAvailable) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn('localStorage yazma hatası:', e);
            }
        }
        // Fallback: geçici depolama
        this.tempStorage[key] = value;
        return false;
    },
    
    // Öğe oku
    getItem(key) {
        if (this.isAvailable) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage okuma hatası:', e);
            }
        }
        // Fallback: geçici depolama
        return this.tempStorage[key] || null;
    },
    
    // Öğe sil
    removeItem(key) {
        if (this.isAvailable) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('localStorage silme hatası:', e);
            }
        }
        // Fallback: geçici depolama
        delete this.tempStorage[key];
        return false;
    },
    
    // Tümünü temizle
    clear() {
        if (this.isAvailable) {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.warn('localStorage temizleme hatası:', e);
            }
        }
        // Fallback: geçici depolama
        this.tempStorage = {};
        return false;
    }
};

// Sayfa yüklendiğinde kontrol et
StorageHelper.checkAvailability();
