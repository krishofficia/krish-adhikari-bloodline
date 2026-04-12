# Google Apps Script Email Setup - Step by Step

## Step 1: Create Google Apps Script

1. **Go to Google Apps Script**: https://script.google.com/home
2. **Click "New project"**
3. **Delete the default code**
4. **Paste this code**:

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
```

## Step 2: Deploy as Web App

1. **Save the project** (Ctrl + S)
2. **Click "Deploy"** -> **"New deployment"**
3. **Deployment type**: Web app
4. **Description**: Bloodline Email Service
5. **Execute as**: Me (your Google account)
6. **Who has access**: Anyone
7. **Click "Deploy"**
8. **Copy the Web app URL** (it will look like: `https://script.google.com/macros/s/.../exec`)

## Step 3: Update Render Environment

Go to Render Dashboard -> bloodline-backend -> Environment:

**Add this variable:**
```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**You can remove these (optional):**
```
# EMAIL_USER=adhikarikrish0@gmail.com  # No longer needed
# EMAIL_PASS=mcbq rleh almd bbmc        # No longer needed
```

## Step 4: Deploy Backend Changes

1. **Push your code changes** to GitHub
2. **Render will auto-redeploy** the backend
3. **Wait 2-3 minutes** for deployment

## Step 5: Test Email Service

1. **Try registering** at: https://krish-adhikari-bloodline.vercel.app
2. **Check your email** for OTP
3. **Monitor Render logs** for success messages

## Expected Results

**Success Logs:**
```
Email sent successfully via Google Apps Script
OTP generated and sent to email@example.com: 123456
```

**No More:**
```
Connection timeout
Email service configuration failed
SMTP errors
```

## Benefits

- **No SMTP configuration** needed
- **No app passwords** required  
- **More reliable** than Nodemailer
- **Professional HTML emails**
- **Free to use**
- **No timeout issues**

## Troubleshooting

### If emails don't send:
1. Check the Google Script URL is correct
2. Ensure the web app is deployed with "Anyone" access
3. Check Google Script execution logs

### If you get permission errors:
1. Re-deploy the Google Script
2. Ensure "Execute as: Me" is selected
3. Check your Google account permissions

### Quick Test:
You can test the Google Script directly by visiting:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=sendEmail&to=your-email@gmail.com&subject=Test&body=Test%20message
```

---

## What's Been Done

**Backend Changes:**
- Created new `emailService.js` using Google Apps Script
- Updated auth routes to use new email service  
- Added axios dependency
- Professional HTML email templates

**Next Steps:**
1. Complete Google Apps Script setup
2. Update Render environment variables
3. Test registration functionality

Your email service will be much more reliable!
