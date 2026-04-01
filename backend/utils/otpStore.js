const crypto = require('crypto');

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiry (5 minutes)
const storeOTP = (email, otp, role, userData) => {
  const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes
  
  // Remove any existing OTP for this email
  const existingKeys = Array.from(otpStore.keys()).filter(key => key.startsWith(email));
  existingKeys.forEach(key => otpStore.delete(key));
  
  // Store new OTP
  const key = `${email}_${role}`;
  otpStore.set(key, {
    otp,
    userData,
    expiryTime,
    attempts: 0,
    maxAttempts: 3
  });
  
  // Clean up expired OTPs every 5 minutes
  setTimeout(() => {
    if (otpStore.has(key) && otpStore.get(key).expiryTime <= Date.now()) {
      otpStore.delete(key);
    }
  }, 5 * 60 * 1000);
};

// Verify OTP
const verifyOTP = (email, otp, role) => {
  const key = `${email}_${role}`;
  const storedData = otpStore.get(key);
  
  if (!storedData) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  if (storedData.expiryTime <= Date.now()) {
    otpStore.delete(key);
    return { success: false, message: 'OTP expired' };
  }
  
  if (storedData.attempts >= storedData.maxAttempts) {
    otpStore.delete(key);
    return { success: false, message: 'Maximum attempts exceeded' };
  }
  
  if (storedData.otp !== otp) {
    storedData.attempts++;
    return { 
      success: false, 
      message: `Invalid OTP. ${storedData.maxAttempts - storedData.attempts} attempts remaining` 
    };
  }
  
  // OTP is valid, return user data and remove from store
  const userData = storedData.userData;
  otpStore.delete(key);
  
  return { success: true, userData };
};

// Check if OTP exists for email (for rate limiting)
const hasPendingOTP = (email, role) => {
  const key = `${email}_${role}`;
  const storedData = otpStore.get(key);
  
  if (!storedData) return false;
  
  if (storedData.expiryTime <= Date.now()) {
    otpStore.delete(key);
    return false;
  }
  
  return true;
};

// Clean up expired OTPs (run periodically)
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [key, data] of otpStore.entries()) {
    if (data.expiryTime <= now) {
      otpStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasPendingOTP,
  cleanupExpiredOTPs
};
