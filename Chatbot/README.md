# Blood Donation Chatbot API

## Overview
Advanced blood donation chatbot powered by sentence-transformers and NLP.

## Features
- **Semantic Search**: Uses sentence-transformers for intelligent matching
- **Intent Recognition**: Specialized blood donation intent detection
- **1000+ Q&A Dataset**: Comprehensive blood donation knowledge base
- **REST API**: Simple Flask API for integration

## API Endpoints

### POST /chat
Main chat endpoint

**Request:**
```json
{
  "message": "How long should I wait between blood donations?"
}
```

**Response:**
```json
{
  "reply": "The standard interval between whole blood donations is 56 days (8 weeks)..."
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "blood-donation-chatbot"
}
```

## Deployment

### Railway (Recommended)
1. Push to GitHub
2. Connect to Railway
3. Auto-deploys from railway.json

### Local Development
```bash
pip install -r requirements.txt
python chatbot_api.py
```

## Model Details
- **Model**: all-MiniLM-L6-v2
- **Dataset**: 1000+ blood donation Q&A pairs
- **Embeddings**: Pre-computed for fast response
- **Intent Matching**: Specialized blood donation contexts

## Hosting URLs
- **Production**: [Your Railway URL]
- **Health Check**: [Your Railway URL]/health
