const fs = require('fs');
const path = require('path');

/**
 * ÖSYM Özel Şartlar Servisi
 * special_conditions2.json dosyasından program kodlarına göre şart maddelerini yönetir
 * osym_madde_aciklamalari.json dosyasından madde içeriklerini çeker
 */

let specialConditionsData = null;
let osmyMaddeAciklamalari = null;

/**
 * special_conditions2.json dosyasını yükle
 */
function loadSpecialConditionsData() {
    if (specialConditionsData) {
        return specialConditionsData;
    }

    try {
        const filePath = path.join(__dirname, 'special_conditions2.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        specialConditionsData = jsonData.programs || [];
        
        console.log(`✅ ${specialConditionsData.length} program için ÖSYM şart verileri yüklendi`);
        return specialConditionsData;
    } catch (error) {
        console.error('❌ special_conditions2.json yüklenemedi:', error.message);
        return [];
    }
}

/**
 * osym_madde_aciklamalari.json dosyasını yükle
 */
function loadOsymMaddeAciklamalari() {
    if (osmyMaddeAciklamalari) {
        return osmyMaddeAciklamalari;
    }

    try {
        const filePath = path.join(__dirname, 'osym_madde_aciklamalari.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // Maddeleri madde_no'ya göre indexle
        osmyMaddeAciklamalari = {};
        if (jsonData.maddeler && Array.isArray(jsonData.maddeler)) {
            jsonData.maddeler.forEach(madde => {
                osmyMaddeAciklamalari[madde.madde_no.toString()] = {
                    madde_kodu: madde.madde_kodu,
                    icerik: madde.icerik
                };
            });
        }
        
        console.log(`✅ ${Object.keys(osmyMaddeAciklamalari).length} ÖSYM madde açıklaması yüklendi`);
        return osmyMaddeAciklamalari;
    } catch (error) {
        console.error('❌ osym_madde_aciklamalari.json yüklenemedi:', error.message);
        return {};
    }
}

/**
 * Program koduna göre şart maddelerini getir
 * @param {string} programCode - Program kodu (örn: "106510090")
 * @returns {object|null} - Program şart bilgileri veya null
 */
function getConditionsByProgramCode(programCode) {
    const data = loadSpecialConditionsData();
    const maddeAciklamalari = loadOsymMaddeAciklamalari();

    if (!data || data.length === 0) {
        return null;
    }

    const program = data.find(p => p.programCode === programCode);
    
    if (!program) {
        return null;
    }

    // Madde numaralarını ÖSYM madde açıklamalarıyla birleştir
    const detailedConditions = (program.specialConditions || []).map(condition => {
        // Eğer condition bir object ise (code ve description varsa)
        if (typeof condition === 'object' && condition.code) {
            const maddeNo = condition.code.toString();
            const osmyAciklama = maddeAciklamalari[maddeNo];
            
            return {
                madde_no: parseInt(maddeNo),
                madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
                icerik: osmyAciklama ? osmyAciklama.icerik : condition.description
            };
        }
        
        // Eğer sadece numara ise
        const maddeNo = condition.toString();
        const osmyAciklama = maddeAciklamalari[maddeNo];
        
        return {
            madde_no: parseInt(maddeNo),
            madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
            icerik: osmyAciklama ? osmyAciklama.icerik : 'Açıklama bulunamadı'
        };
    });

    return {
        programCode: program.programCode,
        university: program.university,
        programName: program.program,
        specialConditions: detailedConditions
    };
}

/**
 * Üniversite adı ve program adına göre şart maddelerini getir
 * @param {string} universityName - Üniversite adı
 * @param {string} programName - Program adı
 * @returns {object|null} - Program şart bilgileri veya null
 */
function getConditionsByUniversityAndProgram(universityName, programName) {
    const data = loadSpecialConditionsData();
    const maddeAciklamalari = loadOsymMaddeAciklamalari();

    if (!data || data.length === 0) {
        return null;
    }

    // Normalize edilmiş arama - Üniversitesi, Üniv. gibi kelimeleri kaldır
    const cleanUniversityName = (name) => {
        return name
            .toUpperCase()
            .trim()
            .replace(/ÜNİVERSİTESİ/g, '')
            .replace(/ÜNİV\./g, '')
            .replace(/UNIVERSITY/g, '')
            .trim();
    };

    const normalizedUniName = cleanUniversityName(universityName);
    const normalizedProgName = programName.toLowerCase().trim();

    console.log(`🔍 Arama: "${normalizedUniName}" - "${normalizedProgName}"`);

    // Tam eşleşme ara
    let program = data.find(p => {
        const cleanedDbName = cleanUniversityName(p.university || '');
        return cleanedDbName === normalizedUniName &&
            p.program && p.program.toLowerCase().includes(normalizedProgName);
    });

    // Eğer bulunamazsa, kısmi eşleşme dene
    if (!program) {
        program = data.find(p => {
            const cleanedDbName = cleanUniversityName(p.university || '');
            return cleanedDbName.includes(normalizedUniName) &&
                p.program && p.program.toLowerCase().includes(normalizedProgName);
        });
    }

    // Hala bulunamadıysa, daha gevşek arama
    if (!program) {
        program = data.find(p => {
            const cleanedDbName = cleanUniversityName(p.university || '');
            return normalizedUniName.includes(cleanedDbName) &&
                p.program && p.program.toLowerCase().includes(normalizedProgName);
        });
    }

    if (!program) {
        console.log(`❌ Program bulunamadı: ${universityName} - ${programName}`);
        return null;
    }

    console.log(`✅ Program bulundu: ${program.university} - ${program.program}`);

    // Madde numaralarını ÖSYM madde açıklamalarıyla birleştir
    const detailedConditions = (program.specialConditions || []).map(condition => {
        // Eğer condition bir object ise (code ve description varsa)
        if (typeof condition === 'object' && condition.code) {
            const maddeNo = condition.code.toString();
            const osmyAciklama = maddeAciklamalari[maddeNo];
            
            return {
                madde_no: parseInt(maddeNo),
                madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
                icerik: osmyAciklama ? osmyAciklama.icerik : condition.description
            };
        }
        
        // Eğer sadece numara ise
        const maddeNo = condition.toString();
        const osmyAciklama = maddeAciklamalari[maddeNo];
        
        return {
            madde_no: parseInt(maddeNo),
            madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
            icerik: osmyAciklama ? osmyAciklama.icerik : 'Açıklama bulunamadı'
        };
    });

    return {
        programCode: program.programCode,
        university: program.university,
        programName: program.program,
        specialConditions: detailedConditions
    };
}

/**
 * Bir üniversitenin tüm programlarını ve şartlarını getir
 * @param {string} universityName - Üniversite adı
 * @returns {array} - Program listesi
 */
function getAllProgramsByUniversity(universityName) {
    const data = loadSpecialConditionsData();
    const maddeAciklamalari = loadOsymMaddeAciklamalari();

    if (!data || data.length === 0) {
        return [];
    }

    const normalizedUniName = universityName.toUpperCase().trim();

    const programs = data.filter(p =>
        p.university && p.university.toUpperCase().includes(normalizedUniName)
    );

    return programs.map(p => {
        // Madde numaralarını ÖSYM madde açıklamalarıyla birleştir
        const detailedConditions = (p.specialConditions || []).map(condition => {
            // Eğer condition bir object ise (code ve description varsa)
            if (typeof condition === 'object' && condition.code) {
                const maddeNo = condition.code.toString();
                const osmyAciklama = maddeAciklamalari[maddeNo];
                
                return {
                    madde_no: parseInt(maddeNo),
                    madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
                    icerik: osmyAciklama ? osmyAciklama.icerik : condition.description
                };
            }
            
            // Eğer sadece numara ise
            const maddeNo = condition.toString();
            const osmyAciklama = maddeAciklamalari[maddeNo];
            
            return {
                madde_no: parseInt(maddeNo),
                madde_kodu: osmyAciklama ? osmyAciklama.madde_kodu : `Bk. ${maddeNo}`,
                icerik: osmyAciklama ? osmyAciklama.icerik : 'Açıklama bulunamadı'
            };
        });

        return {
            programCode: p.programCode,
            university: p.university,
            programName: p.program,
            specialConditions: detailedConditions
        };
    });
}

/**
 * Madde numaralarını formatla
 * @param {array} specialConditions - Şart maddeleri dizisi
 * @returns {string} - Formatlanmış string (örn: "18, 21, 22")
 */
function formatArticleNumbers(specialConditions) {
    if (!specialConditions || specialConditions.length === 0) {
        return '';
    }
    
    // Eğer detaylı format ise (object array)
    if (typeof specialConditions[0] === 'object' && specialConditions[0].madde_no) {
        return specialConditions.map(c => c.madde_no).join(', ');
    }
    
    // Eski format (sadece sayılar dizisi)
    return specialConditions.join(', ');
}

/**
 * Şart açıklamalarını getir
 * @param {array} specialConditions - Şart maddeleri dizisi
 * @returns {array} - Açıklamaların dizisi
 */
function getConditionDescriptions(specialConditions) {
    if (!specialConditions || specialConditions.length === 0) {
        return [];
    }
    
    return specialConditions.map(c => ({
        madde_no: c.madde_no,
        madde_kodu: c.madde_kodu,
        icerik: c.icerik
    }));
}

/**
 * JSON verisini yeniden yükle (hot reload için)
 */
function reloadData() {
    specialConditionsData = null;
    osmyMaddeAciklamalari = null;
    loadSpecialConditionsData();
    loadOsymMaddeAciklamalari();
    return true;
}

module.exports = {
    loadSpecialConditionsData,
    loadOsymMaddeAciklamalari,
    getConditionsByProgramCode,
    getConditionsByUniversityAndProgram,
    getAllProgramsByUniversity,
    formatArticleNumbers,
    getConditionDescriptions,
    reloadData
};
