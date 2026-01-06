const { pool } = require('./db');

(async () => {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT DISTINCT universityName, programName, conditionNumber FROM program_conditions WHERE universityName LIKE '%Bezmialem%' ORDER BY conditionNumber`);
    console.log('Bezmialem şartları database de:', rows.length);
    rows.forEach(r => {
        console.log(`${r.universityName} - ${r.programName} -> Madde ${r.conditionNumber}`);
    });
    conn.release();
    await pool.end();
})();
