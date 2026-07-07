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
    # Query: Space, ISRO, NASA, Robots, Technology, Smartphones, AI in Hindi
    query = 'अंतरिक्ष OR इसरो OR नासा OR रोबोट OR तकनीक OR स्मार्टफोन OR एआई OR "कृत्रिम बुद्धिमत्ता"'
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=hi&gl=IN&ceid=IN:hi"
    
    # Trusted Hindi news sources
    reliable_sources = [
        "BBC", "NDTV", "Navbharat Times", "Aaj Tak", 
        "Jagran", "Amar Ujala", "Hindustan", "News18", 
        "ABP", "TV9", "Jansatta", "Patrika", "Zee", "India TV",
        "Punjab Kesari", "Prabhat Khabar", "Naidunia"
    ]
    
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
                    full_text = title_elem.text.strip()
                    
                    # Google News usually formats as: "Headline - Source Name"
                    parts = full_text.rsplit(" - ", 1)
                    if len(parts) == 2:
                        headline = parts[0].strip()
                        source = parts[1].strip()
                        
                        # Check if source is reliable
                        is_reliable = any(rs.lower() in source.lower() for rs in reliable_sources)
                        
                        if is_reliable:
                            # Shorten source name for a cleaner ticker
                            short_source = source
                            if "BBC" in source.upper(): short_source = "BBC"
                            elif "NDTV" in source.upper(): short_source = "NDTV"
                            elif "Navbharat" in source: short_source = "NBT"
                            elif "Aaj Tak" in source: short_source = "Aaj Tak"
                            elif "Jagran" in source: short_source = "Jagran"
                            elif "Ujala" in source: short_source = "Amar Ujala"
                            elif "Hindustan" in source: short_source = "Hindustan"
                            elif "News18" in source.upper(): short_source = "News18"
                            elif "ABP" in source.upper(): short_source = "ABP"
                            elif "TV9" in source.upper(): short_source = "TV9"
                            elif "Zee" in source.upper(): short_source = "Zee News"
                            
                            formatted_text = f"{headline} ({short_source})"
                            
                            # Avoid duplicates
                            if not any(x['text'] == formatted_text for x in items_list):
                                items_list.append({"text": formatted_text})
                    
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
