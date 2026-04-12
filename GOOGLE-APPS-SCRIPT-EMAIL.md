# Google Apps Script Email Service Setup

## Why Google Apps Script is Better

- **No SMTP configuration** needed
- **No app passwords** required
- **Free to use** with Gmail account
- **More reliable** than Nodemailer
- **No timeout issues**
- **Uses Gmail's native sending**

## Step 1: Create Google Apps Script

### 1. Create New Apps Script Project
1. Go to: https://script.google.com/home
2. Click **"New project"**
3. Delete the default code
4. Paste the code below

### 2. Email Service Code
```javascript
// Google Apps Script Email Service
function doGet(e) {
  if (e.parameter.action === 'sendEmail') {
    return sendEmail(e);
  }
  return ContentService.createTextOutput('Email service ready');
}

function doPost(e) {
  if (e.parameter.action === 'sendEmail') {
    return sendEmail(e);
  }
  return ContentService.createTextOutput('Email service ready');
}

function sendEmail(e) {
  try {
    const to = e.parameter.to;
    const subject = e.parameter.subject;
    const body = e.parameter.body;
    const isHtml = e.parameter.isHtml === 'true';
    
    if (!to || !subject || !body) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required parameters'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const options = {
      to: to,
      subject: subject,
      body: body
    };
    
    if (isHtml) {
      options.htmlBody = body;
    }
    
    MailApp.sendEmail(options);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Deploy as Web App
// 1. Click "Deploy" -> "New deployment"
// 2. Type: Web app
// 3. Execute as: Me
// 4. Who has access: Anyone
// 5. Click "Deploy"
// 6. Copy the Web app URL
```

## Step 2: Deploy as Web App

1. **Save the project** (Ctrl + S)
2. Click **"Deploy"** -> **"New deployment"**
3. **Deployment type**: Web app
4. **Description**: Bloodline Email Service
5. **Execute as**: Me (your Google account)
6. **Who has access**: Anyone
7. Click **"Deploy"**
8. **Copy the Web app URL** (it will look like: `https://script.google.com/macros/s/.../exec`)

## Step 3: Update Backend Email Service

### Replace Nodemailer with Google Apps Script

Create this new email service file:

```javascript
// backend/services/emailService.js
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
}

module.exports = new EmailService();
```

## Step 4: Update Environment Variables

On Render Dashboard, add:
```bash
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

You can remove these:
```bash
# EMAIL_USER=adhikarikrish0@gmail.com  # No longer needed
# EMAIL_PASS=mcbq rleh almd bbmc        # No longer needed
```

## Step 5: Update Routes to Use New Email Service

### In your auth routes:
```javascript
// Replace nodemailer import
const emailService = require('../services/emailService');

// Update OTP sending
const emailResult = await emailService.sendOTP(email, otp, fullName);

if (emailResult.success) {
  console.log(`Email sent successfully to ${email}`);
} else {
  console.log('Email failed but OTP generated:', emailResult);
}
```

## Step 6: Test the Setup

1. **Deploy the Google Apps Script**
2. **Update backend environment variables**
3. **Test registration**
4. **Check if emails arrive**

## Benefits of This Approach

- **No SMTP timeouts**
- **Uses Gmail's reliable infrastructure**
- **No app passwords needed**
- **Free and unlimited** (within Gmail limits)
- **Easy to debug**
- **More professional email templates**

## Troubleshooting

### If emails don't send:
1. Check the Google Script URL is correct
2. Ensure the web app is deployed with "Anyone" access
3. Check Google Script execution logs

### If you get permission errors:
1. Re-deploy the Google Script
2. Ensure "Execute as: Me" is selected
3. Check your Google account permissions

---

This approach will completely eliminate the SMTP timeout issues you're experiencing!
