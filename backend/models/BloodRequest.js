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
    },
    donorResponses: [{
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
        responseDate: {
            type: Date,
            default: Date.now
        },
        completionDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['Accepted', 'Rejected', 'Completed'],
            default: 'Accepted'
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
