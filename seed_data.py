from database import SessionLocal, engine, Base, Account, Post, Hashtag
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear old data first
db.query(Post).delete()
db.query(Account).delete()
db.query(Hashtag).delete()
db.commit()

# Add accounts
accounts_data = [
    ("Instagram", "@sonali.brand",   18420, 340, "Meta Graph API"),
    ("Facebook",  "Sonali Brand Page", 9810, 128, "Meta Graph API"),
    ("LinkedIn",  "Sonali Mitua Co.", 4230,  89, "LinkedIn API"),
    ("YouTube",   "Sonali Mitua",     6720, 210, "YouTube Data API v3"),
    ("TikTok",    "@sonali.mitua",   22100, 890, "TikTok Research API"),
]
for platform, handle, followers, growth, api in accounts_data:
    db.add(Account(platform=platform, handle=handle, followers=followers, growth=growth, api_source=api))
db.commit()

# Add posts
platforms     = ["Instagram","Facebook","LinkedIn","YouTube","TikTok"]
content_types = ["image","video","carousel","reel","short"]
captions      = ["New product launch 🚀","Behind the scenes ✨","Client success 🏆",
                 "Tips & tricks 💡","Community spotlight 💬"]

for i in range(100):
    platform = platforms[i % 5]
    is_video = content_types[i % 5] in ["video","reel","short"]
    db.add(Post(
        account_id  = i % 5 + 1,
        platform    = platform,
        post_date   = datetime.now() - timedelta(days=99 - i),
        caption     = captions[i % 5],
        content_type= content_types[i % 5],
        likes       = random.randint(100, 2000),
        comments    = random.randint(10, 300),
        shares      = random.randint(5, 200),
        saves       = random.randint(20, 400),
        reach       = random.randint(1000, 10000),
        impressions = random.randint(1500, 15000),
        views       = random.randint(1000, 20000) if is_video else 0,
    ))

db.commit()

# Add hashtags
tags = ["#marketing","#socialmedia","#business","#growth","#digitalmarketing","#brand","#content","#startup"]
for i, tag in enumerate(tags):
    db.add(Hashtag(post_id=i+1, tag=tag, reach=random.randint(10000, 50000)))
db.commit()
db.close()
print("Done! Sample data added successfully.")