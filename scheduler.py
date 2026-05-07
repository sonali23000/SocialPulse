
#  scheduler.py — Automated daily data fetching

#  This script runs in the background and calls all 5 social

#  media APIs every 6 hours to fetch fresh data.



import schedule
import time
import os
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

from database import SessionLocal, Post, Account
from data_processing import clean_posts_dataframe, calculate_engagement_rate
from cache import cache_delete

load_dotenv()

# Account IDs 
IG_USER_ID   = os.getenv("INSTAGRAM_USER_ID", "")
FB_PAGE_ID   = os.getenv("FACEBOOK_PAGE_ID", "")
LI_ORG_ID    = os.getenv("LINKEDIN_ORG_ID", "")
YT_CHANNEL   = os.getenv("YOUTUBE_CHANNEL_ID", "")
TT_USERNAME  = os.getenv("TIKTOK_USERNAME", "")


def save_posts_to_db(df: pd.DataFrame, db):
    """
    SQLAlchemy incremental save.
    Only inserts NEW posts — never overwrites existing ones.
    This preserves historical data for trend analysis.
    """
    if df.empty:
        return 0

    saved = 0
    for _, row in df.iterrows():
        # Check if this post already exists in PostgreSQL
        exists = db.query(Post).filter(
            Post.platform == row["platform"],
            Post.post_date == row["post_date"],
            Post.caption == row.get("caption", "")[:200],
        ).first()

        if not exists:
            post = Post(
                platform     = row["platform"],
                post_date    = row["post_date"],
                caption      = str(row.get("caption", ""))[:200],
                content_type = row.get("content_type", "unknown"),
                likes        = int(row.get("likes", 0)),
                comments     = int(row.get("comments", 0)),
                shares       = int(row.get("shares", 0)),
                saves        = int(row.get("saves", 0)),
                reach        = int(row.get("reach", 0)),
                impressions  = int(row.get("impressions", 0)),
                views        = int(row.get("views", 0)),
            )
            db.add(post)
            saved += 1

    db.commit()
    return saved


def fetch_all_platforms():
    """
    fetch data from all 5 APIs and save to PostgreSQL.
    Called every 6 hours by the scheduler.
    """
    print(f"\n{'='*50}")
    print(f"🔄 Starting data fetch at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")

    db = SessionLocal()
    all_frames = []

    #Instagram + Facebook (Meta Graph API) 
    if IG_USER_ID and os.getenv("META_ACCESS_TOKEN"):
        try:
            from api_clients.meta import fetch_instagram_posts
            print("📸 Fetching Instagram posts...")
            ig_df = fetch_instagram_posts(IG_USER_ID, days=30)
            ig_df = clean_posts_dataframe(ig_df)
            ig_df = calculate_engagement_rate(ig_df)
            all_frames.append(ig_df)
            print(f"Instagram: {len(ig_df)} posts fetched")
        except Exception as e:
            print(f"Instagram error: {e}")

    if FB_PAGE_ID and os.getenv("META_ACCESS_TOKEN"):
        try:
            from api_clients.meta import fetch_facebook_posts
            print(" Fetching Facebook posts...")
            fb_df = fetch_facebook_posts(FB_PAGE_ID, days=30)
            fb_df = clean_posts_dataframe(fb_df)
            fb_df = calculate_engagement_rate(fb_df)
            all_frames.append(fb_df)
            print(f"Facebook: {len(fb_df)} posts fetched")
        except Exception as e:
            print(f" Facebook error: {e}")

    #  LinkedIn API 
    if LI_ORG_ID and os.getenv("LINKEDIN_ACCESS_TOKEN"):
        try:
            from api_clients.linkedin import fetch_linkedin_posts
            print("Fetching LinkedIn posts...")
            li_df = fetch_linkedin_posts(LI_ORG_ID, days=30)
            li_df = clean_posts_dataframe(li_df)
            li_df = calculate_engagement_rate(li_df)
            all_frames.append(li_df)
            print(f"LinkedIn: {len(li_df)} posts fetched")
        except Exception as e:
            print(f"LinkedIn error: {e}")

    #  YouTube Data API v3 
    if YT_CHANNEL and os.getenv("YOUTUBE_API_KEY"):
        try:
            from api_clients.youtube_tiktok import fetch_youtube_videos
            print("Fetching YouTube videos...")
            yt_df = fetch_youtube_videos(YT_CHANNEL, days=30)
            yt_df = clean_posts_dataframe(yt_df)
            all_frames.append(yt_df)
            print(f"YouTube: {len(yt_df)} videos fetched")
        except Exception as e:
            print(f"YouTube error: {e}")

    #TikTok Research API
    if TT_USERNAME and os.getenv("TIKTOK_ACCESS_TOKEN"):
        try:
            from api_clients.youtube_tiktok import fetch_tiktok_videos
            print("🎵 Fetching TikTok videos...")
            tt_df = fetch_tiktok_videos(TT_USERNAME, days=30)
            tt_df = clean_posts_dataframe(tt_df)
            all_frames.append(tt_df)
            print(f"TikTok: {len(tt_df)} videos fetched")
        except Exception as e:
            print(f"TikTok error: {e}")

    #Save all fetched data to PostgreSQL
    total_saved = 0
    for df in all_frames:
        if not df.empty:
            saved = save_posts_to_db(df, db)
            total_saved += saved

    db.close()

    #Clear Redis cache so fresh data is served next time
    for key in ["overview_all", "timeseries_all", "platform_breakdown",
                "content_types_all", "best_hours", "hashtags", "accounts"]:
        cache_delete(key)

    print(f"\n Done! Saved {total_saved} new posts to PostgreSQL")
    print(f"Redis cache cleared — fresh data ready")
    print(f"{'='*50}\n")


#Schedule to run every 6 hours
schedule.every(6).hours.do(fetch_all_platforms)

if __name__ == "__main__":
    print("Scheduler started. Fetching now and then every 6 hours...")
    fetch_all_platforms()  
    while True:
        schedule.run_pending()
        time.sleep(60)
