# 🤖 Python Chatbot Integration Setup Guide

## 📋 Overview
Your existing Python chatbot has been successfully integrated into your Bloodline web application!

## 🏗️ Architecture
```
Frontend (React UI) 
    ↓ /api/chatbot
Node.js Backend (localhost:3000)
    ↓ http://localhost:5001/chat
Python Chatbot API (localhost:5001)
    ↓ Uses your existing chatbot logic
Returns response
```

## 🚀 Quick Start

### Step 1: Install Python Dependencies
```bash
cd "C:\Users\DELL\Desktop\Bloodline Web App\Chatbot"
pip install -r requirements.txt
```

### Step 2: Start Python Chatbot Service
```bash
# Option 1: Use the batch file
C:\Users\DELL\Desktop\Bloodline Web App\start_chatbot_api.bat

# Option 2: Run directly
cd "C:\Users\DELL\Desktop\Bloodline Web App\Chatbot"
python chatbot_api.py
```

### Step 3: Start Node.js Backend
```bash
cd "C:\Users\DELL\Desktop\Bloodline Web App\backend"
npm run dev
```

### Step 4: Start Frontend
```bash
cd "C:\Users\DELL\Desktop\Bloodline Web App\frontend-react"
npm run dev
```

## 🔧 Files Created/Modified

### New Files:
- `Chatbot/chatbot_api.py` - Flask API wrapper for your chatbot
- `Chatbot/requirements.txt` - Python dependencies
- `start_chatbot_api.bat` - Easy startup script

### Modified Files:
- `backend/server.js` - Updated to call Python service on port 5001

## 📡 API Endpoints

### Python Chatbot API (Port 5001)
- `POST /chat` - Main chat endpoint
- `GET /health` - Health check

**Request:**
```json
{
  "message": "How long should I wait between blood donations?"
}
```

**Response:**
```json
{
  "reply": "The standard interval between whole blood donations is 56 days..."
}
```

### Node.js Backend (Port 3000)
- `POST /chatbot` - Proxy endpoint (unchanged for frontend)

## ✅ Verification Tests

### Test 1: Python Service Health
```bash
curl http://localhost:5001/health
```
Should return: `{"status": "healthy", "service": "blood-donation-chatbot"}`

### Test 2: Chat Endpoint
```bash
curl -X POST http://localhost:5001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

### Test 3: Full Integration
1. Open your Bloodline web app
2. Navigate to chatbot
3. Ask: "How long should I wait between donations?"
4. Should get intelligent response from your Python chatbot

## 🎯 Key Features Preserved

✅ **Exact same chatbot logic** - No changes to your algorithm
✅ **Same dataset** - Uses your blood_donation_1000_qa.csv
✅ **Same embeddings** - Uses your question_embeddings.npy
✅ **Same UI** - Frontend unchanged
✅ **Error handling** - Graceful fallbacks
✅ **Intent matching** - All your smart matching logic preserved

## 🛠️ Troubleshooting

### Port 5001 Already in Use
```bash
netstat -ano | findstr :5001
taskkill /PID [PID] /F
```

### Python Dependencies Missing
```bash
pip install flask sentence-transformers scikit-learn pandas numpy
```

### Service Not Responding
1. Check Python service is running on port 5001
2. Check backend logs for connection errors
3. Verify all files are in the Chatbot folder

## 🔄 Daily Usage

1. **Start Python chatbot service** (once per session)
2. **Start Node.js backend** (as usual)
3. **Start frontend** (as usual)
4. **Chatbot works automatically!**

## 🎉 Success!

Your Python chatbot is now fully integrated! Users will get much more intelligent, context-aware responses based on your sophisticated sentence-transformer model and intent-based matching system.

The chatbot UI remains exactly the same, but now powered by your advanced Python NLP logic! 🚀
