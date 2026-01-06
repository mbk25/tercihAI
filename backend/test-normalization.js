// Test Turkish normalization matching
const fs = require('fs');
const path = require('path');

// Türkçe karakterleri normalize et
function normalizeTurkish(str) {
    return str
        .toUpperCase()
        .trim()
        .replace(/İ/g, 'I')
        .replace(/I/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C');
}

// Load the JSON
const data = JSON.parse(fs.readFileSync('special_conditions.json', 'utf8'));

// Simulate what the database returns
const dbUniversityName = "BEZMIALEM VAKIF ÜNİVERSİTESİ";
const dbProgramName = "BİLGİSAYAR PROGRAMCILIĞI";

console.log('🔍 Testing Turkish normalization...\n');
console.log('Database returns:');
console.log('  University:', dbUniversityName);
console.log('  Program:', dbProgramName);
console.log('\nNormalized:');
console.log('  University:', normalizeTurkish(dbUniversityName));
console.log('  Program:', normalizeTurkish(dbProgramName));

// Find matches
const normalizedUniName = normalizeTurkish(dbUniversityName);
const normalizedProgramName = normalizeTurkish(dbProgramName);

const matches = data.filter(cond => {
    const condUniName = normalizeTurkish(cond.universityName);
    const condProgName = normalizeTurkish(cond.programName);
    
    const uniMatch = condUniName === normalizedUniName || 
                     condUniName.includes(normalizedUniName) || 
                     normalizedUniName.includes(condUniName);
    const progMatch = condProgName === normalizedProgramName || 
                     condProgName.includes(normalizedProgramName) || 
                     normalizedProgramName.includes(condProgName);
    
    return uniMatch && progMatch;
});

console.log('\n✅ Matches found:', matches.length);
if (matches.length > 0) {
    console.log('\nMatched programs:');
    matches.forEach(m => {
        console.log(`  - ${m.programName}`);
        console.log(`    Articles: ${m.articleNumbers.join(', ')}`);
    });
}
