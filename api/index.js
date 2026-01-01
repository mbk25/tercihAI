// Vercel Serverless Function Entry Point
// Environment variables kontrolü
if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ AI API keys bulunamadı - Environment variables kontrol edin');
}

if (!process.env.DB_HOST) {
    console.warn('⚠️ Database config bulunamadı - Environment variables kontrol edin');
}

try {
    const app = require('../backend/server');
    module.exports = app;
} catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    
    // Minimal error handler
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Server initialization failed',
            message: error.message,
            hint: 'Check Vercel logs and environment variables'
        });
    };
}
