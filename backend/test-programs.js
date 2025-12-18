const mysql = require('mysql2/promise');

(async () => {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '12991453B',
        database: 'tercihai'
    });
    
    const [rows] = await pool.query(
        'SELECT name, department, type, ranking FROM universities WHERE city = ? AND department = ? ORDER BY ranking LIMIT 10',
        ['İstanbul', 'Bilgisayar Programcılığı']
    );
    
    console.log('\n📊 İLK 10 BİLGİSAYAR PROGRAMCILIĞI (İSTANBUL):\n');
    rows.forEach((r, i) => console.log(`${i+1}. ${r.name} (${r.type}) - Sıralama: ${r.ranking}`));
    
    // Toplam sayı
    const [count] = await pool.query(
        'SELECT COUNT(*) as total FROM universities WHERE city = ? AND department = ?',
        ['İstanbul', 'Bilgisayar Programcılığı']
    );
    
    console.log(`\n✅ TOPLAM: ${count[0].total} program\n`);
    
    await pool.end();
})();
