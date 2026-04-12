# # Email Configuration Fix

## Problem Identified
The email service is failing with "Connection timeout" error when trying to send OTP emails:

```
Email service configuration failed: Connection timeout
Please check your EMAIL_USER and EMAIL_PASS environment variables
```

## Issues with Current Setup

1. **App Password Issue**: The current email password `mcbq rleh almd bbmc` appears to be an old format
2. **Gmail Security**: Gmail requires App Passwords for third-party apps
3. **SMTP Configuration**: May need proper Gmail SMTP settings

## Solution Options

### Option 1: Use Gmail App Password (Recommended)

#### Step 1: Generate Gmail App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Step Verification (if not already enabled)
3. Go to Security -> App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

#### Step 2: Update Render Environment Variables
Go to Render Dashboard -> bloodline-backend -> Environment and update:

```bash
EMAIL_USER=adhikarikrish0@gmail.com
EMAIL_PASS=your-16-character-app-password-here
```

### Option 2: Use Alternative Email Service

#### SendGrid (Free Tier)
1. Sign up at https://sendgrid.com/
2. Get API key
3. Update email configuration in backend

#### Brevo (formerly Sendinblue) - Free
1. Sign up at https://www.brevo.com/
2. Get SMTP credentials
3. Update configuration

### Option 3: Use Ethereal Email (Testing Only)
For testing purposes without real email delivery:

```bash
EMAIL_USER=ethereal.user@ethereal.email
EMAIL_PASS=ethereal.password
```

## Quick Fix Steps

### For Gmail App Password:

1. **Generate App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" app
   - Copy the 16-character password

2. **Update Render Environment:**
   - Go to: https://dashboard.render.com/
   - Select: bloodline-backend
   - Click: Environment tab
   - Update EMAIL_PASS with the new app password

3. **Redeploy Backend:**
   - Save changes
   - Wait for automatic redeploy (1-2 minutes)

## Testing the Fix

After updating the email configuration:

1. **Test Registration:**
   - Try registering with your email
   - Check if OTP arrives

2. **Check Logs:**
   - Look for successful email sending logs
   - No more "Connection timeout" errors

## Alternative: Disable Email for Testing

If you want to test without email, you can:

1. **Check OTP in Backend Logs:**
   - The OTP is still generated and logged
   - Look for: `OTP generated and sent to email@example.com: 123456`

2. **Use OTP from Logs:**
   - Copy the 6-digit code from logs
   - Use it for verification

## Current Email Configuration Code

Your backend should have this configuration:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Next Steps

1. **Choose Option 1** (Gmail App Password) for real emails
2. **Or use Option 3** (Ethereal) for testing
3. **Update environment variables** on Render
4. **Test registration functionality**

---

## Priority Actions

1. **Generate Gmail App Password** - Most reliable option
2. **Update EMAIL_PASS on Render** 
3. **Test registration with real email**

Your registration will work once email service is fixed!
