
#  SocialPulse 
#  Tools used here:
#   FastAPI    Python web server 
#    Pandas     Data cleaning and aggregation
#    SQLAlchemy  Connects Python to PostgreSQL database
#   Redis       Caching to speed up dashboard loads
#   Requests    Makes HTTP calls to social media APIs


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import engine, Base
from routes import analytics, platforms

# Create all PostgreSQL tables (via SQLAlchemy models)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SocialPulse API",
    description="Backend for the SocialPulse digital analytics platform",
    version="1.0.0"
)

# Allow the React frontend (localhost:3000) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route groups
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(platforms.router, prefix="/api/platforms", tags=["Platforms"])



@app.get("/")
def root():
    return {"message": "SocialPulse API is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Run the server directly with: python main.py
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
