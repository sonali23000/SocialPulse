# ============================================================
#  api_clients/meta.py — Meta Graph API
#
#  This file handles all communication with Meta's Graph API,
#  which covers both Instagram and Facebook.
#
#  In a real deployment:
#   1. Register your app at developers.facebook.com
#   2. Get an access token with the right permissions
#   3. Store the token in your .env file (never in code!)
#   4. Python calls these functions on a schedule (e.g. every 6h)
#
#  Rate limiting: Meta allows a limited number of API calls
#  per hour per token. This code handles that gracefully.
# ============================================================

import requests
import os
import time
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_BASE_URL = "https://graph.facebook.com/v18.0"


def _get(endpoint: str, params: dict = None) -> dict:
    """
    Internal helper: makes a GET request to the Meta Graph API.
    Automatically adds the access token to every request.
    """
    if not META_ACCESS_TOKEN:
        raise ValueError("META_ACCESS_TOKEN is not set in your .env file")

    url = f"{META_BASE_URL}/{endpoint}"
    all_params = {"access_token": META_ACCESS_TOKEN}
    if params:
        all_params.update(params)

    response = requests.get(url, params=all_params, timeout=10)

    # Handle rate limiting: if Meta says "slow down", wait and retry
    if response.status_code == 429:
        print("⚠️  Meta API rate limit hit. Waiting 60 seconds...")
        time.sleep(60)
        response = requests.get(url, params=all_params, timeout=10)

    response.raise_for_status()
    return response.json()


def fetch_instagram_account(ig_user_id: str) -> dict:
    """
    Fetch Instagram account info: followers, name, biography.
    ig_user_id = the numeric Instagram Business Account ID.
    """
    data = _get(
        ig_user_id,
        params={"fields": "id,name,biography,followers_count,media_count"}
    )
    return {
        "platform":  "Instagram",
        "handle":    data.get("name", ""),
        "followers": data.get("followers_count", 0),
        "posts":     data.get("media_count", 0),
    }


def fetch_instagram_posts(ig_user_id: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch recent Instagram post metrics using the Media Insights API.
    Returns a Pandas DataFrame — one row per post.

    Pandas is used here to:
      - Clean the raw API response
      - Calculate engagement_rate per post
      - Filter out duplicates (if any)
      - Sort by date
    """
    since = int((datetime.now() - timedelta(days=days)).timestamp())

    # Step 1: Get list of recent media IDs
    media = _get(
        f"{ig_user_id}/media",
        params={"fields": "id,caption,media_type,timestamp", "since": since}
    )

    rows = []
    for post in media.get("data", []):
        post_id = post["id"]

        # Step 2: For each post, get its insights (likes, reach, impressions…)
        try:
            insights = _get(
                f"{post_id}/insights",
                params={"metric": "impressions,reach,likes,comments,shares,saved"}
            )
            metrics = {m["name"]: m["values"][0]["value"] for m in insights.get("data", [])}

            rows.append({
                "platform":     "Instagram",
                "post_id":      post_id,
                "caption":      post.get("caption", ""),
                "content_type": post.get("media_type", "IMAGE").lower(),
                "post_date":    post.get("timestamp", ""),
                "likes":        metrics.get("likes", 0),
                "comments":     metrics.get("comments", 0),
                "shares":       metrics.get("shares", 0),
                "saves":        metrics.get("saved", 0),
                "reach":        metrics.get("reach", 0),
                "impressions":  metrics.get("impressions", 0),
                "views":        0,
            })
        except Exception as e:
            print(f"  Skipping post {post_id}: {e}")

    # Step 3: Pandas cleans and structures the data
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["post_date"] = pd.to_datetime(df["post_date"])      # Parse date strings
    df = df.drop_duplicates(subset=["post_id"])             # Remove duplicates
    df = df.sort_values("post_date", ascending=False)       # Newest first

    # Step 4: Calculate engagement rate (not given directly by API)
    df["engagement_rate"] = (
        (df["likes"] + df["comments"] + df["shares"]) /
        df["impressions"].replace(0, 1) * 100
    ).round(2)

    return df


def fetch_facebook_page(page_id: str) -> dict:
    """Fetch Facebook Page follower count and basic info."""
    data = _get(page_id, params={"fields": "id,name,fan_count,posts"})
    return {
        "platform":  "Facebook",
        "handle":    data.get("name", ""),
        "followers": data.get("fan_count", 0),
    }


def fetch_facebook_posts(page_id: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch Facebook Page post insights.
    Same Pandas cleaning pipeline as Instagram.
    """
    since = int((datetime.now() - timedelta(days=days)).timestamp())

    posts = _get(
        f"{page_id}/posts",
        params={"fields": "id,message,created_time", "since": since}
    )

    rows = []
    for post in posts.get("data", []):
        post_id = post["id"]
        try:
            insights = _get(
                f"{post_id}/insights",
                params={"metric": "post_impressions,post_reach,post_reactions_by_type_total"}
            )
            metrics = {m["name"]: m["values"][0]["value"] for m in insights.get("data", [])}
            reactions = metrics.get("post_reactions_by_type_total", {})

            rows.append({
                "platform":     "Facebook",
                "post_id":      post_id,
                "caption":      post.get("message", "")[:200],
                "content_type": "text",
                "post_date":    post.get("created_time", ""),
                "likes":        reactions.get("LIKE", 0) + reactions.get("LOVE", 0),
                "comments":     0,
                "shares":       0,
                "saves":        0,
                "reach":        metrics.get("post_reach", 0),
                "impressions":  metrics.get("post_impressions", 0),
                "views":        0,
            })
        except Exception as e:
            print(f"  Skipping FB post {post_id}: {e}")

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["post_date"] = pd.to_datetime(df["post_date"])
    df = df.drop_duplicates(subset=["post_id"])
    df = df.sort_values("post_date", ascending=False)
    return df
