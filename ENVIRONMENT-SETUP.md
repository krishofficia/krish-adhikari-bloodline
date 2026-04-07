# 🔐 Environment Variables Setup

## 🎯 Generated Secure Keys

### JWT Secret Key
```
JWT_SECRET=bloodline_jwt_secret_krish_adhikari_2026_super_secure_random_key_42 chars
```

### Session Secret (if needed)
```
SESSION_SECRET=bloodline_session_secret_krish_adhikari_2026_secure_session_key
```

---

## 🚀 Render Backend Environment Variables

Go to: **Render Dashboard → bloodline-backend → Environment**

```bash
# Database Configuration
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://bloodline-user:bloodline123@cluster.mongodb.net/bloodline
MONGODB_URI=mongodb+srv://bloodline-user:bloodline123@cluster.mongodb.net/bloodline

# Authentication
JWT_SECRET=bloodline_jwt_secret_krish_adhikari_2026_super_secure_random_key_42 chars

# Email Configuration (for OTP)
EMAIL_USER=adhikarikrish0@gmail.com
EMAIL_PASS=mcbq rleh almd bbmc

# Server Configuration
PORT=10000
FRONTEND_URL=https://krish-adhikari-bloodline.vercel.app

# CORS Configuration
CORS_ORIGIN=https://krish-adhikari-bloodline.vercel.app
```

---

## 🎨 Vercel Frontend Environment Variables

Go to: **Vercel Dashboard → krish-adhikari-bloodline → Settings → Environment Variables**

```bash
# API Configuration
VITE_API_URL=https://krish-adhikari-bloodline.onrender.com
```

---

## 📋 Step-by-Step Setup

### Render Backend Setup

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Select `bloodline-backend` service

2. **Add Environment Variables**
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - Copy-paste each variable from above

3. **Save and Redeploy**
   - Click "Save Changes"
   - Wait for automatic redeploy (1-2 minutes)

### Vercel Frontend Setup

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select `krish-adhikari-bloodline` project

2. **Add Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Click "Add New"
   - Add: `VITE_API_URL` with your backend URL

3. **Redeploy**
   - Go to "Deployments"
   - Click "Redeploy" or push new commit

---

## 🔍 Verification Steps

### Backend Verification
```bash
# Check Render logs for successful startup
# Look for: "MongoDB Connected" message
# Look for: "Server running on port 10000"
```

### Frontend Verification
```bash
# Visit: https://krish-adhikari-bloodline.vercel.app
# Open browser console (F12)
# Look for API requests to your backend URL
# Try login/register to test connection
```

---

## 🚨 Important Notes

### Security
- **Never commit secrets to Git**
- **JWT_SECRET is unique to your project**
- **Change these keys if you suspect compromise**

### MongoDB Connection
- Replace `cluster.mongodb.net` with your actual cluster name
- Ensure IP whitelist includes `0.0.0.0/0` for Render access

### CORS
- Frontend URL must match exactly in backend CORS
- Include `https://` protocol

### Email Configuration
- Email pass is app-specific password
- Works for OTP functionality

---

## 🧪 Testing Commands

### Test Backend API
```bash
# Test health endpoint
curl https://krish-adhikari-bloodline.onrender.com/api/auth/profile

# Test with auth (replace token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://krish-adhikari-bloodline.onrender.com/api/auth/profile
```

### Test Frontend Connection
```javascript
// In browser console
fetch('https://krish-adhikari-bloodline.onrender.com/api/auth/profile')
  .then(r => r.json())
  .then(console.log)
```

---

## 📱 Quick Copy-Paste

### Render (copy all at once):
```
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://bloodline-user:bloodline123@cluster.mongodb.net/bloodline
MONGODB_URI=mongodb+srv://bloodline-user:bloodline123@cluster.mongodb.net/bloodline
JWT_SECRET=bloodline_jwt_secret_krish_adhikari_2026_super_secure_random_key_42 chars
EMAIL_USER=adhikarikrish0@gmail.com
EMAIL_PASS=mcbq rleh almd bbmc
PORT=10000
FRONTEND_URL=https://krish-adhikari-bloodline.vercel.app
CORS_ORIGIN=https://krish-adhikari-bloodline.vercel.app
```

### Vercel (copy all at once):
```
VITE_API_URL=https://krish-adhikari-bloodline.onrender.com
```

---

🎉 **After setting these variables, your app will be fully connected and secure!**

Your Bloodline app will be accessible at:
- **Frontend**: https://krish-adhikari-bloodline.vercel.app
- **Backend API**: https://krish-adhikari-bloodline.onrender.com/api/*
