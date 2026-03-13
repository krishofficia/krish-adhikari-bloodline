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
        const { donorId, donorName, donorEmail } = req.body;
        
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
            donorPhone: '',
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

        // Transform the data to match frontend expectations
        const transformedDonors = availableDonors.map(donor => ({
            _id: donor._id,
            name: donor.fullName,
            email: donor.email,
            phone: donor.phone,
            bloodGroup: donor.bloodGroup,
            location: donor.location,
            available: donor.availability === 'available'
        }));

        console.log('Transformed donors:', transformedDonors);

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

module.exports = router;
