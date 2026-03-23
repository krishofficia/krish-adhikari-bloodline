const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const jwt = require('jsonwebtoken');

// Middleware to authenticate donor
const authenticateDonor = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Authenticating donor with token:', token ? 'Token present' : 'No token');
    
    if (!token) {
        console.log('Access denied: No token provided');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        console.log('Token decoded successfully:', decoded);
        
        // Check if this is a donor token (has donorId field)
        if (!decoded.donorId) {
            console.log('Access denied: Not a donor token, missing donorId');
            return res.status(403).json({ message: 'Access denied. Donor token required.' });
        }
        
        // Set donor info from token
        req.donor = {
            id: decoded.donorId,
            role: 'donor'
        };
        
        console.log('Donor authenticated successfully, ID:', req.donor.id);
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// GET /api/donor/donation-history - Get donor's donation history
router.get('/donation-history', authenticateDonor, async (req, res) => {
    try {
        const donorId = req.donor.id;
        console.log('Fetching donation history for donor ID:', donorId);
        
        // First, let's see all blood requests with any donor responses
        const allRequestsWithResponses = await BloodRequest.find({
            donorResponses: { $exists: true, $ne: [] }
        }).select('donorResponses');
        
        console.log('Total blood requests with donor responses:', allRequestsWithResponses.length);
        
        // Log all donor responses to see the structure
        let totalResponses = 0;
        allRequestsWithResponses.forEach(request => {
            request.donorResponses.forEach(response => {
                totalResponses++;
                console.log(`Response ${totalResponses}: donorId=${response.donorId}, status=${response.status}, donorName=${response.donorName}`);
            });
        });
        
        // Now find all blood requests where this donor has any responses
        const bloodRequests = await BloodRequest.find({
            'donorResponses.donorId': donorId
        }).select('organizationName bloodGroup location quantity donorResponses createdAt');

        console.log('Found blood requests with any donor responses:', bloodRequests.length);

        // Extract completed donations from the requests
        const donations = [];
        bloodRequests.forEach(request => {
            request.donorResponses.forEach(response => {
                console.log('Checking response:', {
                    responseDonorId: response.donorId.toString(),
                    targetDonorId: donorId,
                    status: response.status,
                    match: response.donorId.toString() === donorId && response.status === 'Completed'
                });
                
                if (response.donorId.toString() === donorId && response.status === 'Completed') {
                    console.log('✅ Found completed donation:', response);
                    donations.push({
                        _id: response._id || `${request._id}_${response.donorId}`,
                        organizationName: request.organizationName?.name || 'Unknown Hospital',
                        bloodGroup: request.bloodGroup,
                        location: request.location,
                        units: request.quantity,
                        donationDate: response.responseDate || request.createdAt,
                        completionDate: response.completionDate || new Date(),
                        status: 'Completed',
                        requestId: request._id
                    });
                }
            });
        });

        console.log('Total donations extracted:', donations.length);

        // Sort by donation date (newest first)
        donations.sort((a, b) => new Date(b.donationDate) - new Date(a.donationDate));

        res.json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching donation history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/donor/donation-history/:donationId - Delete a donation record
router.delete('/donation-history/:donationId', authenticateDonor, async (req, res) => {
    try {
        const donorId = req.donor.id;
        const donationId = req.params.donationId;

        // Find the blood request containing this donation
        const bloodRequest = await BloodRequest.findOne({
            'donorResponses.donorId': donorId,
            'donorResponses._id': donationId
        });

        if (!bloodRequest) {
            return res.status(404).json({ message: 'Donation record not found' });
        }

        // Remove the donor response from the blood request
        bloodRequest.donorResponses = bloodRequest.donorResponses.filter(
            response => !(response.donorId === donorId && response._id.toString() === donationId)
        );

        await bloodRequest.save();

        res.json({
            success: true,
            message: 'Donation record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/donors/ranking - Get donor ranking leaderboard
router.get('/ranking', async (req, res) => {
    try {
        console.log('Fetching donor ranking leaderboard...');
        
        // First, check if any donors exist
        const totalDonors = await Donor.countDocuments({ isVerified: true });
        console.log(`Total verified donors: ${totalDonors}`);
        
        // Get all donors sorted by donationCount in descending order
        const donors = await Donor.find({ isVerified: true })
            .select('fullName bloodGroup donationCount badge')
            .sort({ donationCount: -1 })
            .limit(50); // Limit to top 50 donors
        
        console.log(`Found ${donors.length} donors for ranking`);
        console.log('Donors:', donors.map(d => ({ name: d.fullName, count: d.donationCount, badge: d.badge })));
        
        // Add rank numbers and format response
        const rankedDonors = donors.map((donor, index) => ({
            rank: index + 1,
            fullName: donor.fullName,
            bloodGroup: donor.bloodGroup,
            donationCount: donor.donationCount,
            badge: donor.badge
        }));
        
        console.log(`Returning ${rankedDonors.length} ranked donors`);
        
        res.json({
            success: true,
            data: rankedDonors,
            totalDonors: rankedDonors.length
        });
        
    } catch (error) {
        console.error('Error fetching donor ranking:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// DEBUG: Simple route to check database state
router.get('/debug', async (req, res) => {
    try {
        console.log('Debug: Checking database state...');
        
        // Count all donors
        const totalDonors = await Donor.countDocuments();
        const verifiedDonors = await Donor.countDocuments({ isVerified: true });
        
        console.log(`Total donors: ${totalDonors}`);
        console.log(`Verified donors: ${verifiedDonors}`);
        
        // Get first few donors
        const sampleDonors = await Donor.find({ isVerified: true })
            .limit(5)
            .select('fullName donationCount badge isVerified');
            
        console.log('Sample donors:', sampleDonors);
        
        res.json({
            totalDonors,
            verifiedDonors,
            sampleDonors: sampleDonors.map(d => ({
                name: d.fullName,
                donationCount: d.donationCount,
                badge: d.badge,
                isVerified: d.isVerified
            }))
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
