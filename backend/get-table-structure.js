const { pool } = require('./db');

async function getTableStructure() {
    try {
        const [columns] = await pool.query('DESCRIBE universities');
        console.log('universities tablosu kolonları:\n');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error.message);
        process.exit(1);
    }
}

getTableStructure();
