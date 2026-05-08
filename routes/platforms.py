# Platform account endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Account
from cache import cache_get, cache_set

router = APIRouter()

@router.get("/")
def get_all_platforms(db: Session = Depends(get_db)):
    """Returns all connected social media accounts."""
    cached = cache_get("accounts")
    if cached:
        return {"data": cached, "cache": True}

    accounts = db.query(Account).all()
    result = [{
        "id":        a.id,
        "platform":  a.platform,
        "handle":    a.handle,
        "followers": a.followers,
        "growth":    a.growth,
        "api":       a.api_source,
    } for a in accounts]

    cache_set("accounts", result, ttl=120)
    return {"data": result, "cache": False}


@router.get("/{platform_name}")
def get_platform(platform_name: str, db: Session = Depends(get_db)):
    """Returns details for a single platform."""
    acc = db.query(Account).filter(Account.platform == platform_name).first()
    if not acc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Platform '{platform_name}' not found")
    return {"data": {"id": acc.id, "platform": acc.platform, "handle": acc.handle,
                     "followers": acc.followers, "growth": acc.growth, "api": acc.api_source}}


# Posts list endpoint

from fastapi import APIRouter as _R, Depends as _D, Query
from sqlalchemy.orm import Session as _S
from database import get_db as _gdb, Post
from cache import cache_get as _cg, cache_set as _cs

posts_router = _R()

@posts_router.get("/")
def get_posts(
    platform: str = None,
    sort_by:  str = Query("likes", regex="^(likes|comments|shares|views|reach)$"),
    limit:    int = Query(30, le=100),
    db: _S = _D(_gdb)
):
    """
    Returns paginated list of posts, sortable by any metric.
    Used by: Posts page in the React frontend.
    """
    cache_key = f"posts_{platform or 'all'}_{sort_by}_{limit}"
    cached = _cg(cache_key)
    if cached:
        return {"data": cached, "cache": True}

    query = db.query(Post)
    if platform:
        query = query.filter(Post.platform == platform)

    # Sort by the chosen metric (descending = highest first)
    sort_col = getattr(Post, sort_by, Post.likes)
    query = query.order_by(sort_col.desc()).limit(limit)

    posts = query.all()
    result = [{
        "id":           p.id,
        "platform":     p.platform,
        "caption":      p.caption or "",
        "content_type": p.content_type or "unknown",
        "post_date":    str(p.post_date.date()) if p.post_date else "",
        "likes":        p.likes,
        "comments":     p.comments,
        "shares":       p.shares,
        "saves":        p.saves,
        "reach":        p.reach,
        "impressions":  p.impressions,
        "views":        p.views,
    } for p in posts]

    _cs(cache_key, result, ttl=60)
    return {"data": result, "cache": False}


# Router alias so main.py can import it
router = posts_router


# Pricing plans endpoint

from fastapi import APIRouter as _RP
from cache import cache_get as _cg2, cache_set as _cs2

packages_router = _RP()

PLANS = [
    {"name": "Starter", "monthly_eur": 0,  "annual_eur": 0,
     "popular": False, "max_platforms": 2, "max_posts": 500,   "max_users": 1,
     "features": ["2 platforms (any)","500 posts/month","1 user","Basic reports","Email alerts"]},
    {"name": "Pro", "monthly_eur": 9,  "annual_eur": 7,
     "popular": True,  "max_platforms": 5, "max_posts": 5000,  "max_users": 3,
     "features": ["All 5 platforms","5,000 posts/month","3 users","Advanced analytics",
                  "AI insights","Hashtag tracker","Best-time suggestions","Priority email"]},
    {"name": "Business", "monthly_eur": 19, "annual_eur": 15,
     "popular": False, "max_platforms": 5, "max_posts": 25000, "max_users": 10,
     "features": ["All 5 platforms","25,000 posts/month","10 users","Full analytics",
                  "API access","Custom reports","Competitor tracking","Live chat"]},
    {"name": "Enterprise", "monthly_eur": 49, "annual_eur": 39,
     "popular": False, "max_platforms": 5, "max_posts": -1,    "max_users": -1,
     "features": ["All 5 platforms","Unlimited posts","Unlimited users","Custom dashboards",
                  "Dedicated API","SLA guarantee","Onboarding call","Account manager"]},
]

@packages_router.get("/")
def get_packages():
    """Returns the list of pricing plans. Cached for 10 minutes."""
    cached = _cg2("packages")
    if cached:
        return {"data": cached, "cache": True}
    _cs2("packages", PLANS, ttl=600)
    return {"data": PLANS, "cache": False}

router = packages_router
