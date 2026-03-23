const mongoose = require('mongoose');

const DonorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    availability: {
        type: String,
        enum: ['available', 'not-available'],
        default: 'available'
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Badge and Ranking System
    donationCount: {
        type: Number,
        default: 0,
        min: 0
    },
    badge: {
        type: String,
        enum: ['Bronze Donor', 'Silver Donor', 'Gold Donor', 'Platinum Donor', 'Hero Donor'],
        default: 'Bronze Donor'
    },
    rank: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Badge calculation method
DonorSchema.methods.calculateBadge = function() {
    const count = this.donationCount;
    let badge = 'Bronze Donor';
    
    if (count >= 20) {
        badge = 'Hero Donor';
    } else if (count >= 10) {
        badge = 'Platinum Donor';
    } else if (count >= 5) {
        badge = 'Gold Donor';
    } else if (count >= 3) {
        badge = 'Silver Donor';
    } else {
        badge = 'Bronze Donor';
    }
    
    return badge;
};

// Update badge and rank method
DonorSchema.methods.updateBadgeAndRank = async function() {
    this.badge = this.calculateBadge();
    await this.save();
};

module.exports = mongoose.model('Donor', DonorSchema);
