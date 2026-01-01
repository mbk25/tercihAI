// Test localStorage'daki key'leri görelim
console.log('=== LocalStorage Keys ===');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('chat') || key.includes('user')) {
        const value = localStorage.getItem(key);
        console.log(key + ':', value ? value.substring(0, 100) + '...' : 'null');
    }
}
