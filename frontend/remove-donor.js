/**
 * Remove donor profile from database
 */

const mongoose = require('mongoose');
const Donor = require('./models/Donor');

async function removeDonor() {
    try {
        // Connect to database
        await mongoose.connect('mongodb://127.0.0.1:27017/bloodline');
        console.log('Connected to MongoDB');

        // Remove the donor
        const result = await Donor.deleteOne({ email: 'adhikarikrish0@gmail.com' });
        
        if (result.deletedCount > 0) {
            console.log('✅ Donor profile removed successfully!');
            console.log(`Deleted ${result.deletedCount} donor(s)`);
        } else {
            console.log('❌ No donor found with that email');
        }

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('❌ Error removing donor:', error);
    }
}

removeDonor();
