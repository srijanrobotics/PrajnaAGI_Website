#!/usr/bin/env python3
"""
translate_existing.py — Translates existing articles that are missing English or Awadhi body content.
Uses the Gemini API configured via the GEMINI_API_KEY environment variable.
"""
import os
import sys
import json
import time
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "content" / "articles.json"

def translate_text(model, text, target_lang):
    if not text or not text.strip():
        return ""
    
    if target_lang == "english":
        prompt = f"""You are an expert translator. Translate the following Hindi article into high-quality, natural English.
Keep the same headings/structure (### subheadings).

Hindi Article:
{text}

STRICT OUTPUT — only return the translated English text. No markdown fences or explanations. Your response should directly be the English translation:"""
    else:
        return ""

    resp = model.generate_content(prompt, request_options={"timeout": 60})
    return resp.text.strip()

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass  # python < 3.7
        
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not key:
        sys.exit("[ERROR] GEMINI_API_KEY missing. Please set the GEMINI_API_KEY environment variable.")
    
    import google.generativeai as genai
    genai.configure(api_key=key, transport="rest")

    # Find model
    candidates = [
        os.getenv("GEMINI_MODEL"),
        "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash",
    ]
    model = None
    for name in [c for c in candidates if c]:
        try:
            m = genai.GenerativeModel(name)
            m.generate_content("ping", request_options={"timeout": 15})
            model = m
            print(f"[MODEL] using {name}")
            break
        except Exception as e:
            print(f"[MODEL] {name} unavailable -> {e}")
    if model is None:
        sys.exit("[ERROR] No Gemini model available.")

    if not ARTICLES.exists():
        sys.exit(f"[ERROR] {ARTICLES} not found.")

    data = json.loads(ARTICLES.read_text(encoding="utf-8"))
    articles = data.get("articles", [])
    
    modified = False
    count = 0
    max_translations = 5  # Limit per run to avoid rate limits/timeouts. Set to 0 or high number for all.

    print(f"Total articles found: {len(articles)}")
    
    for idx, art in enumerate(articles):
        title = art.get("title", f"Article {idx}")
        hindi_body = art.get("body_hindi", "").strip()
        
        # Fallback to body field if body_hindi is empty
        if not hindi_body and "body" in art:
            hindi_body = art["body"].strip()
            art["body_hindi"] = hindi_body
            modified = True
            
        if not hindi_body:
            print(f"[SKIP] {title} - No Hindi body content available.")
            continue
            
        need_english = not art.get("body_english", "").strip()
        
        if not need_english:
            continue
            
        if max_translations > 0 and count >= max_translations:
            print(f"[LIMIT] Reached maximum translation limit of {max_translations} articles in this run. Run script again to translate more.")
            break
            
        print(f"\n[PROCESSING] {title}...")
        
        try:
            if need_english:
                print("  - Generating English version...")
                eng_body = translate_text(model, hindi_body, "english")
                if eng_body:
                    art["body_english"] = eng_body
                    modified = True
                    print("  [OK] English translation added.")
                time.sleep(2)  # pause between requests
                
            count += 1
            
        except Exception as e:
            print(f"  [ERROR] Translation failed for {title}: {e}")
            # Save whatever we have so far
            if modified:
                ARTICLES.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                print("[SAVE] Saved progress so far after error.")
            time.sleep(5)  # longer pause after error
            
    if modified:
        ARTICLES.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n[DONE] Successfully updated articles.json with translations for {count} articles.")
    else:
        print("\n[DONE] No articles needed translation in this run.")

if __name__ == "__main__":
    main()
