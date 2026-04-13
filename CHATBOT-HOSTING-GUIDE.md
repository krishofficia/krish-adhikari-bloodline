# Chatbot Hosting Guide

## Overview
Host your advanced blood donation chatbot with sentence-transformers and NLP capabilities.

## Hosting Options

### Option 1: Railway (Recommended) 
Best for ML models with dependencies

#### Step 1: Prepare Chatbot for Railway
```bash
cd "C:\Users\DELL\Desktop\Bloodline Web App\Chatbot"
git init
git add .
git commit -m "Initial chatbot deployment"
```

#### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" > "Deploy from GitHub repo"
4. Select your chatbot repo
5. Railway will auto-detect Python app
6. Set environment variables (if needed)

#### Step 3: Get Your URL
After deployment, Railway gives you a URL like:
`https://bloodline-chatbot.up.railway.app`

#### Step 4: Update Backend
In your backend `.env`:
```
CHATBOT_URL=https://bloodline-chatbot.up.railway.app
```

#### Step 5: Redeploy Backend
Push changes to trigger backend redeployment.

---

### Option 2: Render
Same platform as your backend

#### Step 1: Create render.yaml
```yaml
services:
  - type: web
    name: bloodline-chatbot
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: python chatbot_api.py
    healthCheckPath: /health
```

#### Step 2: Deploy
1. Push Chatbot folder to GitHub
2. Go to Render dashboard
3. "New +" > "Web Service"
4. Connect GitHub repo
5. Select Chatbot folder
6. Deploy

---

### Option 3: Vercel
Serverless option

#### Step 1: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "chatbot_api.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "chatbot_api.py"
    }
  ]
}
```

#### Step 2: Deploy
```bash
npm i -g vercel
vercel --prod
```

---

## File Structure for Hosting

```
Chatbot/
|-- chatbot_api.py          # Main Flask app
|-- requirements.txt        # Dependencies
|-- railway.json           # Railway config
|-- .gitignore            # Git ignore file
|-- README.md             # Documentation
|-- blood_donation_1000_qa.csv  # Dataset
|-- question_embeddings.npy     # Pre-computed embeddings
```

## Environment Variables

### Railway
Set in Railway dashboard:
- No additional variables needed

### Render
Set in Render dashboard:
- No additional variables needed

### Backend (.env)
```
CHATBOT_URL=https://your-chatbot-url.railway.app
```

## Testing Your Hosted Chatbot

### 1. Health Check
```bash
curl https://your-chatbot-url.railway.app/health
```

### 2. Chat Test
```bash
curl -X POST https://your-chatbot-url.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How long to wait between donations?"}'
```

### 3. Full Integration Test
1. Open your Bloodline web app
2. Go to chatbot page
3. Ask a blood donation question
4. Should get intelligent response

## Troubleshooting

### Railway Issues
- Check logs in Railway dashboard
- Ensure all files are uploaded
- Verify requirements.txt is complete

### Model Loading Issues
- Large models may need more RAM
- Railway free tier: 512MB RAM
- Consider upgrading if needed

### Cold Starts
- Vercel may have cold starts
- Railway is "always on"
- Render has moderate cold starts

## Performance Tips

### 1. Model Optimization
```python
# Pre-load model outside of requests
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = np.load("question_embeddings.npy")
```

### 2. Caching
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_response(question):
    return chatbot_answer(question)
```

### 3. Health Monitoring
```python
@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'embeddings_loaded': embeddings is not None
    })
```

## Costs

### Railway (Recommended)
- Free: $0/month (512MB RAM, 1GB storage)
- Pro: $5/month (1GB RAM, 10GB storage)

### Render
- Free: $0/month (512MB RAM, 750MB storage)
- Starter: $7/month (1GB RAM, 10GB storage)

### Vercel
- Free: $0/month (serverless)
- Pro: $20/month (more resources)

## Security Considerations

1. **API Rate Limiting**: Add rate limiting to prevent abuse
2. **Input Validation**: Sanitize user inputs
3. **HTTPS**: Always use HTTPS in production
4. **Monitoring**: Monitor for unusual activity

## Monitoring

Add monitoring endpoints:
```python
@app.route('/metrics')
def metrics():
    return jsonify({
        'requests_served': request_count,
        'average_response_time': avg_time,
        'error_rate': error_rate
    })
```

## Next Steps

1. Choose hosting platform (Railway recommended)
2. Deploy chatbot
3. Update backend CHATBOT_URL
4. Test integration
5. Monitor performance
6. Scale if needed

Your advanced chatbot will be serving intelligent blood donation responses 24/7!
