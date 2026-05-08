# SocialPulse — Frontend

A React-based analytics dashboard for social media creators and brands. Built with Vite for fast development and hot module replacement.

## What This Frontend Does

SocialPulse frontend gives you a clean dashboard to monitor your social media performance across Instagram, Facebook, LinkedIn, YouTube and TikTok — all in one place.

It has 4 main pages:

- **Overview** — shows total followers, likes, comments, shares, saves, reach, video views and engagement rate. Also includes an engagement trend chart for the last 100 days, platform share pie chart, and best content format breakdown.
- **Platforms** — lets you switch between platforms and see per-platform stats like followers and growth.
- **Growth Tips** — practical tips for going viral, growing reach, riding trends, and beauty/makeup creator specific advice.
- **Packages** — pricing plans (Starter, Pro, Business, Enterprise) with monthly/annual billing toggle.


## Tech Stack

- React 19
- Vite 8
- Recharts (for all charts — area, bar, pie, line)
- Lucide React (icons)

## How to Run

Make sure you have Node.js installed, then:


cd frontend
npm install
npm run dev


The app runs on `http://localhost:5173` by default.

> The frontend connects to the backend at `http://localhost:8000` — make sure the Python backend is also running or there will be a connection error.

## Folder Structure
frontend/
├── src/
│   ├── App.jsx        # All pages and components live here
│   ├── App.css        # Global styles
│   ├── main.jsx       # React entry point
│   └── assets/        # Images and icons
├── index.html
├── vite.config.js
└── package.json

## Notes

- All 4 pages and reusable components are in `App.jsx`
- Backend API base URL is set as `const API = "http://localhost:8000"` — change this if your backend runs on a different port.