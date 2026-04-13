const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const { generateOTP, storeOTP, verifyOTP, hasPendingOTP } = require('../utils/otpStore');
const { generateResetToken, hashToken, verifyToken } = require('../utils/tokenGenerator');

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
            process.env.JWT_SECRET,
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
            process.env.JWT_SECRET,
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const donorId = decoded.donorId;
        
        const donor = await Donor.findById(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        
        // Calculate donor rank
        const donorsWithHigherCount = await Donor.countDocuments({ donationCount: { $gt: donor.donationCount } });
        const donorRank = donorsWithHigherCount + 1;
        
        // For donors with 0 donations, show "Not Ranked"
        if (donor.donationCount === 0) {
            donorRank = 0;
        }
        
        res.json({
            donor: {
                ...donor.toObject(),
                rank: donorRank
            }
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
            process.env.JWT_SECRET,
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
        
        // Check if donor is verified
        if (!donor.isVerified) {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in.',
                isVerified: false
            });
        }
        
        // Check if this is the first login after verification
        const isFirstLogin = !donor.welcomeEmailSent;
        let welcomeEmailSent = false;
        
        if (isFirstLogin) {
            console.log('First login detected for donor:', donor.email);
            
            try {
                // Send welcome email
                const welcomeResult = await sendWelcomeEmail({
                    to: donor.email,
                    donorName: donor.fullName,
                    bloodGroup: donor.bloodGroup
                });
                
                if (welcomeResult.success) {
                    console.log('Welcome email sent successfully to:', donor.email);
                    welcomeEmailSent = true;
                    
                    // Update donor record to mark welcome email as sent
                    await Donor.findByIdAndUpdate(donor._id, {
                        welcomeEmailSent: true,
                        isFirstLogin: false
                    });
                } else {
                    console.error('Failed to send welcome email:', welcomeResult.error);
                }
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail the login if email fails
            }
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { donorId: donor._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const responseData = {
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
        };
        
        // Add welcome email info to response if it was sent
        if (welcomeEmailSent) {
            responseData.welcomeEmailSent = true;
            responseData.message = 'Login successful! Welcome to Bloodline! 🎉';
        }
        
        res.json(responseData);
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// POST /api/auth/change-password - Change password for authenticated user
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        // Check if it's a donor or organization token
        if (decoded.donorId) {
            // Donor password change
            const donor = await Donor.findById(decoded.donorId);
            if (!donor) {
                return res.status(404).json({ message: 'Donor not found' });
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, donor.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            
            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            donor.password = hashedNewPassword;
            await donor.save();
            
        } else if (decoded.organizationId) {
            // Organization password change
            const organization = await Organization.findById(decoded.organizationId);
            if (!organization) {
                return res.status(404).json({ message: 'Organization not found' });
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, organization.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            
            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            organization.password = hashedNewPassword;
            await organization.save();
        } else {
            return res.status(400).json({ message: 'Invalid token' });
        }
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/send-otp - Generate and send OTP for registration
router.post('/send-otp', async (req, res) => {
    try {
        const { email, role, ...userData } = req.body;
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }
        
        // Validate role
        if (!role || (role !== 'donor' && role !== 'organization')) {
            return res.status(400).json({ message: 'Valid role (donor/organization) is required' });
        }
        
        // Check for rate limiting - prevent spam
        if (hasPendingOTP(email, role)) {
            return res.status(429).json({ 
                message: 'OTP already sent. Please wait before requesting a new one.' 
            });
        }
        
        // Check if user already exists
        let existingUser;
        if (role === 'donor') {
            existingUser = await Donor.findOne({ email });
        } else {
            existingUser = await Organization.findOne({ email });
        }
        
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Generate and store OTP
        const otp = generateOTP();
        
        // Include email in userData for verification
        const userDataWithEmail = {
            ...userData,
            email: email  // Add email back to userData
        };
        
        storeOTP(email, otp, role, userDataWithEmail);
        
        // Send OTP email
        const userName = userData.fullName || userData.name || email;
        const emailResult = await emailService.sendOTP(email, otp, userName);
        
        // Log email result but don't fail the request
        if (emailResult.fallback) {
            console.warn('Email service in fallback mode');
        } else if (!emailResult.success) {
            console.warn('Email warning:', emailResult.message);
        }
        
        console.log(`✅ OTP generated and sent to ${email} (${role}): ${otp}`);
        
        res.json({
            success: true,
            message: 'OTP sent to your email. Please check your inbox.',
            // Don't send OTP in response for security
            email: email,
            role: role
        });
        
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/verify-otp - Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, role } = req.body;
        
        // Validate inputs
        if (!email || !otp || !role) {
            return res.status(400).json({ 
                message: 'Email, OTP, and role are required' 
            });
        }
        
        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Invalid OTP format' });
        }
        
        // Verify OTP
        const verificationResult = verifyOTP(email, otp, role);
        
        if (!verificationResult.success) {
            return res.status(400).json({ 
                message: verificationResult.message 
            });
        }
        
        // Get user data from verification result
        const userData = verificationResult.userData;
        
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user based on role
        let newUser;
        if (role === 'donor') {
            newUser = new Donor({
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
                bloodGroup: userData.bloodGroup,
                location: userData.location,
                availability: userData.availability,
                password: hashedPassword,
                isVerified: true, // User is verified after OTP verification
                welcomeEmailSent: false, // Ready for welcome email on first login
                isFirstLogin: true
            });
        } else {
            newUser = new Organization({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                address: userData.address,
                licenseNumber: userData.licenseNumber,
                panNumber: userData.panNumber,
                panCardImage: userData.panCardImage,
                password: hashedPassword,
                isVerified: true, // User is verified after OTP verification
                verificationStatus: 'pending' // Still needs admin verification for organizations
            });
        }
        
        // Save user to database
        await newUser.save();
        
        console.log(`✅ ${role} registered successfully: ${email}`);
        
        res.json({
            success: true,
            message: `${role === 'donor' ? 'Donor' : 'Organization'} registration successful!`,
            user: {
                id: newUser._id,
                email: newUser.email,
                role: role
            }
        });
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/forgot-password - Generate and send password reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Check if email exists in either Donor or Organization collections
        let user = null;
        let userType = null;
        
        // Check donor first
        user = await Donor.findOne({ email: email.toLowerCase() });
        if (user) {
            userType = 'donor';
        } else {
            // Check organization
            user = await Organization.findOne({ email: email.toLowerCase() });
            if (user) {
                userType = 'organization';
            }
        }
        
        // Always return success to prevent email enumeration attacks
        if (!user) {
            return res.json({ 
                success: true, 
                message: 'If an account with this email exists, a password reset link has been sent.' 
            });
        }
        
        // Generate reset token
        const resetToken = generateResetToken();
        const hashedToken = hashToken(resetToken);
        
        // Calculate expiry time (30 minutes from now)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        
        // Store token in database
        await PasswordReset.deleteMany({ email: email.toLowerCase() }); // Remove any existing tokens
        await PasswordReset.create({
            email: email.toLowerCase(),
            token: hashedToken,
            expiresAt: expiresAt
        });
        
        // Create reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        
        // Send reset email
        const userName = user.fullName || user.name || email;
        const emailResult = await emailService.sendPasswordReset(email, resetLink, userName);
        
        if (!emailResult.success && !emailResult.fallback) {
            console.error('Failed to send reset email:', emailResult.message);
            return res.status(500).json({ message: 'Failed to send reset email' });
        }
        
        if (emailResult.fallback) {
            console.warn('Email service in fallback mode for password reset');
        }
        
        console.log(`Password reset email sent to: ${email}`);
        res.json({ 
            success: true, 
            message: 'Password reset link has been sent to your email.' 
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/reset-password/:token - Verify token and reset password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        
        // Validate inputs
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        // Hash the token to compare with stored hash
        const hashedToken = hashToken(token);
        
        // Find valid reset token
        const resetTokenDoc = await PasswordReset.findOne({
            token: hashedToken,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });
        
        if (!resetTokenDoc) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        
        // Find user by email
        let user = null;
        let userType = null;
        
        // Check donor first
        user = await Donor.findOne({ email: resetTokenDoc.email });
        if (user) {
            userType = 'donor';
        } else {
            // Check organization
            user = await Organization.findOne({ email: resetTokenDoc.email });
            if (user) {
                userType = 'organization';
            }
        }
        
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update user password
        if (userType === 'donor') {
            await Donor.updateOne(
                { email: resetTokenDoc.email },
                { password: hashedPassword }
            );
        } else {
            await Organization.updateOne(
                { email: resetTokenDoc.email },
                { password: hashedPassword }
            );
        }
        
        // Mark token as used
        await PasswordReset.updateOne(
            { _id: resetTokenDoc._id },
            { isUsed: true }
        );
        
        console.log(`Password reset successful for: ${resetTokenDoc.email}`);
        res.json({ 
            success: true, 
            message: 'Password has been reset successfully.' 
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/auth/update-profile - Update donor profile
router.put('/update-profile', async (req, res) => {
    console.log('Update profile endpoint called');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bloodline_secret_key');
        const { email } = decoded;

        // Find donor
        const donor = await Donor.findOne({ email });
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        // Update donor profile
        const { fullName, phone, location } = req.body;
        
        const updatedDonor = await Donor.updateOne(
            { email },
            { 
                fullName: fullName || donor.fullName,
                phone: phone || donor.phone,
                location: location || donor.location
            }
        );

        console.log(`Profile updated for donor: ${email}`);
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            data: {
                fullName: fullName || donor.fullName,
                phone: phone || donor.phone,
                location: location || donor.location
            }
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
