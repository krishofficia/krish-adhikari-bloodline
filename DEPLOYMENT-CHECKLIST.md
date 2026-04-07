# 🚀 Frontend-Backend Connection Checklist

## ✅ Configuration Completed

### Backend (Render)
- ✅ CORS updated to allow `https://krish-adhikari-bloodline.vercel.app`
- ✅ Environment variables configured
- ✅ Backend URL: `https://krish-adhikari-bloodline.onrender.com`

### Frontend (Vercel)
- ✅ `.env.production` created with backend URL
- ✅ `vercel.json` configuration created
- ✅ `src/api.js` API helper created
- ✅ Login.jsx updated to use new API configuration

## 🔄 Next Steps

### 1. Deploy Backend Changes
```bash
git add .
git commit -m "Update CORS for frontend connection"
git push origin main
```
Render will auto-redeploy within 1-2 minutes.

### 2. Deploy Frontend
```bash
cd frontend-react
vercel --prod
```
Or push to GitHub and Vercel will auto-deploy.

### 3. Test Connection
- Visit: `https://krish-adhikari-bloodline.vercel.app`
- Try login/register functionality
- Check browser console for API requests

## 🔧 API Configuration

All API calls should use the `apiFetch` helper:

```javascript
import { apiFetch } from '../api'

// Example usage
const response = await apiFetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
```

## 🌍 URLs

- **Frontend**: https://krish-adhikari-bloodline.vercel.app
- **Backend**: https://krish-adhikari-bloodline.onrender.com
- **API Endpoint**: https://krish-adhikari-bloodline.onrender.com/api/*

## 🐛 Troubleshooting

### CORS Issues
- Check backend logs on Render
- Verify frontend URL is in CORS whitelist

### Network Errors
- Check if backend is deployed and running
- Verify API URL in environment variables

### Authentication Issues
- Check JWT_SECRET is set on backend
- Verify token storage in localStorage

## 📊 Environment Variables

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://bloodline-user:bloodline123@cluster.mongodb.net/bloodline
JWT_SECRET=your-secret-key
EMAIL_USER=adhikarikrish0@gmail.com
EMAIL_PASS=mcbq rleh almd bbmc
```

### Frontend (Vercel)
```
VITE_API_URL=https://krish-adhikari-bloodline.onrender.com
```

---

Your frontend and backend should now be properly connected! 🎉
