const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// POST /api/setup/admin - Create default admin (only if no admins exist)
router.post('/admin', async (req, res) => {
    try {
        // Check if any admin exists
        const existingAdmins = await Admin.countDocuments();
        
        if (existingAdmins > 0) {
            return res.status(403).json({
                message: 'Admin setup already completed. Admin accounts exist.',
                count: existingAdmins
            });
        }

        // Create default admin
        const { username, email, password, fullName } = req.body;
        
        // Use defaults if not provided
        const adminData = {
            username: username || 'admin',
            email: email || 'admin@bloodline.com',
            password: password || 'admin123',
            fullName: fullName || 'System Administrator',
            role: 'superadmin',
            isActive: true
        };

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 12);
        adminData.password = hashedPassword;

        const admin = new Admin(adminData);
        await admin.save();

        console.log('Default admin created:', {
            username: admin.username,
            email: admin.email,
            role: admin.role
        });

        res.json({
            success: true,
            message: 'Default admin account created successfully',
            admin: {
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role
            },
            loginCredentials: {
                username: adminData.username,
                password: password || 'admin123'
            }
        });

    } catch (error) {
        console.error('Admin setup error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Admin with this username or email already exists'
            });
        }
        
        res.status(500).json({
            message: 'Failed to create admin account',
            error: error.message
        });
    }
});

// GET /api/setup/status - Check admin setup status
router.get('/status', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        const admins = await Admin.find().select('username email fullName role isActive createdAt');
        
        res.json({
            hasAdmins: adminCount > 0,
            adminCount,
            admins: admins.map(admin => ({
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
                isActive: admin.isActive,
                createdAt: admin.createdAt
            }))
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            message: 'Failed to check admin status',
            error: error.message
        });
    }
});

module.exports = router;
