
# database.py — SQLAlchemy + PostgreSQL setup
# SQLAlchemy lets Python talk to PostgreSQL using objects instead of raw SQL.
# DATABASE_URL is loaded from .env so credentials stay out of the code.


from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()  

# PostgreSQL connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:sonali123@localhost:5432/socialpulse"
)

# Create the SQLAlchemy engine (the actual connection to PostgreSQL)
engine = create_engine(DATABASE_URL)

# SessionLocal is used to open/close database sessions in routes
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all database models inherit from
Base = declarative_base()


# Dependency: gives each route its own DB session 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



#  DATABASE MODELS (SQLAlchemy ORM)
#  Each class = one table in PostgreSQL


class Account(Base):
    """
    Stores the connected social media accounts.
    One row = one platform account (e.g. @sonali.brand on Instagram)
    """
    __tablename__ = "accounts"

    id         = Column(Integer, primary_key=True, index=True)
    platform   = Column(String, nullable=False)       
    handle     = Column(String, nullable=False)       
    followers  = Column(Integer, default=0)
    growth     = Column(Integer, default=0)           
    api_source = Column(String)                       
    created_at = Column(DateTime, default=datetime.utcnow)


class Post(Base):
    """
    Stores individual post metrics fetched from each platform's API.
    Python fetches these daily and saves them here via SQLAlchemy.
    """
    __tablename__ = "posts"

    id           = Column(Integer, primary_key=True, index=True)
    account_id   = Column(Integer, nullable=False)
    platform     = Column(String, nullable=False)
    post_date    = Column(DateTime, nullable=False)
    caption      = Column(String)
    content_type = Column(String)   # image, video, carousel, reel, short
    likes        = Column(Integer, default=0)
    comments     = Column(Integer, default=0)
    shares       = Column(Integer, default=0)
    saves        = Column(Integer, default=0)
    reach        = Column(Integer, default=0)
    impressions  = Column(Integer, default=0)
    views        = Column(Integer, default=0)   # for video content
    fetched_at   = Column(DateTime, default=datetime.utcnow)


class Hashtag(Base):
    """
    Stores hashtag performance data.
    Joined with posts table for hashtag analytics.
    """
    __tablename__ = "hashtags"

    id      = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, nullable=False)
    tag     = Column(String, nullable=False)
    reach   = Column(Integer, default=0)


class Package(Base):
    """
    Stores the pricing plans for the Packages page.
    """
    __tablename__ = "packages"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)     # "Starter", "Pro", etc.
    monthly_eur  = Column(Float, default=0)
    annual_eur   = Column(Float, default=0)
    max_platforms= Column(Integer, default=2)
    max_posts    = Column(Integer, default=500)
    max_users    = Column(Integer, default=1)
    is_popular   = Column(Boolean, default=False)
