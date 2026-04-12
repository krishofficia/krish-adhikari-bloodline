const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');
const Donor = require('../models/Donor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Send rejection email to organization
const sendRejectionEmail = async (organization, rejectionReason) => {
    try {
        const subject = 'Organization Registration Rejected - Bloodline';
        const body = `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">❌ Organization Registration Rejected</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Bloodline - Blood Donation Management System</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Dear ${organization.name} Team,</h2>
                        
                        <p style="color: #666; line-height: 1.6;">We regret to inform you that your organization registration request has been <strong style="color: #dc3545;">rejected</strong> by our admin team.</p>
                        
                        <div style="background: white; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #dc3545; margin-top: 0;">Reason for Rejection:</h3>
                            <p style="color: #666; margin-bottom: 0;">${rejectionReason}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h4 style="color: #856404; margin-top: 0;">What can you do?</h4>
                            <ul style="color: #666; margin-bottom: 0;">
                                <li>Review rejection reason carefully</li>
                                <li>Address the mentioned issues</li>
                                <li>Contact support if you need clarification</li>
                                <li>Submit a new registration with corrected information</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6;">If you believe this is a mistake or need further assistance, please don't hesitate to contact our support team.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:support@bloodline.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Support</a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 14px; text-align: center; margin-bottom: 0;">
                            This is an automated message from Bloodline Blood Donation Management System.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `;
        
        await emailService.sendEmail(organization.email, subject, body, true);
        console.log('Rejection email sent to organization:', organization.email);
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
};

// Middleware to verify admin token
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Admin token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired admin token' });
    }
};

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find admin by username or email
        const admin = await Admin.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(401).json({ message: 'Admin account is deactivated' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            { adminId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/organizations - Get all organizations
router.get('/organizations', authenticateAdmin, async (req, res) => {
    try {
        const organizations = await Organization.find()
            .select('name email phone address licenseNumber panNumber panCardImage isVerified verificationStatus rejectionReason createdAt')
            .sort({ createdAt: -1 });

        // Handle older organizations without verification fields
        const processedOrgs = organizations.map(org => {
            const orgObj = org.toObject();
            
            // Set default values for older organizations
            if (!orgObj.verificationStatus) {
                orgObj.verificationStatus = 'pending';
                orgObj.isVerified = false;
                orgObj.rejectionReason = null;
            }
            
            return orgObj;
        });

        res.json({
            success: true,
            organizations: processedOrgs
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/organizations/pending - Get pending organizations
router.get('/organizations/pending', authenticateAdmin, async (req, res) => {
    try {
        const organizations = await Organization.find({ verificationStatus: 'pending' })
            .select('name email phone address licenseNumber panNumber panCardImage createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            organizations
        });
    } catch (error) {
        console.error('Error fetching pending organizations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/admin/organizations/:id - Update organization
router.put('/organizations/:id', authenticateAdmin, async (req, res) => {
    try {
        const { name, email, phone, licenseNumber, panNumber, verificationStatus } = req.body;
        
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Update organization fields
        if (name) organization.name = name;
        if (email) organization.email = email;
        if (phone) organization.phone = phone;
        if (licenseNumber) organization.licenseNumber = licenseNumber;
        if (panNumber) organization.panNumber = panNumber;
        if (verificationStatus) {
            organization.verificationStatus = verificationStatus;
            organization.isVerified = verificationStatus === 'approved';
        }

        await organization.save();

        res.json({
            success: true,
            message: 'Organization updated successfully',
            organization
        });
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/admin/organizations/:id/approve - Approve organization
router.post('/organizations/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        organization.isVerified = true;
        organization.verificationStatus = 'approved';
        organization.rejectionReason = null;
        await organization.save();

        res.json({
            success: true,
            message: 'Organization approved successfully',
            organization
        });
    } catch (error) {
        console.error('Error approving organization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/admin/organizations/:id/reject - Reject organization
router.post('/organizations/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        
        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Update organization status
        organization.isVerified = false;
        organization.verificationStatus = 'rejected';
        organization.rejectionReason = rejectionReason;
        await organization.save();

        // Send rejection email
        await sendRejectionEmail(organization, rejectionReason);

        res.json({
            success: true,
            message: 'Organization rejected successfully and notification sent',
            organization
        });
    } catch (error) {
        console.error('Error rejecting organization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/admin/organizations/:id - Delete organization
router.delete('/organizations/:id', authenticateAdmin, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        await Organization.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Organization deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/donors - Get all donors
router.get('/donors', authenticateAdmin, async (req, res) => {
    try {
        const donors = await Donor.find()
            .select('fullName email phone bloodGroup location availability isVerified createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            donors
        });
    } catch (error) {
        console.error('Error fetching donors:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/admin/donors/:id - Update donor
router.put('/donors/:id', authenticateAdmin, async (req, res) => {
    try {
        const { fullName, email, phone, bloodGroup, location, availability } = req.body;
        
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        // Update donor fields
        if (fullName) donor.fullName = fullName;
        if (email) donor.email = email;
        if (phone) donor.phone = phone;
        if (bloodGroup) donor.bloodGroup = bloodGroup;
        if (location) donor.location = location;
        if (availability) donor.availability = availability;

        await donor.save();

        res.json({
            success: true,
            message: 'Donor updated successfully',
            donor
        });
    } catch (error) {
        console.error('Error updating donor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/admin/donors/:id - Delete donor
router.delete('/donors/:id', authenticateAdmin, async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        await Donor.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Donor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
