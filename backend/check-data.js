const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tercihai',
        waitForConnections: true,
        connectionLimit: 10
    });
    
    const [rows] = await pool.query(
        "SELECT * FROM universities WHERE department LIKE '%Bilgisayar Programcılığı%' AND city LIKE '%İstanbul%'"
    );
    
    console.log('İstanbulda Bilgisayar Programcılığı:', rows.length);
    rows.forEach(r => console.log(`- ${r.name} (${r.city})`));
    
    const [allRows] = await pool.query(
        "SELECT * FROM universities WHERE department LIKE '%Bilgisayar Programcılığı%'"
    );
    console.log('\nToplam Bilgisayar Programcılığı:', allRows.length);
    
    await pool.end();
}

checkData().catch(console.error);
