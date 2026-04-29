# SocialPulse — Python Backend

Backend for the SocialPulse digital & social media analytics platform.  
Bachelor's Thesis 2026 · Sonali Mitua · Degree Programme in Computer Applications

---

## Tools Used

| Tool | Purpose |
|---|---|
| **Python / FastAPI** | Creates the API endpoints the React frontend calls |
| **Pandas** | Cleans raw API data, calculates engagement rates, aggregates metrics |
| **SQLAlchemy** | Connects Python to PostgreSQL without writing raw SQL |
| **PostgreSQL** | Stores all posts, accounts, and metrics in relational tables |
| **Redis** | Caches dashboard data in memory for fast page loads |
| **Meta Graph API** | Fetches Instagram + Facebook post stats |
| **LinkedIn API** | Fetches LinkedIn company page analytics |
| **YouTube Data API v3** | Fetches YouTube channel + video statistics |
| **TikTok Research API** | Fetches TikTok video metrics |

---

## Project Structure

```
socialpulse-backend/
├── main.py               # FastAPI app entry point
├── database.py           # SQLAlchemy models + PostgreSQL connection
├── data_processing.py    # Pandas data cleaning & aggregation
├── cache.py              # Redis caching utilities
├── scheduler.py          # Automated data fetch (runs every 6 hours)
├── requirements.txt      # Python package dependencies
├── .env.example          # Template for your API keys (copy → .env)
├── routes/
│   ├── analytics.py      # /api/analytics/* endpoints
│   ├── platforms.py      # /api/platforms/* endpoints
│   ├── posts.py          # /api/posts/* endpoints
│   └── packages.py       # /api/packages/* endpoints
└── api_clients/
    ├── meta.py           # Meta Graph API (Instagram + Facebook)
    ├── linkedin.py       # LinkedIn API
    └── youtube_tiktok.py # YouTube Data API v3 + TikTok Research API
```

---

## How to Run

**1. Install Python packages**
```bash
pip install -r requirements.txt
```

**2. Set up your environment variables**
```bash
cp .env.example .env
# Then open .env and fill in your real API keys
```

**3. Start PostgreSQL and Redis**
Make sure PostgreSQL and Redis are running on your machine.

**4. Start the API server**
```bash
python main.py
```
The API will be available at: http://localhost:8000

**5. Start the data scheduler (in a separate terminal)**
```bash
python scheduler.py
```
This fetches fresh data from all APIs every 6 hours.

**6. View the API docs**
FastAPI generates automatic documentation at:  
http://localhost:8000/docs

---

## How It All Connects

```
Social Media APIs
(Instagram, Facebook, LinkedIn, YouTube, TikTok)
        ↓
   Python (scheduler.py)
   calls APIs every 6h
        ↓
   Pandas (data_processing.py)
   cleans & calculates engagement rates
        ↓
   SQLAlchemy (database.py)
   saves to PostgreSQL
        ↓
   Redis (cache.py)
   caches for fast loads
        ↓
   FastAPI (main.py + routes/)
   serves JSON to React frontend
        ↓
   React (SocialAnalyticsPlatform.jsx)
   displays dashboard to user
```
