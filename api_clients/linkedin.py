# ============================================================
#  api_clients/linkedin.py — LinkedIn API
# ============================================================

import requests
import os
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

LINKEDIN_TOKEN = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
LINKEDIN_BASE  = "https://api.linkedin.com/v2"


def _get(endpoint: str, params: dict = None) -> dict:
    if not LINKEDIN_TOKEN:
        raise ValueError("LINKEDIN_ACCESS_TOKEN is not set in your .env file")
    headers = {
        "Authorization": f"Bearer {LINKEDIN_TOKEN}",
        "X-Restli-Protocol-Version": "2.0.0",
    }
    response = requests.get(f"{LINKEDIN_BASE}/{endpoint}", headers=headers, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_linkedin_account(org_id: str) -> dict:
    """Fetch LinkedIn Company Page follower count."""
    data = _get(f"organizations/{org_id}", params={"fields": "id,localizedName"})
    stats = _get("networkSizes", params={"edgeType": "CompanyFollowedByMember", "q": "member"})
    return {
        "platform":  "LinkedIn",
        "handle":    data.get("localizedName", ""),
        "followers": stats.get("firstDegreeSize", 0),
    }


def fetch_linkedin_posts(org_id: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch LinkedIn post analytics for a company page.
    Returns a Pandas DataFrame with engagement metrics.
    """
    since_ms = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)

    posts = _get(
        "shares",
        params={"q": "owners", "owners": f"urn:li:organization:{org_id}", "count": 50}
    )

    rows = []
    for post in posts.get("elements", []):
        share_id = post.get("id", "")
        try:
            stats = _get(
                "organizationalEntityShareStatistics",
                params={"q": "organizationalEntity", "organizationalEntity": f"urn:li:organization:{org_id}",
                        "shares[0]": share_id}
            )
            s = stats.get("elements", [{}])[0].get("totalShareStatistics", {})

            rows.append({
                "platform":     "LinkedIn",
                "post_id":      share_id,
                "caption":      post.get("text", {}).get("text", "")[:200],
                "content_type": "text",
                "post_date":    datetime.fromtimestamp(post.get("created", {}).get("time", 0) / 1000),
                "likes":        s.get("likeCount", 0),
                "comments":     s.get("commentCount", 0),
                "shares":       s.get("shareCount", 0),
                "saves":        0,
                "reach":        s.get("uniqueImpressionsCount", 0),
                "impressions":  s.get("impressionCount", 0),
                "views":        s.get("videoViews", 0),
            })
        except Exception as e:
            print(f"  Skipping LinkedIn post {share_id}: {e}")

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["post_id"])
    df = df.sort_values("post_date", ascending=False)
    return df
