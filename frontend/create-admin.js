/**
 * Create Default Admin Account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createDefaultAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/bloodline');
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [
                { username: 'admin' },
                { email: 'admin@bloodline.com' }
            ]
        });
        
        if (existingAdmin) {
            console.log('Admin account already exists');
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
        console.log('✅ Default admin account created successfully!');
        console.log('📝 Login Credentials:');
        console.log('   Username: admin');
        console.log('   Email: admin@bloodline.com');
        console.log('   Password: admin123');
        console.log('⚠️  Please change the password after first login!');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createDefaultAdmin();
