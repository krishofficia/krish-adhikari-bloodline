const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    // PAN Verification Fields
    panNumber: {
        type: String,
        required: true,
        trim: true
    },
    panCardImage: {
        type: String,
        required: true,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Organization', OrganizationSchema);
