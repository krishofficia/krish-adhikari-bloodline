/**
 * Email Service using Nodemailer
 * Handles sending email notifications to donors for blood requests
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

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
            from: `"Bloodline" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
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
 * @param {Object} bloodRequest - Blood request details
 * @param {Object} organization - Organization details
 * @returns {string} - HTML email content
 */
const generateBloodRequestEmail = (bloodRequest, organization) => {
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
                margin: 20px 0;
                text-align: center;
            }
            .cta-button:hover {
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
                    <span class="detail-value">${organization.name}</span>
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
                    <span class="detail-label">Required Date:</span>
                    <span class="detail-value">${new Date(bloodRequest.requiredDate).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="http://localhost:3000/login.html" class="cta-button">
                    Login to Bloodline to View Details
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

module.exports = {
    sendNotification,
    generateBloodRequestEmail
};
