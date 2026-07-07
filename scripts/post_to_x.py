import os
import sys
import json
import requests
import tweepy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_FILE = ROOT / "content" / "articles.json"

def post_tweet(api_key, api_key_secret, access_token, access_token_secret, article):
    # Configure console to output UTF-8 to prevent any Windows encoding crashes
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    # 1. Authenticate with Tweepy (V1.1 for media upload, V2 for tweeting)
    auth = tweepy.OAuth1UserHandler(api_key, api_key_secret, access_token, access_token_secret)
    api_v1 = tweepy.API(auth)
    
    client_v2 = tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_key_secret,
        access_token=access_token,
        access_token_secret=access_token_secret
    )

    # 2. Download article image
    image_url = article.get("image")
    temp_img_path = "temp_tweet_img.jpg"
    print(f"Downloading image: {image_url}")
    try:
        img_data = requests.get(image_url, timeout=30).content
        with open(temp_img_path, 'wb') as handler:
            handler.write(img_data)
    except Exception as e:
        print(f"Failed to download image: {e}")
        return False

    # 3. Upload Media
    print("Uploading media to X...")
    try:
        media = api_v1.media_upload(filename=temp_img_path)
        media_id = media.media_id
    except Exception as e:
        print(f"Failed to upload media to X: {e}")
        return False
    finally:
        # Clean up temp image
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

    # 4. Format Tweet Text
    title = article.get("title")
    slug = article.get("slug")
    category = article.get("category")
    link = f"https://prajnaagi.com/article.html?id={slug}"
    
    # 280 character limit handling
    tweet_text = f"📢 {category}: {title}\n\nविस्तार से पढ़ें: {link}"
    print(f"Posting tweet: {tweet_text}")

    # 5. Post Tweet V2
    try:
        client_v2.create_tweet(text=tweet_text, media_ids=[media_id])
        print("Successfully posted to X!")
        return True
    except Exception as e:
        print(f"Failed to post tweet: {e}")
        return False

def main():
    api_key = (os.getenv("X_API_KEY") or "").strip()
    api_key_secret = (os.getenv("X_API_KEY_SECRET") or "").strip()
    access_token = (os.getenv("X_ACCESS_TOKEN") or "").strip()
    access_token_secret = (os.getenv("X_ACCESS_TOKEN_SECRET") or "").strip()

    if not all([api_key, api_key_secret, access_token, access_token_secret]):
        print("[SKIP] X credentials missing in environment.")
        return

    if not ARTICLES_FILE.exists():
        print("[ERROR] articles.json not found.")
        return

    data = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))
    articles = data.get("articles", [])
    if not articles:
        print("[ERROR] No articles found to tweet.")
        return

    changed = False
    for article in articles:
        # Skip articles that have already been tweeted
        if article.get("tweeted", False):
            continue
            
        success = post_tweet(api_key, api_key_secret, access_token, access_token_secret, article)
        if success:
            article["tweeted"] = True
            changed = True
            
    if changed:
        ARTICLES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[DONE] Updated articles.json with tweeted status.")

if __name__ == "__main__":
    main()
