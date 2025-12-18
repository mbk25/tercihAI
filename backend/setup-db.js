const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🎓 ==========================================');
console.log('   TERCİH AI - MySQL Kurulum Sihirbazı');
console.log('==========================================\n');

rl.question('MySQL root şifrenizi girin (boş bırakırsanız şifresiz): ', (password) => {
    // .env dosyasını oku
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // DB_PASSWORD satırını güncelle
    envContent = envContent.replace(
        /DB_PASSWORD=.*/,
        `DB_PASSWORD=${password}`
    );
    
    // .env dosyasını kaydet
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ .env dosyası güncellendi!');
    console.log('\n📋 Yapılandırma:');
    console.log('   DB_HOST: localhost');
    console.log('   DB_USER: root');
    console.log(`   DB_PASSWORD: ${password ? '***' : '(boş)'}`);
    console.log('   DB_NAME: tercihAI');
    console.log('   DB_PORT: 3306');
    
    console.log('\n🚀 Şimdi sunucuyu başlatabilirsiniz:');
    console.log('   npm start');
    console.log('\n==========================================\n');
    
    rl.close();
});
