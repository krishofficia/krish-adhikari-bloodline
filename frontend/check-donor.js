/**
 * Check donor profile before removing
 */

const mongoose = require('mongoose');
const Donor = require('./models/Donor');

async function checkDonor() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/bloodline');
        console.log('Connected to MongoDB');

        // Check if donor exists
        const donor = await Donor.findOne({ email: 'adhikarikrish0@gmail.com' });
        
        if (donor) {
            console.log('✅ Donor found:');
            console.log('  - Email:', donor.email);
            console.log('  - Blood Group:', donor.bloodGroup);
            console.log('  - Location:', donor.location);
            console.log('  - Availability:', donor.availability);
            console.log('  - ID:', donor._id);
        } else {
            console.log('❌ No donor found with email: adhikarikrish0@gmail.com');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error checking donor:', error);
    }
}

checkDonor();
