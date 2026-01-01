// Vercel Serverless Function Entry Point
const express = require('express');

// Environment variables kontrolü
if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ AI API keys bulunamadı - Environment variables kontrol edin');
}

if (!process.env.DB_HOST) {
    console.warn('⚠️ Database config bulunamadı - Environment variables kontrol edin');
}

let app;

try {
    // Server.js'i require et
    app = require('../backend/server');
    console.log('✅ Server module loaded successfully');
} catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    
    // Minimal fallback app
    app = express();
    app.use(express.json());
    
    // Error endpoint
    app.all('*', (req, res) => {
        res.status(500).json({
            error: 'Server initialization failed',
            message: error.message,
            hint: 'Check Vercel Function Logs and environment variables',
            path: req.path
        });
    });
}

// Vercel serverless function export
module.exports = app;
