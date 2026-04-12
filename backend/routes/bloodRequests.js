const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Organization = require('../models/Organization');
const Donor = require('../models/Donor');
const Donation = require('../models/Donation');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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
            requiredDate: new Date(requiredDate),
            status: 'Approved' // Set to Approved so donors can see it
        });
        
        await bloodRequest.save();
        
        console.log('Blood request created with status:', bloodRequest.status);
        console.log('Blood request details:', {
            id: bloodRequest._id,
            bloodGroup: bloodRequest.bloodGroup,
            location: bloodRequest.location,
            status: bloodRequest.status
        });
        
        // Find matching donors and send email notifications
        console.log(`Searching for donors with: bloodGroup=${bloodGroup}, location=${location}, availability=available`);
        
        const matchingDonors = await Donor.find({
            bloodGroup: bloodGroup,
            location: location,
            availability: 'available'
        });

        console.log(`Found ${matchingDonors.length} matching donors for blood group ${bloodGroup} in ${location}`);
        
        // Debug: Log all donors in database
        const allDonors = await Donor.find({});
        console.log(`Total donors in database: ${allDonors.length}`);
        allDonors.forEach(donor => {
            console.log(`Donor: ${donor.email}, BloodGroup: ${donor.bloodGroup}, Location: ${donor.location}, Availability: ${donor.availability}`);
        });

        // Send email notifications to matching donors
        let emailSentCount = 0;
        for (const donor of matchingDonors) {
            try {
                const emailHtml = generateBloodRequestEmail(donor, bloodRequest, organization);
                await sendNotification({
                    to: donor.email,
                    subject: `Urgent Blood Request - ${bloodRequest.bloodGroup} Needed at ${bloodRequest.location}`,
                    html: emailHtml
                });
                emailSentCount++;
            } catch (emailError) {
                console.error(`Failed to send email to ${donor.email}:`, emailError);
            }
        }

        // Wait for all emails to be sent (don't block request creation)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Email notification process completed: ${emailSentCount}/${matchingDonors.length} emails sent`);
        
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

// GET /api/blood-requests - Get all blood requests for the logged-in organization
router.get('/', authenticateToken, async (req, res) => {
    try {
        const organizationId = req.organizationId;
        
        // Find all blood requests for this organization
        const bloodRequests = await BloodRequest.find({ organizationId })
            .sort({ createdAt: -1 });

        console.log(`Found ${bloodRequests.length} blood requests for organization ${organizationId}`);

        res.json({
            success: true,
            data: bloodRequests
        });
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching requests'
        });
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
        
        // Check if quantity, required date, location, or hospital name has changed
        const quantityChanged = bloodRequest.quantity !== quantity;
        const dateChanged = bloodRequest.requiredDate.toISOString() !== new Date(requiredDate).toISOString();
        const locationChanged = bloodRequest.location !== location;
        const hospitalChanged = bloodRequest.hospitalName !== hospitalName;
        
        // Store old values for email notification
        const oldQuantity = bloodRequest.quantity;
        const oldDate = bloodRequest.requiredDate;
        const oldLocation = bloodRequest.location;
        const oldHospitalName = bloodRequest.hospitalName;
        
        console.log('🔍 Blood Request Update Debug:');
        console.log('- Request ID:', id);
        console.log('- Quantity Changed:', quantityChanged, `(old: ${oldQuantity}, new: ${quantity})`);
        console.log('- Date Changed:', dateChanged, `(old: ${oldDate}, new: ${new Date(requiredDate)})`);
        console.log('- Location Changed:', locationChanged, `(old: ${oldLocation}, new: ${location})`);
        console.log('- Hospital Changed:', hospitalChanged, `(old: ${oldHospitalName}, new: ${hospitalName})`);
        console.log('- Donor Responses:', bloodRequest.donorResponses ? bloodRequest.donorResponses.length : 0);
        
        // Update the blood request
        bloodRequest.bloodGroup = bloodGroup;
        bloodRequest.quantity = quantity;
        bloodRequest.hospitalName = hospitalName;
        bloodRequest.location = location;
        bloodRequest.urgencyLevel = urgencyLevel;
        bloodRequest.requiredDate = new Date(requiredDate);
        
        await bloodRequest.save();
        
        // Send email notifications if quantity, date, location, or hospital changed
        if (quantityChanged || dateChanged || locationChanged || hospitalChanged) {
            console.log('🔍 Email notification condition triggered - quantity, date, location, or hospital changed');
            try {
                // Get organization details
                const Organization = require('../models/Organization');
                const organization = await Organization.findById(bloodRequest.organizationId);
                
                // Find donors who have responded to this request
                const donorsToNotify = [];
                
                // Check donor responses
                if (bloodRequest.donorResponses && bloodRequest.donorResponses.length > 0) {
                    console.log('🔍 Checking donor responses...');
                    const Donor = require('../models/Donor');
                    
                    for (const response of bloodRequest.donorResponses) {
                        console.log(`🔍 Donor Response - Status: ${response.status}, Donor ID: ${response.donorId}`);
                        if (response.status === 'Accepted') {
                            const donor = await Donor.findById(response.donorId);
                            console.log(`🔍 Found donor:`, donor ? { name: donor.fullName, email: donor.email } : 'Not found');
                            if (donor && donor.email) {
                                donorsToNotify.push(donor);
                                console.log(`✅ Added donor to notification list: ${donor.fullName} (${donor.email})`);
                            } else {
                                console.log(`❌ Donor not found or no email for ID: ${response.donorId}`);
                            }
                        } else {
                            console.log(`🔍 Skipping donor - status not 'Accepted': ${response.status}`);
                        }
                    }
                } else {
                    console.log('🔍 No donor responses found on this request');
                }
                
                console.log(`🔍 Total donors to notify: ${donorsToNotify.length}`);
                
                // Send notifications to all accepted donors
                
                for (const donor of donorsToNotify) {
                    let emailSubject = 'Blood Request Updated - Bloodline';
                    let emailContent = '';
                    
                    // Handle multiple change combinations
                    if (quantityChanged && dateChanged && locationChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Quantity, Date, Location & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && dateChanged && locationChanged) {
                        emailSubject = 'Blood Request Quantity, Date & Location Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && dateChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Quantity, Date & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && locationChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Quantity, Location & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (dateChanged && locationChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Date, Location & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && dateChanged) {
                        emailSubject = 'Blood Request Quantity & Date Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && locationChanged) {
                        emailSubject = 'Blood Request Quantity & Location Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (dateChanged && locationChanged) {
                        emailSubject = 'Blood Request Date & Location Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged) {
                        emailSubject = 'Blood Request Quantity Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Quantity Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Quantity:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of this change and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (dateChanged) {
                        emailSubject = 'Blood Request Date Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Date Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Required Date:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of this change and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (locationChanged) {
                        emailSubject = 'Blood Request Location Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Location Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Location:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of this change and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (quantityChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Quantity & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> <span style="text-decoration: line-through; color: #999;">${oldQuantity} units</span> → <strong style="color: #d32f2f;">${quantity} units</strong></p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (dateChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Date & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> <span style="text-decoration: line-through; color: #999;">${oldDate.toLocaleDateString()}</span> → <strong style="color: #d32f2f;">${new Date(requiredDate).toLocaleDateString()}</strong></p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (locationChanged && hospitalChanged) {
                        emailSubject = 'Blood Request Location & Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Details:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Location:</strong> <span style="text-decoration: line-through; color: #999;">${oldLocation}</span> → <strong style="color: #d32f2f;">${location}</strong></p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of these changes and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    } else if (hospitalChanged) {
                        emailSubject = 'Blood Request Hospital Updated - Bloodline';
                        emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">🩸 Blood Request Hospital Updated</h2>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h3>Hello ${donor.fullName},</h3>
                                    <p>A blood request you accepted has been updated by <strong>${organization.name}</strong>.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                        <h4 style="color: #d32f2f; margin-top: 0;">Updated Hospital:</h4>
                                        <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                                        <p><strong>Quantity:</strong> ${quantity} units</p>
                                        <p><strong>Required Date:</strong> ${new Date(requiredDate).toLocaleDateString()}</p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Hospital:</strong> <span style="text-decoration: line-through; color: #999;">${oldHospitalName}</span> → <strong style="color: #d32f2f;">${hospitalName}</strong></p>
                                        <p><strong>Urgency:</strong> ${urgencyLevel}</p>
                                    </div>
                                    
                                    <p style="color: #666;">Please take note of this change and plan your donation accordingly.</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                            View Request Details
                                        </a>
                                    </div>
                                </div>
                                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                                    <p style="margin: 0;">© 2024 Bloodline. Connecting Lives Through Blood Donation</p>
                                </div>
                            </div>
                        `;
                    }
                    
                    const emailResult = await sendNotification({
                        to: donor.email,
                        subject: emailSubject,
                        html: emailContent
                    });
                    
                    console.log(`🔍 Email sending result for ${donor.email}:`, emailResult);
                    
                    if (emailResult.success) {
                        console.log(`✅ Update notification sent to donor: ${donor.email}`);
                    } else {
                        console.error(`❌ Failed to send update notification to donor: ${donor.email}`, emailResult.error);
                    }
                }
                
                console.log(`📧 Sent ${donorsToNotify.length} update notifications for blood request ${id}`);
                
            } catch (emailError) {
                console.error('Error sending update notifications:', emailError);
                // Continue with the response even if email fails
            }
        } else {
            console.log('🔍 Email notification condition NOT triggered - no quantity, date, location, or hospital changes detected');
        }
        
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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
            status: { $in: ['Pending', 'Approved'] }
        }).sort({ createdAt: -1 });

        // Filter out requests that donor has already responded to
        const availableRequests = matchingRequests.filter(request => {
            const hasResponded = request.donorResponses.some(
                response => response.donorId.toString() === donor._id.toString()
            );
            return !hasResponded;
        });

        console.log(`Found ${matchingRequests.length} total matching requests for donor ${donor._id}`);
        console.log(`Available requests after filtering: ${availableRequests.length}`);
        console.log(`Donor bloodGroup: ${donor.bloodGroup}, location: ${donor.location}`);

        res.status(200).json({
            success: true,
            data: availableRequests,
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

// GET /api/blood-requests/donor/:requestId - Get blood request details for donor response
router.get('/donor/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find blood request
        const bloodRequest = await BloodRequest.findById(requestId).populate('organizationId', 'name email phone');
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        res.json({
            success: true,
            data: bloodRequest
        });
    } catch (error) {
        console.error('Error fetching blood request for donor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/blood-requests/donor/:requestId/accept - Donor accepts blood request
router.post('/donor/:requestId/accept', async (req, res) => {
    try {
        console.log('Accept endpoint called for requestId:', req.params.requestId);
        console.log('Request body:', req.body);
        
        const { requestId } = req.params;
        const { donorId, donorName, donorEmail, donorPhone } = req.body;
        
        // Find blood request
        const bloodRequest = await BloodRequest.findById(requestId);
        if (!bloodRequest) {
            console.log('Blood request not found:', requestId);
            return res.status(404).json({ message: 'Blood request not found' });
        }

        console.log('Blood request found:', bloodRequest._id);

        // Check if donor has already responded
        const existingResponse = bloodRequest.donorResponses.find(
            response => response.donorId.toString() === donorId.toString()
        );

        if (existingResponse) {
            console.log('Donor has already responded:', donorId);
            return res.status(400).json({ message: 'You have already responded to this request' });
        }

        // Add donor response
        bloodRequest.donorResponses.push({
            donorId,
            donorName,
            donorEmail,
            donorPhone,
            responseDate: new Date(),
            status: 'Accepted'
        });

        await bloodRequest.save();
        console.log('Donor response saved successfully');

        res.json({
            success: true,
            message: 'Blood request accepted successfully!',
            bloodRequest
        });
    } catch (error) {
        console.error('Error accepting blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/blood-requests/donor/:requestId/decline - Donor declines blood request
router.post('/donor/:requestId/decline', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { donorId, donorName, donorEmail, donorPhone } = req.body;
        
        // Find blood request
        const bloodRequest = await BloodRequest.findById(requestId);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        // Check if donor has already responded
        const existingResponse = bloodRequest.donorResponses.find(
            response => response.donorId.toString() === donorId.toString()
        );

        if (existingResponse) {
            return res.status(400).json({ message: 'You have already responded to this request' });
        }

        // Add donor response
        bloodRequest.donorResponses.push({
            donorId,
            donorName,
            donorEmail,
            donorPhone: donorPhone || '', // Use donorPhone from request body
            responseDate: new Date(),
            status: 'Rejected'
        });

        await bloodRequest.save();

        // Send confirmation email to donor (non-blocking)
        try {
            await sendNotification({
                to: donorEmail,
                subject: 'Blood Request Declined - Bloodline',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">📝 Response Recorded</h1>
                            <p style="font-size: 18px; margin: 20px 0;">Your response has been recorded.</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #ff9800; margin-top: 0;">Response Details</h2>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                <p><strong>Request ID:</strong> ${requestId}</p>
                                <p><strong>Your Response:</strong> Declined</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666; font-size: 16px;">
                                    Thank you for considering this donation request. We understand that circumstances may prevent you from donating at this time.
                                </p>
                                <p style="color: #4caf50; font-weight: bold;">
                                    Please keep your availability updated for future requests!
                                </p>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f8f8; border-radius: 10px;">
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                We appreciate your commitment to saving lives! 🩸
                            </p>
                        </div>
                    </div>
                `
            });
            console.log('Decline confirmation email sent to donor');
        } catch (emailError) {
            console.error('Failed to send decline confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Response recorded successfully!',
            bloodRequest
        });
    } catch (error) {
        console.error('Error declining blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/blood-requests/:requestId/donation-complete - Mark donation as complete
router.post('/:requestId/donation-complete', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { donorId } = req.body;
        
        console.log('Donation complete called for requestId:', requestId);
        console.log('Donor ID:', donorId);
        
        // Find blood request
        const bloodRequest = await BloodRequest.findById(requestId);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        // Check if organization owns this request
        if (bloodRequest.organizationId.toString() !== req.organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find the donor response and update status
        const donorResponse = bloodRequest.donorResponses.find(
            response => response.donorId.toString() === donorId.toString()
        );

        if (!donorResponse) {
            return res.status(404).json({ message: 'Donor response not found' });
        }

        if (donorResponse.status === 'Completed') {
            return res.status(400).json({ message: 'Donation already marked as completed' });
        }

        // Update donor response status
        donorResponse.status = 'Completed';
        donorResponse.completionDate = new Date();

        await bloodRequest.save();
        console.log('Donation marked as complete');

        // Create donation record in the new Donation model
        try {
            const Donation = require('../models/Donation');
            const donationRecord = {
                donorId: donorId,
                donorName: donorResponse.donorName,
                donorEmail: donorResponse.donorEmail,
                donorPhone: donorResponse.donorPhone,
                organizationId: bloodRequest.organizationId,
                organizationName: bloodRequest.organizationName?.name || bloodRequest.hospitalName,
                bloodGroup: bloodRequest.bloodGroup,
                location: bloodRequest.location,
                units: bloodRequest.quantity,
                donationDate: donorResponse.responseDate,
                completionDate: donorResponse.completionDate || new Date(),
                status: 'Completed',
                originalRequestId: bloodRequest._id
            };
            
            await Donation.create(donationRecord);
            console.log('Created donation record for completed donation');
        } catch (donationError) {
            console.error('Error creating donation record:', donationError);
            // Continue with donor update even if donation record creation fails
        }

        // Update donor's donation count and badge
        try {
            const donor = await Donor.findById(donorId);
            if (donor) {
                donor.donationCount += 1;
                donor.badge = donor.calculateBadge();
                await donor.save();
                console.log(`Updated donor ${donor.fullName}: donationCount = ${donor.donationCount}, badge = ${donor.badge}`);
            }
        } catch (donorError) {
            console.error('Error updating donor donation count:', donorError);
            // Continue with email sending even if donor update fails
        }

        // Send thank you email to donor
        try {
            await sendNotification({
                to: donorResponse.donorEmail,
                subject: 'Thank You for Your Blood Donation! 🩸',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">🎉 Thank You, Hero!</h1>
                            <p style="font-size: 18px; margin: 20px 0;">Your blood donation has been completed successfully!</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #e74c3c; margin-top: 0;">Donation Details</h2>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                <p><strong>Blood Group:</strong> ${bloodRequest.bloodGroup}</p>
                                <p><strong>Hospital:</strong> ${bloodRequest.hospitalName}</p>
                                <p><strong>Location:</strong> ${bloodRequest.location}</p>
                                <p><strong>Donation Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666; font-size: 16px;">
                                    Your generous donation has the potential to save up to 3 lives!
                                </p>
                                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="color: #2e7d32; font-weight: bold; margin: 0;">
                                        💝 You've made a life-saving difference!
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f8f8; border-radius: 10px;">
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                From all of us at Bloodline and the patients you've helped - thank you! ❤️
                            </p>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                                Consider donating again in 3 months to continue saving lives!
                            </p>
                        </div>
                    </div>
                `
            });
            console.log('Thank you email sent to donor');
        } catch (emailError) {
            console.error('Failed to send thank you email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Donation marked as complete and thank you email sent!',
            bloodRequest
        });
    } catch (error) {
        console.error('Error marking donation complete:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/blood-requests/available-donors - Get all available donors
router.get('/available-donors', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching available donors...');
        
        // First, check all donors in database
        const allDonors = await Donor.find({});
        console.log(`Total donors in database: ${allDonors.length}`);
        
        allDonors.forEach(donor => {
            console.log(`Donor: ${donor.fullName}, Availability: ${donor.availability}, Verified: ${donor.isVerified}`);
        });
        
        // Find all donors with availability = 'available'
        const availableDonors = await Donor.find({ 
            availability: 'available'
            // Remove isVerified filter to show all available donors
        })
        .select('fullName email phone bloodGroup location availability')
        .sort({ createdAt: -1 });

        console.log(`Found ${availableDonors.length} available donors`);

        // Get last donation date for each donor
        const transformedDonors = await Promise.all(
            availableDonors.map(async (donor) => {
                // Find the most recent completed donation for this donor
                const lastDonation = await Donation.findOne({ 
                    donorId: donor._id,
                    status: 'Completed'
                })
                .sort({ donationDate: -1 })
                .select('donationDate');

                // Format the last donation date
                let lastDonationText = 'No donations yet';
                if (lastDonation && lastDonation.donationDate) {
                    const donationDate = new Date(lastDonation.donationDate);
                    const now = new Date();
                    const diffTime = Math.abs(now - donationDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) {
                        lastDonationText = 'Today';
                    } else if (diffDays === 1) {
                        lastDonationText = 'Yesterday';
                    } else if (diffDays < 7) {
                        lastDonationText = `${diffDays} days ago`;
                    } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7);
                        lastDonationText = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                    } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        lastDonationText = `${months} month${months > 1 ? 's' : ''} ago`;
                    } else {
                        const years = Math.floor(diffDays / 365);
                        lastDonationText = `${years} year${years > 1 ? 's' : ''} ago`;
                    }
                }

                return {
                    _id: donor._id,
                    name: donor.fullName,
                    email: donor.email,
                    phone: donor.phone,
                    bloodGroup: donor.bloodGroup,
                    location: donor.location,
                    available: donor.availability === 'available',
                    lastDonation: lastDonationText
                };
            })
        );

        console.log('Transformed donors with last donation info:', transformedDonors);

        res.json({
            success: true,
            data: transformedDonors
        });
    } catch (error) {
        console.error('Error fetching available donors:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/blood-requests/:id/respond - Donor responds to blood request
router.post('/:id/respond', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const donorId = req.donorId;

        // Find the blood request
        const bloodRequest = await BloodRequest.findById(requestId);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        // Check if donor has already responded
        const existingResponse = bloodRequest.donorResponses.find(
            response => response.donorId.toString() === donorId.toString()
        );

        if (existingResponse) {
            return res.status(400).json({ message: 'You have already responded to this request' });
        }

        // Get donor details
        const donor = await Donor.findById(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        // Add donor response
        bloodRequest.donorResponses.push({
            donorId: donor._id,
            donorName: donor.fullName,
            donorEmail: donor.email,
            donorPhone: donor.phone,
            responseDate: new Date(),
            status: 'Accepted'
        });

        await bloodRequest.save();

        res.json({
            success: true,
            message: 'Response submitted successfully',
            bloodRequest
        });
    } catch (error) {
        console.error('Error submitting donor response:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/blood-requests/:id - Delete blood request
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const organizationId = req.organizationId;

        // Find the blood request
        const bloodRequest = await BloodRequest.findById(requestId);
        if (!bloodRequest) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        // Check if the request belongs to the organization
        if (bloodRequest.organizationId.toString() !== organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create donation records for completed donations before deleting the request
        const Donation = require('../models/Donation');
        const completedResponses = bloodRequest.donorResponses.filter(response => response.status === 'Completed');
        
        if (completedResponses.length > 0) {
            const donationRecords = completedResponses.map(response => ({
                donorId: response.donorId,
                donorName: response.donorName,
                donorEmail: response.donorEmail,
                donorPhone: response.donorPhone,
                organizationId: bloodRequest.organizationId,
                organizationName: bloodRequest.organizationName?.name || bloodRequest.hospitalName,
                bloodGroup: bloodRequest.bloodGroup,
                location: bloodRequest.location,
                units: bloodRequest.quantity,
                donationDate: response.responseDate,
                completionDate: response.completionDate || new Date(),
                status: 'Completed',
                originalRequestId: bloodRequest._id
            }));
            
            await Donation.insertMany(donationRecords);
            console.log(`Created ${donationRecords.length} donation records before deleting blood request`);
        }

        await BloodRequest.findByIdAndDelete(requestId);

        res.json({
            success: true,
            message: 'Blood request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blood request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/blood-requests/donors/ranking - Get donor ranking leaderboard
router.get('/donors/ranking', async (req, res) => {
    try {
        console.log('Fetching donor ranking leaderboard...');
        
        // First, check if any donors exist
        const totalDonors = await Donor.countDocuments();
        const verifiedDonors = await Donor.countDocuments({ isVerified: true });
        console.log(`Total donors: ${totalDonors}, Verified donors: ${verifiedDonors}`);
        
        // Get ALL donors sorted by donationCount in descending order (not just verified)
        const donors = await Donor.find({})
            .select('fullName bloodGroup donationCount badge isVerified')
            .sort({ donationCount: -1 })
            .limit(50); // Limit to top 50 donors
        
        console.log(`Found ${donors.length} donors for ranking`);
        console.log('Donors:', donors.map(d => ({ 
            name: d.fullName, 
            count: d.donationCount, 
            badge: d.badge,
            verified: d.isVerified 
        })));
        
        // Add rank numbers and format response
        const rankedDonors = donors.map((donor, index) => ({
            rank: index + 1,
            fullName: donor.fullName,
            bloodGroup: donor.bloodGroup,
            donationCount: donor.donationCount,
            badge: donor.badge,
            isVerified: donor.isVerified
        }));
        
        // Filter out donors with 0 donations (optional - keep for now to show all)
        const filteredDonors = rankedDonors.filter(donor => donor.donationCount > 0);
        
        console.log(`Returning ${filteredDonors.length} ranked donors with donations`);
        
        res.json({
            success: true,
            data: filteredDonors,
            totalDonors: filteredDonors.length
        });
        
    } catch (error) {
        console.error('Error fetching donor ranking:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

module.exports = router;
