const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    hospitalName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    urgencyLevel: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    requiredDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Completed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
