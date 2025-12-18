const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas bağlantısı
const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tercihAI';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB Atlas bağlantısı başarılı');
        return true;
    } catch (error) {
        console.error('❌ MongoDB bağlantı hatası:', error.message);
        console.log('⚠️ Sistem MySQL ile devam edecek');
        return false;
    }
};

// MongoDB Schemas
const UniversitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    department: { type: String, required: true },
    campus: String,
    ranking: Number,
    quota: Number,
    type: { type: String, default: 'Devlet' },
    year: { type: Number, default: 2024 },
    baseScore: Number,
    topScore: Number,
    lastYearRanking: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'universities' });

const UserSchema = new mongoose.Schema({
    googleId: String,
    email: { type: String, required: true, unique: true },
    name: String,
    picture: String,
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const AnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ranking: Number,
    gender: String,
    dreamDept: String,
    city: String,
    currentLocation: String,
    recommendations: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
}, { collection: 'analyses' });

const ChatHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: String,
    message: String,
    role: { type: String, enum: ['user', 'assistant'] },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'chat_history' });

// Models
const University = mongoose.model('University', UniversitySchema);
const User = mongoose.model('User', UserSchema);
const Analysis = mongoose.model('Analysis', AnalysisSchema);
const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);

module.exports = {
    connectMongoDB,
    University,
    User,
    Analysis,
    ChatHistory,
    mongoose
};
