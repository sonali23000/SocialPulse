# ============================================================
#  cache.py — Redis caching
#
#  Redis stores a fast in-memory copy of dashboard data.
#  When a user opens the dashboard:
#    1. Python checks Redis first (very fast, < 1ms)
#    2. If data is there and fresh → serve it immediately
#    3. If not → query PostgreSQL, then save result to Redis
#
#  TTL (time-to-live) = 60 seconds. After 60s Redis clears
#  the copy and the next request re-fetches from PostgreSQL.
# ============================================================

import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to Redis (default: localhost port 6379)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception as e:
    redis_client = None
    REDIS_AVAILABLE = False
    print(f"⚠️  Redis not available ({e}). Running without cache.")


def cache_get(key: str):
    """
    Try to get a cached value from Redis.
    Returns the Python object if found, or None if not cached.
    """
    if not REDIS_AVAILABLE:
        return None
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)   # Convert JSON string back to Python dict
    except Exception:
        pass
    return None


def cache_set(key: str, data, ttl: int = 60):
    """
    Save data to Redis with a TTL (time-to-live) in seconds.
    Data is serialised to JSON so Redis can store it as a string.
    """
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(data))
    except Exception:
        pass


def cache_delete(key: str):
    """Delete a specific cache key (e.g. after data is refreshed)."""
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.delete(key)
    except Exception:
        pass
