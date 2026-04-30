# ============================================================
#  routes/analytics.py — Dashboard analytics endpoints
#
#  These are the API endpoints the React frontend calls.
#  Each function:
#    1. Checks Redis cache first
#    2. If cache miss → queries PostgreSQL via SQLAlchemy
#    3. Processes data with Pandas
#    4. Saves result to Redis for next request
#    5. Returns JSON to the React frontend
# ============================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd

from database import get_db, Post, Account
from cache import cache_get, cache_set
from data_processing import (
    clean_posts_dataframe, calculate_engagement_rate,
    aggregate_by_platform, resample_daily,
    content_type_breakdown, best_hours_analysis, hashtag_performance
)

router = APIRouter()


def _load_posts_df(db: Session, platform: str = None) -> pd.DataFrame:
    """
    SQLAlchemy query → Pandas DataFrame conversion.
    Fetches posts from PostgreSQL and returns them as a DataFrame.
    """
    query = db.query(Post)
    if platform:
        query = query.filter(Post.platform == platform)

    posts = query.all()
    if not posts:
        return pd.DataFrame()

    # Convert SQLAlchemy model objects to a list of dicts, then to DataFrame
    rows = [{
        "post_id":      p.id,
        "platform":     p.platform,
        "post_date":    p.post_date,
        "caption":      p.caption or "",
        "content_type": p.content_type or "unknown",
        "likes":        p.likes,
        "comments":     p.comments,
        "shares":       p.shares,
        "saves":        p.saves,
        "reach":        p.reach,
        "impressions":  p.impressions,
        "views":        p.views,
    } for p in posts]

    df = pd.DataFrame(rows)
    df = clean_posts_dataframe(df)
    df = calculate_engagement_rate(df)
    return df


@router.get("/overview")
def get_overview(platform: str = None, db: Session = Depends(get_db)):
    """
    Returns KPI summary numbers for the Overview page.
    Used by: StatCard components in the React frontend.
    """
    cache_key = f"overview_{platform or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db, platform)
    if df.empty:
        return {"data": {}, "cache": False}

    total_followers = sum(
        a.followers for a in db.query(Account).all()
        if not platform or a.platform == platform
    )

    result = {
        "total_followers": total_followers,
        "total_likes":     int(df["likes"].sum()),
        "total_comments":  int(df["comments"].sum()),
        "total_shares":    int(df["shares"].sum()),
        "total_saves":     int(df["saves"].sum()),
        "total_reach":     int(df["reach"].sum()),
        "total_views":     int(df["views"].sum()),
        "avg_engagement_rate": float(df["engagement_rate"].mean().round(2)),
        "total_posts":     len(df),
    }

    cache_set(cache_key, result, ttl=60)
    return {"data": result, "cache": False}


@router.get("/timeseries")
def get_timeseries(platform: str = None, db: Session = Depends(get_db)):
    """
    Returns daily engagement data for the trend line chart.
    Used by: AreaChart on the Overview and Platforms pages.
    """
    cache_key = f"timeseries_{platform or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db, platform)
    daily = resample_daily(df, platform)

    if daily.empty:
        return {"data": [], "cache": False}

    result = daily[["date","likes","comments","shares","reach","views","engagement"]].to_dict(orient="records")
    cache_set(cache_key, result, ttl=60)
    return {"data": result, "cache": False}


@router.get("/platforms")
def get_platform_breakdown(db: Session = Depends(get_db)):
    """
    Returns engagement totals grouped by platform.
    Used by: PieChart on the Overview page.
    """
    cache_key = "platform_breakdown"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db)
    agg = aggregate_by_platform(df)

    if agg.empty:
        return {"data": [], "cache": False}

    result = agg.to_dict(orient="records")
    cache_set(cache_key, result, ttl=60)
    return {"data": result, "cache": False}


@router.get("/content-types")
def get_content_types(platform: str = None, db: Session = Depends(get_db)):
    """
    Returns average engagement per content type (image, video, reel…).
    Used by: Horizontal BarChart on Overview page.
    """
    cache_key = f"content_types_{platform or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db, platform)
    breakdown = content_type_breakdown(df)

    result = breakdown.to_dict(orient="records") if not breakdown.empty else []
    cache_set(cache_key, result, ttl=60)
    return {"data": result, "cache": False}


@router.get("/best-hours")
def get_best_hours(db: Session = Depends(get_db)):
    """
    Returns which hours of the day get the most engagement.
    Used by: Bar chart on Insights page.
    """
    cache_key = "best_hours"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db)
    hours = best_hours_analysis(df)

    result = hours[["hour_label","avg_engagement","post_count"]].to_dict(orient="records") if not hours.empty else []
    cache_set(cache_key, result, ttl=300)   # Cache for 5 minutes (changes slowly)
    return {"data": result, "cache": False}


@router.get("/hashtags")
def get_hashtags(db: Session = Depends(get_db)):
    """
    Returns hashtag reach performance.
    Used by: Hashtag bar chart on Insights page.
    """
    cache_key = "hashtags"
    cached = cache_get(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    df = _load_posts_df(db)
    tags = hashtag_performance(df)

    result = tags.to_dict(orient="records") if not tags.empty else []
    cache_set(cache_key, result, ttl=300)
    return {"data": result, "cache": False}
