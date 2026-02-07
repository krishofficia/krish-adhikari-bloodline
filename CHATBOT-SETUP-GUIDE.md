# Blood Donation Chatbot Setup Guide

## Overview

This chatbot uses the pre-trained **all-MiniLM-L6-v2** Sentence Transformer model to provide intelligent responses to blood donation questions using cosine similarity on embeddings.

## Architecture

```
Frontend (HTML/JS) → Node.js API → Python Chatbot Service → Sentence Transformer Model
```

## Features

- ✅ **Pre-trained Model**: all-MiniLM-L6-v2 (384-dimensional embeddings)
- ✅ **1000 Q&A Pairs**: Comprehensive blood donation dataset
- ✅ **Cosine Similarity**: Accurate semantic matching
- ✅ **Fallback Responses**: Handles low-similarity queries gracefully
- ✅ **REST API**: Clean integration with existing Bloodline app

## Quick Setup

### Prerequisites

1. **Python 3.7+** installed
2. **Node.js** already running (from your existing setup)
3. **MongoDB** running (from your existing setup)

### Step 1: Install Python Dependencies

```cmd
cd "C:\Users\DELL\Desktop\Bloodline Web App"
pip install -r chatbot_requirements.txt
```

### Step 2: Start Chatbot Service

```cmd
python chatbot_service.py
```

**Expected Output:**
```
✅ Model loaded successfully
✅ Dataset loaded: 1000 Q&A pairs
✅ Embeddings generated: (1000, 384)
🚀 Starting chatbot service on port 5001...
```

### Step 3: Start Bloodline Server

In a **separate terminal**:
```cmd
set MONGODB_URI=mongodb://127.0.0.1:27017/bloodline && node server.js
```

### Step 4: Test the Chatbot

Open your browser and go to `http://localhost:3000` - the chatbot is now integrated into all pages!

## Chatbot Capabilities

### ✅ **Topics Covered**
- **Eligibility**: Age requirements, health conditions
- **Donation Intervals**: How often you can donate
- **Safety**: What to expect during/after donation
- **Diet**: What to eat/drink before and after
- **Medical Conditions**: Anemia, medications, vaccines
- **Blood Types**: Understanding blood groups
- **Pregnancy**: Donation rules for pregnant women

### ✅ **Smart Features**
- **Semantic Understanding**: Understands paraphrased questions
- **Context-Aware**: Provides relevant, specific answers
- **Fallback Handling**: Graceful responses to unrelated questions
- **Fast Response**: Pre-computed embeddings for speed

## API Endpoints

### Chatbot Service (Python)
- `GET http://localhost:5001/health` - Service health check
- `POST http://localhost:5001/chat` - Chat endpoint
- `GET http://localhost:5001/stats` - Service statistics

### Bloodline API (Node.js)
- `POST http://localhost:3000/api/chat` - Main chat endpoint

## Sample Questions to Test

### Basic Questions
- "How old do I need to be to donate blood?"
- "How often can I donate blood?"
- "What should I eat before donating blood?"

### Complex Questions
- "Can I donate if I have anemia?"
- "How does pregnancy affect blood donation?"
- "What medications prevent blood donation?"

### Paraphrased Questions
- "What's the minimum age for blood donation?"
- "Is there a waiting period between donations?"
- "Any dietary restrictions before giving blood?"

## Troubleshooting

### Python Service Issues

**Issue**: `ModuleNotFoundError: No module named 'sentence_transformers'`
```cmd
pip install -r chatbot_requirements.txt
```

**Issue**: `CUDA out of memory` (if using GPU)
```cmd
# The model automatically uses CPU if CUDA is not available
# No action needed
```

**Issue**: Service won't start
```cmd
# Check dataset exists
if exist blood_donation_1000_qa.csv (echo Dataset found) else (echo Dataset missing)

# Check Python version
python --version
```

### Integration Issues

**Issue**: Chatbot not responding in browser
1. Make sure Python service is running on port 5001
2. Check Node.js server is running on port 3000
3. Check browser console for errors

**Issue**: "AI service is currently starting up" message
1. Wait 30-60 seconds for model to load
2. Check Python service logs
3. Restart Python service if needed

### Performance Issues

**Issue**: Slow responses
- This is normal on first load (model initialization)
- Subsequent responses should be fast (<1 second)

**Issue**: High memory usage
- The model uses ~500MB RAM (normal for embeddings)
- Consider closing other applications if needed

## Advanced Configuration

### Adjusting Similarity Threshold

Edit `chatbot_service.py`:
```python
self.similarity_threshold = 0.3  # Lower = more permissive, Higher = stricter
```

### Adding Custom Responses

Add new Q&A pairs to `blood_donation_1000_qa.csv`:
```csv
question,answer
"Your new question here","Your answer here"
```

Restart the Python service to reload the dataset.

## Monitoring

### Check Service Status
```cmd
curl http://localhost:5001/health
```

### View Statistics
```cmd
curl http://localhost:5001/stats
```

### Monitor Logs
Python service logs show:
- Model loading progress
- Query processing details
- Similarity scores for matches

## Security Notes

- ✅ **No External APIs**: All processing is local
- ✅ **No Data Collection**: Questions are not stored
- ✅ **Privacy-Focused**: No user data is transmitted externally
- ✅ **Local Processing**: All embeddings computed locally

## Performance Metrics

- **Model Load Time**: ~30 seconds (one-time)
- **Query Response Time**: <1 second
- **Memory Usage**: ~500MB RAM
- **Dataset Size**: 1000 Q&A pairs
- **Embedding Dimensions**: 384

## Support

For issues:
1. Check this guide first
2. Review the troubleshooting section
3. Check service logs for error messages
4. Ensure all prerequisites are met

---

**🩸 The Blood Donation Chatbot is now ready to assist users with accurate, helpful information about blood donation!**
