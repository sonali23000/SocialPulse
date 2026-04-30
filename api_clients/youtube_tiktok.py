# ============================================================
#  api_clients/youtube.py — YouTube Data API v3
# ============================================================

import requests
import os
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_BASE    = "https://www.googleapis.com/youtube/v3"


def _get(endpoint: str, params: dict = None) -> dict:
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not set in your .env file")
    all_params = {"key": YOUTUBE_API_KEY}
    if params:
        all_params.update(params)
    response = requests.get(f"{YOUTUBE_BASE}/{endpoint}", params=all_params, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_youtube_channel(channel_id: str) -> dict:
    """Fetch YouTube channel subscriber count and basic info."""
    data = _get("channels", params={
        "part": "snippet,statistics",
        "id": channel_id
    })
    items = data.get("items", [])
    if not items:
        return {}
    ch = items[0]
    stats = ch.get("statistics", {})
    return {
        "platform":  "YouTube",
        "handle":    ch.get("snippet", {}).get("title", ""),
        "followers": int(stats.get("subscriberCount", 0)),
        "views":     int(stats.get("viewCount", 0)),
        "videos":    int(stats.get("videoCount", 0)),
    }


def fetch_youtube_videos(channel_id: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch recent YouTube video statistics.
    Uses the search endpoint to find videos, then gets stats for each.
    Returns a cleaned Pandas DataFrame.
    """
    published_after = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Step 1: Search for recent uploads
    search = _get("search", params={
        "part": "snippet",
        "channelId": channel_id,
        "type": "video",
        "publishedAfter": published_after,
        "maxResults": 50,
        "order": "date",
    })

    video_ids = [item["id"]["videoId"] for item in search.get("items", [])]
    if not video_ids:
        return pd.DataFrame()

    # Step 2: Get statistics for all videos in one request (efficient)
    stats_data = _get("videos", params={
        "part": "snippet,statistics",
        "id": ",".join(video_ids),
    })

    rows = []
    for item in stats_data.get("items", []):
        stats = item.get("statistics", {})
        rows.append({
            "platform":     "YouTube",
            "post_id":      item["id"],
            "caption":      item.get("snippet", {}).get("title", "")[:200],
            "content_type": "video",
            "post_date":    item.get("snippet", {}).get("publishedAt", ""),
            "likes":        int(stats.get("likeCount", 0)),
            "comments":     int(stats.get("commentCount", 0)),
            "shares":       0,
            "saves":        int(stats.get("favoriteCount", 0)),
            "reach":        0,
            "impressions":  0,
            "views":        int(stats.get("viewCount", 0)),
        })

    if not rows:
        return pd.DataFrame()

    # Step 3: Pandas cleans and structures the data
    df = pd.DataFrame(rows)
    df["post_date"] = pd.to_datetime(df["post_date"])
    df = df.drop_duplicates(subset=["post_id"])
    df = df.sort_values("post_date", ascending=False)
    return df


# ============================================================
#  api_clients/tiktok.py — TikTok Research API
# ============================================================

TIKTOK_BASE  = "https://open.tiktokapis.com/v2"
TIKTOK_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "")


def fetch_tiktok_account(username: str) -> dict:
    """
    Fetch TikTok account follower count and stats.
    Requires TikTok Research API access (apply at developers.tiktok.com).
    """
    if not TIKTOK_TOKEN:
        raise ValueError("TIKTOK_ACCESS_TOKEN is not set in your .env file")

    headers = {"Authorization": f"Bearer {TIKTOK_TOKEN}"}
    response = requests.post(
        f"{TIKTOK_BASE}/user/info/",
        headers=headers,
        json={"fields": ["display_name", "follower_count", "video_count", "like_count"]},
        timeout=10
    )
    response.raise_for_status()
    data = response.json().get("data", {}).get("user", {})
    return {
        "platform":  "TikTok",
        "handle":    f"@{username}",
        "followers": data.get("follower_count", 0),
        "videos":    data.get("video_count", 0),
    }


def fetch_tiktok_videos(username: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch TikTok video metrics via the Research API.
    Returns a cleaned Pandas DataFrame with views, likes, comments, shares.
    """
    if not TIKTOK_TOKEN:
        raise ValueError("TIKTOK_ACCESS_TOKEN is not set in your .env file")

    from datetime import datetime, timedelta
    start = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
    end   = datetime.now().strftime("%Y%m%d")

    headers = {"Authorization": f"Bearer {TIKTOK_TOKEN}"}
    response = requests.post(
        f"{TIKTOK_BASE}/research/video/query/",
        headers=headers,
        json={
            "query": {"and": [{"operation": "EQ", "field_name": "username", "field_values": [username]}]},
            "start_date": start,
            "end_date":   end,
            "fields":     ["id", "create_time", "desc", "like_count", "comment_count", "share_count", "view_count"],
            "max_count":  100,
        },
        timeout=15
    )
    response.raise_for_status()
    videos = response.json().get("data", {}).get("videos", [])

    if not videos:
        return pd.DataFrame()

    rows = []
    for v in videos:
        rows.append({
            "platform":     "TikTok",
            "post_id":      v.get("id", ""),
            "caption":      v.get("desc", "")[:200],
            "content_type": "short",
            "post_date":    datetime.fromtimestamp(v.get("create_time", 0)),
            "likes":        v.get("like_count", 0),
            "comments":     v.get("comment_count", 0),
            "shares":       v.get("share_count", 0),
            "saves":        0,
            "reach":        0,
            "impressions":  0,
            "views":        v.get("view_count", 0),
        })

    # Pandas cleaning
    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["post_id"])
    df = df.sort_values("post_date", ascending=False)
    return df
