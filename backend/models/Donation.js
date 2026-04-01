const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        required: true
    },
    donorName: {
        type: String,
        required: true
    },
    donorEmail: {
        type: String,
        required: true
    },
    donorPhone: {
        type: String,
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    organizationName: {
        type: String,
        required: true
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    location: {
        type: String,
        required: true
    },
    units: {
        type: Number,
        required: true
    },
    donationDate: {
        type: Date,
        default: Date.now
    },
    completionDate: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ['Completed', 'Cancelled'],
        default: 'Completed'
    },
    originalRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Donation', DonationSchema);
