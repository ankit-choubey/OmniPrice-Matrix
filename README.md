# OmniPrice Matrix

OmniPrice Matrix is an AI-assisted price intelligence platform that compares live prices across major stores, tracks trends over time, and helps users decide whether to buy now or wait.

## What This Project Includes

- Frontend: Next.js 16, React, Framer Motion, Recharts
- Backend: FastAPI, Firebase Admin SDK, Groq integration, Firecrawl integration
- Data:
  - SQLite for local price history
  - Firebase Firestore for watchlist/reminder features
- Modes:
  - Product price tracking
  - Food/Grocery showcase mode
  - Travel showcase planning mode

## Core Features

- Multi-store price matrix (Amazon, Flipkart, Myntra, Croma)
- Smart reminder system with in-app toast notifications
- AI recommendation card (wait vs buy)
- Trend visualization and spread insights
- Product-not-found detection to avoid fabricated prices
- Enhanced agent motion scan UI during search

## Repository Structure

```text
backend/    FastAPI APIs, scraping, prediction, database
frontend/   Next.js application and UI
```

## Prerequisites

- Node.js 20+
- Python 3.10+ recommended
- npm
- Playwright Chromium browser

## Quick Start (Local)

### 1. Clone

```bash
git clone https://github.com/ankit-choubey/OmniPrice-Matrix.git
cd OmniPrice-Matrix
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
cp .env.example .env
```

Fill backend `.env` values:

- `FIRECRAWL_API_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL` (default supported model)
- Firebase service credentials (`FIREBASE_*`)

Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Set frontend `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Production Build Checks

Frontend:

```bash
cd frontend
npm run build
```

Backend syntax check:

```bash
cd backend
source .venv/bin/activate
python -m py_compile main.py scraper.py firecrawl_scraper.py groq_predictor.py
```

## API Smoke Test Examples

```bash
curl "http://127.0.0.1:8000/api/scrape-matrix?query=iphone%2015"
curl "http://127.0.0.1:8000/api/scrape-matrix?query=zzzxxyyqqqnonexistentmodel91919"
```

Expected behavior:

- Valid product query: returns `exists: true` with available prices
- Non-existent query: returns `exists: false` with not-found message

## Deployment

Detailed production deployment guide is available in `DEPLOYMENT.md`.

Recommended stack:

- Frontend: Vercel
- Backend: Google Cloud Run

## Security and Repository Hygiene

Ignored from git:

- Service account JSON keys
- `.env` and `.env.local`
- Local Python virtualenvs
- `node_modules`, `.next`
- Local SQLite DB files

Before committing:

- Never commit `.env` values
- Never commit Firebase private key JSON
- Ensure API keys are only set in deployment environment variables

## Troubleshooting

- If backend does not start, ensure you are inside `backend/` and virtualenv is activated.
- If frontend cannot fetch backend data, verify `NEXT_PUBLIC_API_BASE_URL`.
- If scraping fails temporarily, retry with `Test Again` and verify API quotas.

## License

This repository is intended for educational and demo usage unless otherwise specified by the repository owner.
