const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use MONGODB_URI environment variable
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodline';
        
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️  MONGODB_URI not set, using fallback (please set in production)');
        }
        
        console.log(`🔗 Connecting to MongoDB...`);
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.error('💡 Please check your MONGODB_URI environment variable');
        process.exit(1);
    }
};

module.exports = connectDB;
