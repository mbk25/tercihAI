const { pool } = require('./db');

async function forceFix() {
    const conn = await pool.getConnection();
    
    // Esenyurt'u bul
    const [before] = await conn.query("SELECT name, type FROM universities WHERE name LIKE '%esenyurt%' LIMIT 3");
    console.log('ÖNCE:', before);
    
    // Güncelle
    await conn.query("UPDATE universities SET type='Vakıf' WHERE name LIKE '%esenyurt%'");
    
    // Kontrol et
    const [after] = await conn.query("SELECT name, type FROM universities WHERE name LIKE '%esenyurt%' LIMIT 3");
    console.log('SONRA:', after);
    
    conn.release();
    process.exit();
}

forceFix();
