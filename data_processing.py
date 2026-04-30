# Cleans & aggregates raw social media API data using Pandas.
# Flow: API clients fetch → this file processes → PostgreSQL stores


import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional


# ── 1. Clean raw API data (Pandas DataFrame operations) ──

def clean_posts_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean a raw DataFrame of posts fetched from any social media API.
    Handles missing values, wrong data types, and duplicate rows.
    """
    if df.empty:
        return df

    # Fill missing numeric values with 0
    numeric_cols = ["likes", "comments", "shares", "saves", "reach", "impressions", "views"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    # Parse post_date to datetime if it's a string
    if "post_date" in df.columns:
        df["post_date"] = pd.to_datetime(df["post_date"], errors="coerce", utc=True)
        df = df.dropna(subset=["post_date"])   # Drop rows with invalid dates

    # Remove duplicate posts (can happen if API calls overlap)
    if "post_id" in df.columns:
        df = df.drop_duplicates(subset=["post_id"], keep="last")

    # Standardise content_type to lowercase
    if "content_type" in df.columns:
        df["content_type"] = df["content_type"].str.lower().fillna("unknown")

    return df.reset_index(drop=True)


# ── 2. Calculate engagement rate ──

def calculate_engagement_rate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pandas calculate: engagement_rate = (likes + comments + shares) / impressions * 100
    This metric is NOT provided directly by any API — we calculate it ourselves.
    """
    if df.empty:
        return df

    total_eng = df["likes"] + df["comments"] + df["shares"]
    impressions_safe = df["impressions"].replace(0, np.nan)   # Avoid division by zero
    df["engagement_rate"] = (total_eng / impressions_safe * 100).round(2).fillna(0)
    return df


# ── 3. Aggregate metrics by platform ──

def aggregate_by_platform(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pandas groupby().agg() — summarise all posts grouped by platform.
    Returns one row per platform with total and average metrics.

    This is equivalent to the SQL:
      SELECT platform, SUM(likes), AVG(engagement_rate), COUNT(*) ...
      FROM posts GROUP BY platform
    But written in Pandas instead of SQL.
    """
    if df.empty:
        return pd.DataFrame()

    agg = df.groupby("platform").agg(
        total_posts     =("post_id",        "count"),
        total_likes     =("likes",          "sum"),
        total_comments  =("comments",       "sum"),
        total_shares    =("shares",         "sum"),
        total_saves     =("saves",          "sum"),
        total_reach     =("reach",          "sum"),
        total_impressions=("impressions",   "sum"),
        total_views     =("views",          "sum"),
        avg_engagement  =("engagement_rate","mean"),
    ).reset_index()

    agg["avg_engagement"] = agg["avg_engagement"].round(2)
    return agg


# ── 4. Daily time series (resample) ──

def resample_daily(df: pd.DataFrame, platform: Optional[str] = None) -> pd.DataFrame:
    """
    Pandas resample("D").sum() — aggregate metrics by day.
    Used to draw the engagement trend line chart on the dashboard.

    If platform is given, filter to just that platform first.
    """
    if df.empty:
        return pd.DataFrame()

    if platform:
        df = df[df["platform"] == platform].copy()

    if df.empty:
        return pd.DataFrame()

    df = df.set_index("post_date")

    # resample("D") groups all rows for the same calendar day
    daily = df[["likes","comments","shares","reach","views"]].resample("D").sum()
    daily["engagement"] = daily["likes"] + daily["comments"] + daily["shares"]
    daily = daily.reset_index()
    daily["date"] = daily["post_date"].dt.strftime("%m-%d")
    return daily


# ── 5. Content type breakdown ──

def content_type_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pandas value_counts() style groupby — how many posts per content type,
    and average engagement per type.
    """
    if df.empty:
        return pd.DataFrame()

    breakdown = df.groupby("content_type").agg(
        count       =("post_id",        "count"),
        avg_likes   =("likes",          "mean"),
        avg_comments=("comments",       "mean"),
        avg_eng     =("engagement_rate","mean"),
    ).reset_index()

    breakdown["avg_likes"]    = breakdown["avg_likes"].round(0).astype(int)
    breakdown["avg_comments"] = breakdown["avg_comments"].round(0).astype(int)
    breakdown["avg_eng"]      = breakdown["avg_eng"].round(2)
    return breakdown.sort_values("avg_eng", ascending=False)


# ── 6. Best hours analysis ──

def best_hours_analysis(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract the hour from each post's timestamp, then group by hour
    to find which hours produce the most engagement.
    """
    if df.empty:
        return pd.DataFrame()

    df = df.copy()
    df["hour"] = df["post_date"].dt.hour
    df["engagement"] = df["likes"] + df["comments"] + df["shares"]

    hourly = df.groupby("hour").agg(
        avg_engagement=("engagement", "mean"),
        post_count    =("post_id",    "count"),
    ).reset_index()

    hourly["avg_engagement"] = hourly["avg_engagement"].round(0).astype(int)

    # Format hour as "9am", "2pm" etc.
    def fmt_hour(h):
        if h == 0:   return "12am"
        if h < 12:   return f"{h}am"
        if h == 12:  return "12pm"
        return f"{h-12}pm"

    hourly["hour_label"] = hourly["hour"].apply(fmt_hour)
    return hourly.sort_values("hour")


# ── 7. Hashtag performance ──

def hashtag_performance(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract hashtags from post captions using Pandas string methods,
    then aggregate reach per hashtag.
    """
    if df.empty or "caption" not in df.columns:
        return pd.DataFrame()

    df = df.copy()

    # Extract all hashtags from captions using regex
    df["hashtags"] = df["caption"].str.findall(r"#\w+")

    # Explode so each hashtag gets its own row
    exploded = df.explode("hashtags").dropna(subset=["hashtags"])

    if exploded.empty:
        return pd.DataFrame()

    tag_agg = exploded.groupby("hashtags").agg(
        total_reach=("reach", "sum"),
        post_count =("post_id","count"),
    ).reset_index()

    tag_agg.columns = ["tag", "reach", "posts"]
    return tag_agg.sort_values("reach", ascending=False).head(10)
