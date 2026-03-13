const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register - Register a new organization
router.post('/register', async (req, res) => {
    try {
        console.log('Organization registration request body:', req.body);
        const { name, email, password, phone, address, licenseNumber, panNumber, panCardImage } = req.body;
        
        // Validate required fields
        if (!name || !email || !password || !phone || !address || !licenseNumber || !panNumber || !panCardImage) {
            console.log('Missing required fields:', { 
                name: !!name, 
                email: !!email, 
                password: !!password, 
                phone: !!phone, 
                address: !!address, 
                licenseNumber: !!licenseNumber, 
                panNumber: !!panNumber, 
                panCardImage: !!panCardImage,
                nameLength: name ? name.length : 0,
                emailLength: email ? email.length : 0,
                panNumberLength: panNumber ? panNumber.length : 0,
                panCardImageType: typeof panCardImage,
                panCardImageLength: panCardImage ? panCardImage.length : 0
            });
            return res.status(400).json({ 
                message: 'All fields are required including PAN number and PAN card image',
                details: {
                    name: !!name,
                    email: !!email,
                    password: !!password,
                    phone: !!phone,
                    address: !!address,
                    licenseNumber: !!licenseNumber,
                    panNumber: !!panNumber,
                    panCardImage: !!panCardImage
                }
            });
        }
        
        // Check if organization already exists
        const existingOrg = await Organization.findOne({ $or: [{ email }, { licenseNumber }] });
        if (existingOrg) {
            console.log('Organization already exists:', existingOrg.email);
            
            // Allow re-registration if organization was rejected
            if (existingOrg.verificationStatus === 'rejected') {
                // Delete the rejected organization and allow new registration
                await Organization.findByIdAndDelete(existingOrg._id);
                console.log('Deleted rejected organization, allowing new registration');
            } else {
                return res.status(400).json({ 
                    message: 'Organization with this email or license number already exists' 
                });
            }
        }
        
        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new organization
        console.log('Creating organization with PAN verification...');
        const organization = new Organization({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            licenseNumber,
            panNumber,
            panCardImage,
            verificationStatus: 'pending',
            isVerified: false
        });
        
        console.log('Saving organization to database...');
        await organization.save();
        console.log('Organization saved successfully with ID:', organization._id);
        
        // Generate JWT token
        const token = jwt.sign(
            { organizationId: organization._id },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Organization registered successfully',
            token,
            organization: {
                id: organization._id,
                name: organization.name,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                licenseNumber: organization.licenseNumber,
                panNumber: organization.panNumber,
                verificationStatus: organization.verificationStatus,
                isVerified: organization.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/login - Login organization
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find organization by email
        const organization = await Organization.findOne({ email });
        if (!organization) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, organization.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Handle older organizations without verification fields
        const verificationStatus = organization.verificationStatus || 'pending';
        const rejectionReason = organization.rejectionReason || null;
        
        // Check verification status
        if (verificationStatus === 'pending') {
            return res.status(403).json({ 
                message: 'Your details are being verified by admin.',
                verificationStatus: 'pending'
            });
        }
        
        if (verificationStatus === 'rejected') {
            return res.status(403).json({ 
                message: 'Your organization verification was rejected.',
                verificationStatus: 'rejected',
                rejectionReason: rejectionReason || 'Please contact admin for details.'
            });
        }
        
        if (verificationStatus !== 'approved') {
            return res.status(403).json({ 
                message: 'Your organization is not verified.',
                verificationStatus: verificationStatus
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { organizationId: organization._id },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            organization: {
                id: organization._id,
                name: organization.name,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                licenseNumber: organization.licenseNumber,
                isVerified: organization.isVerified || false,
                verificationStatus: verificationStatus
            }
        });
    } catch (error) {
        console.error('Organization login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/auth/profile - Get donor profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        const donorId = decoded.donorId;
        
        const donor = await Donor.findById(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        
        res.json({
            user: donor
        });
    } catch (error) {
        console.error('Profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/register-donor - Register a new donor
router.post('/register-donor', async (req, res) => {
    try {
        console.log('Donor registration request body:', req.body);
        const { fullName, email, password, phone, bloodGroup, location, availability } = req.body;
        
        // Check if donor already exists
        console.log('Checking if donor exists with email:', email);
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) {
            console.log('Donor already exists:', existingDonor.email);
            return res.status(400).json({ 
                message: 'Donor with this email already exists' 
            });
        }
        
        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new donor
        console.log('Creating new donor with data:', {
            fullName,
            email,
            phone,
            bloodGroup,
            location,
            availability: availability || 'available'
        });
        
        const donor = new Donor({
            fullName,
            email,
            phone,
            bloodGroup,
            location,
            availability: availability || 'available',
            password: hashedPassword
        });
        
        console.log('Saving donor to database...');
        await donor.save();
        console.log('Donor saved successfully with ID:', donor._id);
        
        // Generate JWT token
        const token = jwt.sign(
            { donorId: donor._id },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );
        
        console.log('Token generated, sending response...');
        res.status(201).json({
            message: 'Donor registered successfully',
            token,
            donor: {
                id: donor._id,
                fullName: donor.fullName,
                email: donor.email,
                phone: donor.phone,
                bloodGroup: donor.bloodGroup,
                location: donor.location,
                availability: donor.availability,
                isVerified: donor.isVerified
            }
        });
    } catch (error) {
        console.error('Donor registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/login-donor - Login donor
router.post('/login-donor', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find donor by email
        const donor = await Donor.findOne({ email });
        if (!donor) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, donor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { donorId: donor._id },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            donor: {
                id: donor._id,
                fullName: donor.fullName,
                email: donor.email,
                phone: donor.phone,
                bloodGroup: donor.bloodGroup,
                location: donor.location,
                availability: donor.availability,
                isVerified: donor.isVerified
            }
        });
    } catch (error) {
        console.error('Donor login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/auth/availability - Update donor availability
router.put('/availability', async (req, res) => {
    try {
        console.log('Availability update request received');
        console.log('Headers:', req.headers);
        
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token extracted:', token);
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        console.log('Decoded token:', decoded);
        
        const donorId = decoded.donorId;
        console.log('Donor ID from token:', donorId);
        
        const { availability } = req.body;
        console.log('Request body availability:', availability);
        
        const donor = await Donor.findById(donorId);
        console.log('Found donor:', donor);
        
        if (!donor) {
            console.log('Donor not found');
            return res.status(404).json({ message: 'Donor not found' });
        }
        
        donor.availability = availability;
        await donor.save();
        console.log('Donor updated successfully');
        
        res.json({
            message: 'Availability updated successfully',
            availability: donor.availability
        });
    } catch (error) {
        console.error('Availability update error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/donor/notifications - Get blood requests for donor
router.get('/donor/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        const donorId = decoded.donorId;
        
        // Find blood requests that match donor's blood group
        const donor = await Donor.findById(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        
        const bloodRequests = await BloodRequest.find({ 
            bloodGroup: donor.bloodGroup,
            status: { $in: ['Pending', 'Approved'] }
        }).sort({ createdAt: -1 });
        
        res.json({
            requests: bloodRequests
        });
    } catch (error) {
        console.error('Donor notifications error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/donors - Get all available donors for organizations
router.get('/donors', async (req, res) => {
    console.log('GET /api/donors endpoint hit');
    try {
        console.log('Fetching donors from database...');
        const donors = await Donor.find({ availability: 'available' })
            .select('fullName email phone bloodGroup location availability')
            .sort({ createdAt: -1 });
        
        console.log('Found donors:', donors.length);
        
        const response = {
            success: true,
            donors: donors.map(donor => ({
                fullName: donor.fullName,
                email: donor.email,
                phone: donor.phone,
                bloodGroup: donor.bloodGroup,
                location: donor.location,
                availability: donor.availability || 'available'
            }))
        };
        
        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error fetching donors:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
