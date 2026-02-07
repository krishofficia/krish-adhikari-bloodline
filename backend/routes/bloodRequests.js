const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Organization = require('../models/Organization');
const Donor = require('../models/Donor');
const jwt = require('jsonwebtoken');
const { sendNotification, generateBloodRequestEmail } = require('../utils/mailService');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.organizationId = decoded.organizationId;
        next();
    });
};

// Validation middleware
const validateBloodRequest = (req, res, next) => {
    const { bloodGroup, quantity, hospitalName, location, urgencyLevel, requiredDate } = req.body;
    
    const errors = [];
    
    if (!bloodGroup || !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
        errors.push('Valid blood group is required');
    }
    
    if (!quantity || quantity < 1 || !Number.isInteger(Number(quantity))) {
        errors.push('Valid quantity (minimum 1 unit) is required');
    }
    
    if (!hospitalName || hospitalName.trim().length < 2) {
        errors.push('Hospital name is required');
    }
    
    if (!location || location.trim().length < 2) {
        errors.push('Location is required');
    }
    
    if (!urgencyLevel || !['Low', 'Medium', 'High'].includes(urgencyLevel)) {
        errors.push('Valid urgency level is required');
    }
    
    if (!requiredDate || new Date(requiredDate) <= new Date()) {
        errors.push('Required date must be in the future');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    next();
};

// POST /api/blood-requests - Create a new blood request
router.post('/', authenticateToken, validateBloodRequest, async (req, res) => {
    try {
        const { bloodGroup, quantity, hospitalName, location, urgencyLevel, requiredDate } = req.body;
        
        // Verify organization exists
        const organization = await Organization.findById(req.organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        
        const bloodRequest = new BloodRequest({
            organizationId: req.organizationId,
            organizationName: organization.name,
            bloodGroup,
            quantity,
            hospitalName,
            location,
            urgencyLevel,
            requiredDate: new Date(requiredDate)
        });
        
        await bloodRequest.save();
        
        // Find matching donors and send email notifications
        const matchingDonors = await Donor.find({
            bloodGroup: bloodGroup,
            location: location,
            availability: 'available'
        });

        console.log(`Found ${matchingDonors.length} matching donors for blood group ${bloodGroup} in ${location}`);

        // Send email notifications to matching donors
        let emailSentCount = 0;
        const emailPromises = matchingDonors.map(async (donor) => {
            try {
                const emailContent = generateBloodRequestEmail(bloodRequest, organization);
                const result = await sendNotification({
                    to: donor.email,
                    subject: `🩸 Urgent Blood Request - ${bloodGroup} Needed in ${location}`,
                    html: emailContent
                });
                
                if (result.success) {
                    emailSentCount++;
                    console.log(`✅ Email sent to donor: ${donor.email}`);
                } else {
                    console.error(`❌ Failed to send email to donor: ${donor.email}`, result.error);
                }
            } catch (error) {
                console.error(`❌ Error processing email for donor: ${donor.email}`, error);
            }
        });

        // Wait for all emails to be sent (don't block request creation)
        Promise.allSettled(emailPromises).then(() => {
            console.log(`Email notification process completed: ${emailSentCount}/${matchingDonors.length} emails sent`);
        });
        
        res.status(201).json({
            message: 'Blood request created successfully',
            bloodRequest,
            notificationStats: {
                matchingDonors: matchingDonors.length,
                emailsSent: emailSentCount
            }
        });
    } catch (error) {
        console.error('Error creating blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/blood-requests/org/:orgId - Get all blood requests for an organization
router.get('/org/:orgId', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params;
        
        // Ensure the requesting organization can only view their own requests
        if (orgId !== req.organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const bloodRequests = await BloodRequest.find({ organizationId: orgId })
            .sort({ createdAt: -1 });
        
        res.json({
            message: 'Blood requests retrieved successfully',
            bloodRequests
        });
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/blood-requests/:id - Update a blood request
router.put('/:id', authenticateToken, validateBloodRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const { bloodGroup, quantity, hospitalName, location, urgencyLevel, requiredDate } = req.body;
        
        // Find the blood request and ensure it belongs to the requesting organization
        const bloodRequest = await BloodRequest.findById(id);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }
        
        if (bloodRequest.organizationId.toString() !== req.organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Update the blood request
        bloodRequest.bloodGroup = bloodGroup;
        bloodRequest.quantity = quantity;
        bloodRequest.hospitalName = hospitalName;
        bloodRequest.location = location;
        bloodRequest.urgencyLevel = urgencyLevel;
        bloodRequest.requiredDate = new Date(requiredDate);
        
        await bloodRequest.save();
        
        res.json({
            message: 'Blood request updated successfully',
            bloodRequest
        });
    } catch (error) {
        console.error('Error updating blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/blood-requests/:id - Delete a blood request
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the blood request and ensure it belongs to the requesting organization
        const bloodRequest = await BloodRequest.findById(id);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }
        
        if (bloodRequest.organizationId.toString() !== req.organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        await BloodRequest.findByIdAndDelete(id);
        
        res.json({
            message: 'Blood request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/donor/requests - Get blood requests for logged-in donor
router.get('/donor/requests', async (req, res) => {
    try {
        // Get donor info from token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Decode token to get donor ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        
        // Get donor details
        const donor = await Donor.findById(decoded.donorId);
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        // Find matching blood requests
        const matchingRequests = await BloodRequest.find({
            bloodGroup: donor.bloodGroup,
            location: donor.location,
            status: { $in: ['active', 'urgent'] }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: matchingRequests,
            donorInfo: {
                bloodGroup: donor.bloodGroup,
                location: donor.location
            }
        });

    } catch (error) {
        console.error('Error fetching donor requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching requests'
        });
    }
});

module.exports = router;
