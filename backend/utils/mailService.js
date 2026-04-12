/**
 * Email Service using Nodemailer
 * Handles sending email notifications to donors for blood requests
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate email configuration
const emailUser = process.env.EMAIL_USER || 'fallback-email@example.com';
const emailPass = process.env.EMAIL_PASS || 'fallback-password';

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER and EMAIL_PASS not set, using fallbacks (please set in production)');
}

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

// Test email configuration on startup
const testEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service configured successfully');
    } catch (error) {
        console.error('❌ Email service configuration failed:', error.message);
        console.error('💡 Please check your EMAIL_USER and EMAIL_PASS environment variables');
    }
};

// Test configuration on module load
testEmailConfig();

/**
 * Send OTP email for registration verification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} options.role - User role (donor/organization)
 * @returns {Promise} - Email sending result
 */
const sendOTP = async (options) => {
    try {
        const roleText = options.role === 'donor' ? 'Donor' : 'Organization';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bloodline - Email Verification</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #d32f2f;
                        margin-bottom: 10px;
                    }
                    .otp-box {
                        background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .otp-code {
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        margin: 10px 0;
                        background: rgba(255,255,255,0.2);
                        padding: 15px;
                        border-radius: 5px;
                        display: inline-block;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 14px;
                    }
                    .warning {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🩸 Bloodline</div>
                        <h2>Email Verification</h2>
                        <p>Complete your ${roleText} registration</p>
                    </div>
                    
                    <p>Hello,</p>
                    <p>Thank you for registering as a ${roleText} on Bloodline! To complete your registration, please use the following One-Time Password (OTP):</p>
                    
                    <div class="otp-box">
                        <p>Your verification code is:</p>
                        <div class="otp-code">${options.otp}</div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>This OTP will expire in <strong>5 minutes</strong></li>
                            <li>Do not share this code with anyone</li>
                            <li>Enter this code on the verification page</li>
                        </ul>
                    </div>
                    
                    <p>If you didn't request this registration, please ignore this email.</p>
                    
                    <div class="footer">
                        <p>Best regards,<br>
                        The Bloodline Team<br>
                        <small>🩸 Saving Lives, One Drop at a Time</small></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Bloodline" <${emailUser}>`,
            to: options.to,
            subject: `Bloodline - Verify Your ${roleText} Registration`,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${options.to}:`, result.messageId);
        
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${options.to}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Send email notification to donor
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @returns {Promise} - Email sending result
 */
const sendNotification = async (options) => {
    try {
        const mailOptions = {
            from: `"Bloodline" <${emailUser}>`,
            to: options.to,
            subject: options.subject,
            html: options.html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${options.to}:`, result.messageId);
        
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`❌ Failed to send email to ${options.to}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate blood request notification email template
 * @param {Object} donor - Donor information
 * @param {Object} bloodRequest - Blood request details
 * @param {Object} organization - Organization details
 * @returns {string} - HTML email content
 */
const generateBloodRequestEmail = (donor, bloodRequest, organization) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blood Request Notification - Bloodline</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e9ecef;
            }
            .request-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #e74c3c;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-label {
                font-weight: 600;
                color: #666;
                min-width: 120px;
            }
            .detail-value {
                color: #333;
                font-weight: 500;
            }
            .cta-button {
                display: inline-block;
                background: #e74c3c;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                margin: 10px 5px;
                text-align: center;
            }
            .cta-button:hover {
                background: #c0392b;
            }
            .accept-btn {
                background: #27ae60;
            }
            .accept-btn:hover {
                background: #219a52;
            }
            .decline-btn {
                background: #e74c3c;
            }
            .decline-btn:hover {
                background: #c0392b;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .blood-group {
                display: inline-block;
                background: #e74c3c;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: bold;
                margin-left: 10px;
            }
            .urgent {
                background: #ff6b6b;
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 12px;
                margin-left: 10px;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🩸 Blood Request Alert</h1>
            <p>Urgent blood donation opportunity in your area</p>
        </div>
        
        <div class="content">
            <div class="request-details">
                <h2>Request Details</h2>
                
                <div class="detail-row">
                    <span class="detail-label">Organization:</span>
                    <span class="detail-value">${organization?.name || 'Hospital'}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Blood Group:</span>
                    <span class="detail-value">
                        <span class="blood-group">${bloodRequest.bloodGroup}</span>
                        <span class="urgent">URGENT</span>
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${bloodRequest.location}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Units Needed:</span>
                    <span class="detail-value">${bloodRequest.quantity} units</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Hospital:</span>
                    <span class="detail-value">${bloodRequest.hospitalName}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Required Date:</span>
                    <span class="detail-value">${new Date(bloodRequest.requiredDate).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Urgency Level:</span>
                    <span class="detail-value">${bloodRequest.urgencyLevel}</span>
                </div>
            </div>
            
            <div class="button-container">
                <a href="http://localhost:5173/donor/respond/${bloodRequest._id}/accept" class="cta-button accept-btn">
                    ✅ Accept Request
                </a>
                <a href="http://localhost:5173/donor/respond/${bloodRequest._id}/decline" class="cta-button decline-btn">
                    ❌ Decline Request
                </a>
            </div>
            
            <div class="footer">
                <p><strong>You received this email because you are a registered donor with Bloodline.</strong></p>
                <p>Your blood group matches this urgent request. Please consider donating to save lives.</p>
                <p>If you no longer wish to receive these notifications, please update your availability status in your Bloodline dashboard.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.resetLink - Password reset link
 * @param {string} options.userName - User's name (optional)
 * @returns {Promise} - Email sending result
 */
const sendPasswordResetEmail = async (options) => {
    try {
        const { to, resetLink, userName } = options;
        
        const mailOptions = {
            from: emailUser,
            to: to,
            subject: 'Reset Your Bloodline Password',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .container {
                        background-color: #ffffff;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        border-top: 5px solid #d32f2f;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        color: #d32f2f;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .title {
                        color: #333;
                        font-size: 20px;
                        margin-bottom: 10px;
                    }
                    .content {
                        margin-bottom: 30px;
                    }
                    .reset-button {
                        display: inline-block;
                        background-color: #d32f2f;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .reset-button:hover {
                        background-color: #b71c1c;
                    }
                    .security-info {
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        margin-top: 30px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🩸 Bloodline</div>
                        <h1 class="title">Reset Your Password</h1>
                    </div>
                    
                    <div class="content">
                        <p>Hello ${userName || 'User'},</p>
                        
                        <p>We received a request to reset your password for your Bloodline account. Click the button below to reset your password:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="reset-button">Reset Password</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                            ${resetLink}
                        </p>
                        
                        <div class="security-info">
                            <p><strong>⚠️ Security Information:</strong></p>
                            <ul>
                                <li>This link will expire in 30 minutes</li>
                                <li>If you didn't request this password reset, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                            </ul>
                        </div>
                        
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 Bloodline. All rights reserved.</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to donor on first login
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.donorName - Donor's full name
 * @param {string} options.bloodGroup - Donor's blood group
 * @returns {Promise} - Email sending result
 */
const sendWelcomeEmail = async (options) => {
    try {
        const { to, donorName, bloodGroup } = options;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Bloodline</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #d32f2f;
                        margin-bottom: 10px;
                    }
                    .title {
                        color: #333;
                        font-size: 24px;
                        margin: 0;
                    }
                    .content {
                        margin-bottom: 30px;
                    }
                    .welcome-message {
                        background: linear-gradient(135deg, #d32f2f, #b71c1c);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .blood-badge {
                        display: inline-block;
                        background: #d32f2f;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .feature-list {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .feature-list h3 {
                        color: #d32f2f;
                        margin-top: 0;
                    }
                    .feature-list ul {
                        margin: 0;
                        padding-left: 20px;
                    }
                    .feature-list li {
                        margin-bottom: 10px;
                    }
                    .cta-section {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .cta-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #d32f2f, #b71c1c);
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 25px;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    }
                    .cta-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
                    }
                    .stats {
                        display: flex;
                        justify-content: space-around;
                        margin: 30px 0;
                        text-align: center;
                    }
                    .stat-item {
                        flex: 1;
                    }
                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #d32f2f;
                    }
                    .stat-label {
                        font-size: 14px;
                        color: #666;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🩸 Bloodline</div>
                        <h1 class="title">Welcome to the Bloodline Family!</h1>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h2>🎉 Thank you for joining us, ${donorName}!</h2>
                            <p>Your account is now verified and you're ready to start saving lives.</p>
                        </div>
                        
                        <div class="blood-badge">
                            Your Blood Group: ${bloodGroup}
                        </div>
                        
                        <div class="feature-list">
                            <h3>🌟 What You Can Do Now:</h3>
                            <ul>
                                <li><strong>Update Your Profile:</strong> Keep your information current</li>
                                <li><strong>Set Availability:</strong> Let others know when you're available to donate</li>
                                <li><strong>Respond to Requests:</strong> Help patients in need of blood</li>
                                <li><strong>Earn Badges:</strong> Get recognized for your contributions</li>
                                <li><strong>Track Impact:</strong> See how many lives you've helped save</li>
                            </ul>
                        </div>
                        
                        <div class="stats">
                            <div class="stat-item">
                                <div class="stat-number">4.5M+</div>
                                <div class="stat-label">Lives Saved Annually</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">24/7</div>
                                <div class="stat-label">Emergency Support</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">1000+</div>
                                <div class="stat-label">Active Donors</div>
                            </div>
                        </div>
                        
                        <div class="cta-section">
                            <p>Ready to make a difference? Log in to your dashboard to get started!</p>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="cta-button">
                                Go to Dashboard
                            </a>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>💡 Pro Tip:</strong> Keep your availability status updated to receive relevant blood donation requests in your area.</p>
                        </div>
                        
                        <p>If you have any questions or need assistance, our support team is here to help you.</p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 Bloodline. All rights reserved.</p>
                        <p>Together, we can save lives. 🩸</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

        const mailOptions = {
            from: emailUser,
            to: to,
            subject: '🎉 Welcome to Bloodline - Start Your Life-Saving Journey!',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTP,
    sendNotification,
    generateBloodRequestEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
