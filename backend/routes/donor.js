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
        
        const Donation = require('../models/Donation');
        
        // Get donations from the new Donation model
        const donations = await Donation.find({ donorId })
            .sort({ donationDate: -1 })
            .limit(50);
        
        console.log(`Found ${donations.length} donation records`);
        console.log('Donation records:', donations.map(d => ({
            id: d._id,
            date: d.donationDate,
            organization: d.organizationName,
            status: d.status
        })));
        
        res.json({
            success: true,
            donations: donations
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
        
        const Donation = require('../models/Donation');
        
        // Find and delete the donation record
        const donation = await Donation.findOneAndDelete({ 
            _id: donationId, 
            donorId: donorId 
        });
        
        if (!donation) {
            return res.status(404).json({ message: 'Donation record not found' });
        }
        
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
