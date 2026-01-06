const {pool} = require('./db');

async function checkBezmilaemConditions() {
    const [rows] = await pool.query(
        `SELECT universityName, programName, conditionNumber 
         FROM program_conditions 
         WHERE universityName LIKE '%Bezmialem%' OR universityName LIKE '%BEZMIALEM%'`
    );
    
    console.log('Bezmialem kayıt sayısı:', rows.length);
    if(rows.length > 0) {
        rows.forEach(r => console.log(`  ${r.universityName} - ${r.programName} - Madde ${r.conditionNumber}`));
    } else {
        console.log('❌ Bezmialem MySQL\'de YOK!');
        
        // En çok kayıt olan üniversiteleri göster
        const [top] = await pool.query(
            `SELECT universityName, COUNT(*) as count 
             FROM program_conditions 
             GROUP BY universityName 
             ORDER BY count DESC 
             LIMIT 10`
        );
        console.log('\nMySQL\'de en çok kayıt olan üniversiteler:');
        top.forEach(t => console.log(`  ${t.universityName}: ${t.count} kayıt`));
    }
    
    process.exit(0);
}

checkBezmilaemConditions();
