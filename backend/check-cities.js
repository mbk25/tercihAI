const mysql = require('mysql2/promise');

(async () => {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '12991453B',
        database: 'tercihai'
    });
    
    const [rows] = await pool.query(
        "SELECT city, COUNT(*) as cnt FROM universities WHERE department = 'Bilgisayar Programcılığı' GROUP BY city ORDER BY cnt DESC LIMIT 10"
    );
    
    console.log('\n📍 Bilgisayar Programcılığı şehir dağılımı:\n');
    rows.forEach(r => console.log(`   ${r.city || '(null)'}: ${r.cnt} kayıt`));
    
    // İstanbul'u içeren kayıtları kontrol et
    const [istanbul] = await pool.query(
        "SELECT name, city FROM universities WHERE department = 'Bilgisayar Programcılığı' AND city LIKE '%İstanbul%' LIMIT 5"
    );
    
    console.log(`\n📊 İstanbul kayıtları: ${istanbul.length}`);
    istanbul.forEach(r => console.log(`   - ${r.name} | ${r.city}`));
    
    await pool.end();
})();
