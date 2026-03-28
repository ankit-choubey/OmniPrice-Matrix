# Buylo - Deployment Guide

## 📋 Overview
This guide walks through deploying Buylo with Firebase Firestore backend, Firecrawl real-time pricing, and Groq LLM predictions.

### Tech Stack
- **Frontend:** Next.js 16.2.1 + React + Framer Motion (Deployed on Vercel)
- **Backend:** FastAPI + Firebase Admin SDK (Can be deployed on Cloud Run)
- **Database:** Firebase Firestore (Real-time, auto-scaling)
- **APIs:** Firecrawl (web scraping), Groq (LLM predictions)
- **Region:** asia-south1 (India)

---

## 🔑 Step 1: Get API Keys

### Firecrawl API Key
1. Visit https://app.firecrawl.dev
2. Sign up (free account)
3. Go to API settings → Copy API Key
4. Free tier: 1,000 API calls/month

### Groq API Key
1. Visit https://console.groq.com/keys
2. Sign up with Google/Email
3. Create new API key
4. Free tier: 1,000 tokens/day (sufficient for MVP)

### Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project (select India region: asia-south1)
3. Enable Firestore Database
4. Enable Cloud Firestore API: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview
5. Go to Project Settings → Service Accounts
6. Click "Generate New Private Key" → Download JSON file
7. Save the credentials (needed for .env)

---

## 🛠️ Step 2: Configure Local Environment

### Backend Setup (.env)
1. Copy `.env.example` to `.env`
2. Fill in your credentials:

```bash
# Firecrawl Configuration
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Groq LLM Configuration
GROQ_API_KEY=your_groq_api_key_here

# Firebase Configuration (from Service Account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=../buylo-xxxxx-firebase-adminsdk-xxxxx.json
# Optional alternative: set FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY,
# FIREBASE_CLIENT_EMAIL and FIREBASE_CLIENT_ID directly instead of file path.
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# Database (local SQLite)
DATABASE_URL=sqlite:///buylo.db

# API
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### Install Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

---

## 🏃 Step 3: Run Locally

### Terminal 1: Start Backend
```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check health: `curl http://localhost:8000/health`

### Terminal 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## ✅ Step 4: Test Features

### 1. Real-Time Prices
```bash
curl "http://localhost:8000/api/real-time-prices?query=Sony%20WH-1000XM5"
```

### 2. Wait vs Buy Recommendation
```bash
curl -X POST "http://localhost:8000/api/wait-vs-buy?query=Nike%20shoes"
```

### 3. Food Prices
```bash
curl "http://localhost:8000/api/food-prices?query=pizza%20combo"
```

### 4. Category Trends
```bash
curl "http://localhost:8000/api/category-trends?category=electronics"
```

### 5. Price History
```bash
curl "http://localhost:8000/api/price-history?query=Sony%20WH-1000XM5&days=30"
```

---

## 🚀 Step 5: Deploy to Production

### Option A: Deploy Frontend to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel deploy --prod
```

The frontend will auto-deploy on every git push to main branch.

### Option B: Deploy Backend to Google Cloud Run

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Create Dockerfile (use existing one in backend/)
# Build and deploy
gcloud run deploy buylo-backend \
  --source . \
  --runtime python311 \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "FIRECRAWL_API_KEY=xxx,GROQ_API_KEY=xxx,FIREBASE_PROJECT_ID=xxx"
```

### Step-by-Step Alternative: Docker + Railway

1. Install Docker Desktop
2. Build image:
```bash
cd backend
docker build -t buylo-backend .
```

3. Deploy to Railway (https://railway.app/):
   - Connect GitHub
   - Select backend directory
   - Add environment variables
   - Deploy

---

## 🔄 Implementation Checklist

- [x] Firebase Firestore schema created
- [x] Cloud Functions endpoints in FastAPI
- [x] Firecrawl price extraction
- [x] Groq LLM predictions
- [x] Food scraper (Swiggy, Zomato, Instamart)
- [x] Frontend toast notifications
- [x] Real-time React hooks
- [x] Watchlist component
- [x] Reminders system
- [x] Category trends analysis

---

## 📊 5 MVP Features Deployed

### 1. ✅ Smart Wait vs Buy Card
Shows confidence-based recommendation (BUY_NOW/WAIT/UNCERTAIN)
- Uses Groq to analyze 30-day price history
- Shows expected drop percentage
- Direct action buttons

### 2. ✅ Execute Toast Animation
Non-blocking notification badge showing phases:
- 🔍 Scanning Stores
- 🧠 Extracting Prices
- 📊 Analyzing Trends
- ✓ Complete

### 3. ✅ Smart Reminder Toast
When price target hits:
- Shows which stores have the price
- Direct "Buy Now" links to each store
- Displays savings from target

### 4. ✅ Real-Time Price Tracking
- Firecrawl extracts actual prices from Amazon, Flipkart, Myntra, Croma
- 4 stores checked in parallel (~10 seconds)
- Results saved to Firestore for history

### 5. ✅ Food & Delivery Prices
- Tracks "pizza combo" on Swiggy/Zomato
- Grocery prices on Instamart/Zepto
- Auto-detects category from query

---

## 🎯 Environment Variables Reference

| Variable | Source | Format |
|----------|--------|--------|
| FIRECRAWL_API_KEY | https://app.firecrawl.dev | Bearer token |
| GROQ_API_KEY | https://console.groq.com | Bearer token |
| FIREBASE_PROJECT_ID | Firebase Console | your-project-123 |
| FIREBASE_PRIVATE_KEY | Service Account JSON | Multi-line, keep \n |

**Note:** Keep these secrets safe! Never commit to git.

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check port
lsof -i :8000  # Kill if needed: kill -9 <PID>
```

### Firecrawl timeout
- Free tier has rate limits (1,000/month)
- Check usage: https://app.firecrawl.dev/dashboard
- Fallback to cached prices works automatically

### Groq API errors
- Verify API key is correct
- Check quota: https://console.groq.com
- Token usage shows at bottom of console

### Firebase connection error
- Verify `.env` has all Firebase variables
- Test with: `curl http://localhost:8000/api/test-firebase`
- Check service account JSON format

---

## 📈 Scaling Tips

1. **Database:** Firestore auto-scales. At 50 users, costs ~$0-5/month
2. **API Calls:** 
   - Firecrawl: ration requests (cache prices 6 hours)
   - Groq: queue predictions (not real-time)
3. **Backend:** Cloud Run scales to 0 when idle (cost ~$0 for MVP)
4. **Frontend:** Vercel free tier handles 50+ users

---

## 📞 Support

- **Firebase Issues:** https://firebase.google.com/docs
- **Firecrawl Docs:** https://docs.firecrawl.dev
- **Groq Docs:** https://console.groq.com/docs
- **FastAPI:** https://fastapi.tiangolo.com/
- **Next.js:** https://nextjs.org/docs

---

## ✨ Next Steps After Deployment

1. Set up daily price fetch scheduler (every 6 hours)
2. Add user authentication (Firebase Auth)
3. Create backend reminder trigger on price hits
4. Add email notifications
5. Expand to more stores/categories
6. Mobile app (React Native)

---

**Status:** Production-Ready MVP ✓

All endpoints tested and working. Ready for users!
