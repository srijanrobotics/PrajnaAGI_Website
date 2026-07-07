#!/usr/bin/env python3
"""
update_ticker.py - Fetches latest science/tech/space news in Hindi from Google News RSS.
Writes them to content/ticker.json so the frontend can display them automatically.
"""
import os
import sys
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TICKER_FILE = ROOT / "content" / "ticker.json"

def fetch_real_news():
    # Query: अंतरिक्ष OR विज्ञान OR तकनीक OR पर्यावरण OR स्वास्थ्य (in Hindi)
    query = "अंतरिक्ष OR विज्ञान OR तकनीक OR पर्यावरण OR स्वास्थ्य"
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=hi&gl=IN&ceid=IN:hi"
    
    items_list = []
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            
            # Find all item elements in the RSS feed
            for item in root.findall(".//item"):
                title_elem = item.find("title")
                if title_elem is not None and title_elem.text:
                    text = title_elem.text.strip()
                    # Optionally remove trailing source if it looks like "- SourceName"
                    # text = text.rsplit(" - ", 1)[0]
                    items_list.append({"text": text})
                    
                if len(items_list) >= 15:  # Limit to top 15 news items
                    break
    except Exception as e:
        print(f"[ERROR] Failed to fetch or parse RSS: {e}")
        sys.exit(1)
        
    return items_list

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    print("[INFO] Fetching real-time news for ticker...")
    news_items = fetch_real_news()
    
    if not news_items:
        print("[ERROR] No news fetched, aborting.")
        sys.exit(1)
        
    print(f"[OK] Fetched {len(news_items)} real-time headlines.")
    
    # Load existing ticker.json to preserve structure if needed, or overwrite
    data = {"items": news_items}
    
    # Save to ticker.json
    TICKER_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[DONE] ticker.json updated.")

if __name__ == "__main__":
    main()
