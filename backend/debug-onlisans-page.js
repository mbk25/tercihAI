/**
 * YÖK Atlas Önlisans Debug - Sayfayı açıp inceleme
 */

const puppeteer = require('puppeteer');

async function debugOnlisansPage() {
    console.log('🔍 YÖK Atlas Önlisans sayfası açılıyor...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Önlisans ana sayfası
    await page.goto('https://yokatlas.yok.gov.tr/onlisans.php', { 
        waitUntil: 'networkidle2'
    });
    
    console.log('📄 Sayfa yüklendi. Sayfa yapısı kontrol ediliyor...\n');
    
    // Sayfa yapısını incele
    const pageInfo = await page.evaluate(() => {
        const info = {
            title: document.title,
            inputs: [],
            autocompleteIds: [],
            selects: []
        };
        
        // Tüm input elementleri
        document.querySelectorAll('input').forEach((input, i) => {
            info.inputs.push({
                index: i,
                type: input.type,
                id: input.id,
                name: input.name,
                class: input.className,
                placeholder: input.placeholder
            });
        });
        
        // Autocomplete listbox ID'leri
        document.querySelectorAll('[role="listbox"]').forEach((elem, i) => {
            info.autocompleteIds.push({
                index: i,
                id: elem.id,
                class: elem.className
            });
        });
        
        // Select elementleri
        document.querySelectorAll('select').forEach((select, i) => {
            info.selects.push({
                index: i,
                id: select.id,
                name: select.name
            });
        });
        
        return info;
    });
    
    console.log('📊 Sayfa Bilgileri:');
    console.log('Başlık:', pageInfo.title);
    console.log('\n📝 Input Elementleri:', pageInfo.inputs.length);
    pageInfo.inputs.forEach(inp => {
        console.log(`   [${inp.index}] Type: ${inp.type}, ID: ${inp.id || 'YOK'}, Class: ${inp.class || 'YOK'}, Placeholder: ${inp.placeholder || 'YOK'}`);
    });
    
    console.log('\n🔽 Autocomplete Listbox:', pageInfo.autocompleteIds.length);
    pageInfo.autocompleteIds.forEach(ac => {
        console.log(`   [${ac.index}] ID: ${ac.id}, Class: ${ac.class}`);
    });
    
    console.log('\n📋 Select Elementleri:', pageInfo.selects.length);
    pageInfo.selects.forEach(sel => {
        console.log(`   [${sel.index}] ID: ${sel.id || 'YOK'}, Name: ${sel.name || 'YOK'}`);
    });
    
    console.log('\n\n🖱️  Manuel test için sayfa açık kalıyor...');
    console.log('💡 Arama kutusuna "Bilgisayar" yazıp sonuçları inceleyin');
    console.log('📸 Elementleri inspect edip console\'da yazdırın');
    console.log('\n⌨️  Bitirmek için Ctrl+C yapın\n');
    
    // Sayfayı açık tut
    await new Promise(resolve => {
        process.on('SIGINT', async () => {
            console.log('\n\n👋 Tarayıcı kapatılıyor...');
            await browser.close();
            process.exit(0);
        });
    });
}

debugOnlisansPage().catch(error => {
    console.error('❌ Hata:', error);
    process.exit(1);
});
