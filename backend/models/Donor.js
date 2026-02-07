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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Donor', DonorSchema);
