// Setup Default Admin Account
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const setupAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bloodline-user:bloodline123@ac-4jlltup-shard-00-00.ovwrtg9.mongodb.net/bloodline');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [
                { username: 'admin' },
                { email: 'admin@bloodline.com' }
            ]
        });

        if (existingAdmin) {
            console.log('Admin account already exists:');
            console.log('Username:', existingAdmin.username);
            console.log('Email:', existingAdmin.email);
            console.log('Active:', existingAdmin.isActive);
            return;
        }

        // Create default admin
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const admin = new Admin({
            username: 'admin',
            email: 'admin@bloodline.com',
            password: hashedPassword,
            fullName: 'System Administrator',
            role: 'superadmin',
            isActive: true
        });

        await admin.save();
        
        console.log('Default admin account created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Email: admin@bloodline.com');
        console.log('Role: superadmin');
        
    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

setupAdmin();
