const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Select MongoDB URI based on environment
        const mongoUri = process.env.NODE_ENV === 'production' 
            ? process.env.MONGODB_URI_PROD 
            : process.env.MONGODB_URI_DEV || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodline';
            
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
