const { pool } = require('./db');

(async () => {
    const conn = await pool.getConnection();
    const [unis] = await conn.query(`SELECT name, city, department, ranking FROM universities WHERE department LIKE '%Bilgisayar%' ORDER BY ranking DESC LIMIT 10`);
    console.log('=== En Kolay Bilgisayar Bölümleri (En Yüksek Sıralama) ===\n');
    unis.forEach(u => {
        console.log(`${u.name} - ${u.city}`);
        console.log(`  Bölüm: ${u.department}`);
        console.log(`  Sıralama: ${u.ranking?.toLocaleString('tr-TR') || 'N/A'}\n`);
    });
    conn.release();
    await pool.end();
})();
