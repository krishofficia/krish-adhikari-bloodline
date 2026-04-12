// Google Apps Script Email Service
const axios = require('axios');

class EmailService {
  constructor() {
    this.scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    this.fallbackEnabled = true;
  }

  async sendEmail(to, subject, body, isHtml = false) {
    try {
      if (!this.scriptUrl) {
        throw new Error('Google Script URL not configured');
      }

      const response = await axios.post(this.scriptUrl, null, {
        params: {
          action: 'sendEmail',
          to: to,
          subject: subject,
          body: body,
          isHtml: isHtml.toString()
        },
        timeout: 10000
      });

      const result = response.data;
      
      if (result.success) {
        console.log('Email sent successfully via Google Apps Script');
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      console.error('Google Apps Script email failed:', error.message);
      
      if (this.fallbackEnabled) {
        console.log('Email service failed but request succeeded (fallback mode)');
        return { success: true, fallback: true };
      }
      
      throw error;
    }
  }

  async sendOTP(email, otp, userName) {
    const subject = 'Bloodline - OTP Verification';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Bloodline</h2>
          <p style="margin: 5px 0;">Blood Donation Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h3>Hello ${userName},</h3>
          <p>Your One-Time Password (OTP) for Bloodline account verification is:</p>
          
          <div style="background: white; border: 2px solid #d32f2f; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #d32f2f; letter-spacing: 5px;">${otp}</span>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>Bloodline will never ask for your OTP</li>
          </ul>
          
          <p>If you didn't request this OTP, please ignore this email.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Thank you for using Bloodline to save lives! <br>
              <a href="https://krish-adhikari-bloodline.vercel.app" style="color: #d32f2f;">Visit Bloodline</a>
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Bloodline. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, body, true);
  }

  async sendPasswordReset(email, resetLink, userName) {
    const subject = 'Bloodline - Password Reset Request';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Bloodline</h2>
          <p style="margin: 5px 0;">Blood Donation Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h3>Hello ${userName},</h3>
          <p>You requested to reset your password for your Bloodline account.</p>
          
          <div style="background: white; border: 2px solid #d32f2f; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <a href="${resetLink}" style="background: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link is valid for 30 minutes only</li>
            <li>If you didn't request this, please ignore this email</li>
            <li>Never share this link with anyone</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Thank you for using Bloodline to save lives! <br>
              <a href="https://krish-adhikari-bloodline.vercel.app" style="color: #d32f2f;">Visit Bloodline</a>
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Bloodline. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, body, true);
  }
}

module.exports = new EmailService();
