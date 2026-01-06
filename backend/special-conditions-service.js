const fs = require('fs');
const path = require('path');

/**
 * ÖSYM Özel Şartlar Servisi
 * special_conditions2.json dosyasından program kodlarına göre şart maddelerini yönetir
 */

let specialConditionsData = null;
let legendData = null;

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
        
        legendData = jsonData.legend || {};
        specialConditionsData = jsonData.programs || [];
        
        console.log(`✅ ${specialConditionsData.length} program için ÖSYM şart verileri yüklendi`);
        console.log(`✅ ${Object.keys(legendData).length} şart maddesi tanımı yüklendi`);
        return specialConditionsData;
    } catch (error) {
        console.error('❌ special_conditions2.json yüklenemedi:', error.message);
        return [];
    }
}

/**
 * Program koduna göre şart maddelerini getir
 * @param {string} programCode - Program kodu (örn: "106510090")
 * @returns {object|null} - Program şart bilgileri veya null
 */
function getConditionsByProgramCode(programCode) {
    const data = loadSpecialConditionsData();

    if (!data || data.length === 0) {
        return null;
    }

    const program = data.find(p => p.programCode === programCode);
    
    if (!program) {
        return null;
    }

    return {
        programCode: program.programCode,
        university: program.university,
        programName: program.program,
        specialConditions: program.specialConditions || [],
        legend: legendData
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

    if (!data || data.length === 0) {
        return null;
    }

    // Normalize edilmiş arama
    const normalizedUniName = universityName.toUpperCase().trim();
    const normalizedProgName = programName.toLowerCase().trim();

    // Tam eşleşme ara
    let program = data.find(p =>
        p.university && p.university.toUpperCase().trim() === normalizedUniName &&
        p.program && p.program.toLowerCase().includes(normalizedProgName)
    );

    // Eğer bulunamazsa, kısmi eşleşme dene
    if (!program) {
        program = data.find(p =>
            p.university && p.university.toUpperCase().includes(normalizedUniName) &&
            p.program && p.program.toLowerCase().includes(normalizedProgName)
        );
    }

    if (!program) {
        return null;
    }

    return {
        programCode: program.programCode,
        university: program.university,
        programName: program.program,
        specialConditions: program.specialConditions || [],
        legend: legendData
    };
}

/**
 * Bir üniversitenin tüm programlarını ve şartlarını getir
 * @param {string} universityName - Üniversite adı
 * @returns {array} - Program listesi
 */
function getAllProgramsByUniversity(universityName) {
    const data = loadSpecialConditionsData();

    if (!data || data.length === 0) {
        return [];
    }

    const normalizedUniName = universityName.toUpperCase().trim();

    const programs = data.filter(p =>
        p.university && p.university.toUpperCase().includes(normalizedUniName)
    );

    return programs.map(p => ({
        programCode: p.programCode,
        university: p.university,
        programName: p.program,
        specialConditions: p.specialConditions || [],
        legend: legendData
    }));
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
    
    // Eğer eski format ise (sadece sayılar dizisi)
    if (typeof specialConditions[0] === 'number' || typeof specialConditions[0] === 'string') {
        return specialConditions.join(', ');
    }
    
    // Yeni format (object array)
    return specialConditions.map(c => c.code).join(', ');
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
        code: c.code,
        description: c.description
    }));
}

/**
 * Legend verisini getir
 * @returns {object} - Legend objesi
 */
function getLegend() {
    loadSpecialConditionsData();
    return legendData || {};
}

/**
 * JSON verisini yeniden yükle (hot reload için)
 */
function reloadData() {
    specialConditionsData = null;
    return loadSpecialConditionsData();
}

module.exports = {
    loadSpecialConditionsData,
    getConditionsByProgramCode,
    getConditionsByUniversityAndProgram,
    getAllProgramsByUniversity,
    formatArticleNumbers,
    getConditionDescriptions,
    getLegend,
    reloadData
};
