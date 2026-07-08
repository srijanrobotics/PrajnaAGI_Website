#!/usr/bin/env python3
"""
auto_publish.py — PrajnaAGI autonomous article publisher (GitHub Actions).
Runs twice daily (7:00 & 17:00 IST). Each run writes ONE article per category
(= 2 per page per day) using Gemini and appends them to content/articles.json.

Env:
  GEMINI_API_KEY  (required — GitHub Actions secret)
  RUN_SLOT        "morning" | "evening" (optional, for topic variety)
"""
import os
import sys
import json
import re
import datetime
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "content" / "articles.json"
FACTS = ROOT / "content" / "facts.json"

CATEGORIES = {
    "अंतरिक्ष": "space missions, astronomy, ISRO, NASA, telescopes, exoplanets",
    "विज्ञान": "physics, biology, chemistry, research breakthroughs, Indian science",
    "तकनीक": "AI, robotics, gadgets, software, chips, Indian tech",
    "पर्यावरण": "climate, wildlife, rivers, renewable energy, conservation in India",
    "स्वास्थ्य": "medicine, nutrition, mental health, yoga science, public health",
    "सृजन रोबॉटिक्स": "humanoid robotics, robotic engineering, artificial intelligence in robotics, future of robots, global robotic research",
}

TAGS = {
    "अंतरिक्ष": "SPACE", "विज्ञान": "SCI", "तकनीक": "TECH",
    "पर्यावरण": "ECO", "स्वास्थ्य": "HEALTH", "सृजन रोबॉटिक्स": "SRIJAN",
}


def slugify(title, cat):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not s:
        s = TAGS[cat].lower() + "-" + datetime.datetime.now().strftime("%Y%m%d-%H%M")
    return s[:60]


def image_url(prompt):
    p = f"retro 8-bit pixel art, {prompt}, chunky pixels, 1980s video game style"
    return ("https://image.pollinations.ai/prompt/"
            + urllib.parse.quote(p) + "?width=1024&height=576&nologo=true")


def generate(model, category, hint, existing_titles, slot):
    time_hint = "subah (morning edition)" if slot == "morning" else "shaam (evening edition)"
    if category == "सृजन रोबॉटिक्स":
        persona = ("Tu PrajnaAGI ka science journalist hai. Humanoid robots, AI aur robotics "
                   "ki duniya par dilchasp aur vaigyanik news-style article likho. "
                   "First-person (मैं) diary entry BILKUL nahi likhna, hamesha third-person mein likho. "
                   "'रोबॉट' spelling aise hi likhna.")
    else:
        persona = ("Tu PrajnaAGI ka science journalist hai. Saral, सटीक Hindi mein "
                   "news-style article likho. 'रोबॉट' spelling aise hi likhna.")
    prompt = f"""{persona}
Category: {category} ({hint})
Edition: {time_hint}, date {datetime.date.today().isoformat()}
In titles se ALAG naya topic chuno: {existing_titles[-12:]}

STRICT OUTPUT — sirf ek JSON object, koi markdown fence nahi:
{{"title": "...", "title_en": "short english slug words", "summary": "1-2 vakya Hindi",
"body_hindi": "300-450 shabd Hindi, ### subheadings ke saath",
"image_prompt": "short English scene description"}}"""
    resp = model.generate_content(prompt, request_options={"timeout": 90})
    text = resp.text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    return json.loads(text)


def generate_custom(model, category, topic, notes, existing_titles):
    if category == "सृजन रोबॉटिक्स":
        persona = ("Tu PrajnaAGI ka science journalist hai. Humanoid robots, AI aur robotics "
                   "ki duniya par dilchasp aur vaigyanik news-style article likho. "
                   "First-person (मैं) diary entry BILKUL nahi likhna, hamesha third-person mein likho. "
                   "'रोबॉट' spelling aise hi likhna.")
    else:
        persona = ("Tu PrajnaAGI ka science journalist hai. Saral, सटीक Hindi mein "
                   "news-style article likho. 'रोबॉट' spelling aise hi likhna.")
    notes_str = f"Additional Guidelines/Context: {notes}" if notes else ""
    prompt = f"""{persona}
Category: {category}
Specific Topic to write about: {topic}
{notes_str}
Date: {datetime.date.today().isoformat()}

Write a high-quality news-style article in Hindi on the specific topic.
STRICT OUTPUT — sirf ek JSON object, koi markdown fence nahi:
{{"title": "...", "title_en": "short english slug words", "summary": "1-2 vakya Hindi",
"body_hindi": "300-450 shabd Hindi, ### subheadings ke saath",
"image_prompt": "short English scene description"}}"""
    resp = model.generate_content(prompt, request_options={"timeout": 90})
    text = resp.text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    return json.loads(text)


def generate_fact(model, existing_highlights):
    """One fresh science 'did-you-know' fact in Hindi. NEVER about Srijan."""
    prompt = f"""Tu PrajnaAGI ka science educator hai.
Ek rochak vaigyanik tathya (did-you-know) Hindi mein likho — space, physics,
biology, technology ya nature se. सृजन/robot/Prajna ke baare mein BILKUL nahi.
In highlights se ALAG naya tathya: {existing_highlights[-15:]}

STRICT OUTPUT — sirf ek JSON object, koi markdown fence nahi:
{{"icon": "ek emoji", "fact_text": "1-2 vakya saral Hindi", "highlight": "2-4 shabd ka mukhya bindu"}}"""
    resp = model.generate_content(prompt, request_options={"timeout": 90})
    text = resp.text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    return json.loads(text)


def publish_fact(model):
    try:
        data = json.loads(FACTS.read_text(encoding="utf-8"))
    except Exception:
        data = {"facts": []}
    facts = data.setdefault("facts", [])
    highlights = [f.get("highlight", "") for f in facts]
    try:
        f = generate_fact(model, highlights)
    except Exception as e:
        print(f"[WARN] fact generation failed -> {e}")
        return
    icon = str(f.get("icon", "")).strip() or "\u2726"
    text = str(f.get("fact_text", "")).strip()
    if not text:
        return
    facts.append({
        "icon": icon,
        "fact_text": text,
        "highlight": str(f.get("highlight", "")).strip(),
    })
    # keep newest 40 facts max
    data["facts"] = facts[-40:]
    FACTS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] fact: {text[:50]}")


def main():
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass  # python < 3.7
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not key:
        sys.exit("[ERROR] GEMINI_API_KEY missing")
    import google.generativeai as genai
    # REST transport avoids gRPC "Illegal metadata" errors and respects timeouts
    genai.configure(api_key=key, transport="rest")

    # Try several model names; use the first that actually responds.
    candidates = [
        os.getenv("GEMINI_MODEL"),
        "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash",
    ]
    model = None
    for name in [c for c in candidates if c]:
        try:
            m = genai.GenerativeModel(name)
            m.generate_content("ping", request_options={"timeout": 30})
            model = m
            print(f"[MODEL] using {name}")
            break
        except Exception as e:
            print(f"[MODEL] {name} unavailable -> {e}")
    if model is None:
        sys.exit("[ERROR] koi Gemini model uplabdh nahi (key/permissions check karein)")

    slot = os.getenv("RUN_SLOT") or ("morning" if datetime.datetime.utcnow().hour < 6 else "evening")

    data = json.loads(ARTICLES.read_text(encoding="utf-8"))
    articles = data["articles"]
    titles = [a.get("title", "") for a in articles]
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # Load suggestions if they exist
    SUGGESTIONS = ROOT / "content" / "suggestions.json"
    suggestions_data = {"suggestions": []}
    if SUGGESTIONS.exists():
        try:
            suggestions_data = json.loads(SUGGESTIONS.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[WARN] suggestions.json load failed -> {e}")

    suggestions_list = suggestions_data.setdefault("suggestions", [])
    added = 0
    suggestions_modified = False

    for cat, hint in CATEGORIES.items():
        # Find first pending suggestion for this category
        suggestion = None
        for s in suggestions_list:
            if s.get("category") == cat and s.get("status") == "Pending":
                suggestion = s
                break

        art = None
        if suggestion:
            print(f"[QUEUE] Found pending suggestion for {cat}: {suggestion.get('topic')}")
            try:
                art = generate_custom(model, cat, suggestion.get("topic"), suggestion.get("notes"), titles)
                # Mark as completed
                suggestion["status"] = "Completed"
                suggestion["completed_at"] = now
                suggestions_modified = True
            except Exception as e:
                print(f"[WARN] Custom article for {cat} failed -> {e}")
                # We do not fall back to random generation if custom fails, so it stays pending
                continue
        else:
            # Fall back to standard auto-generation
            try:
                art = generate(model, cat, hint, titles, slot)
            except Exception as e:
                print(f"[WARN] {cat}: generation failed -> {e}")
                continue

        title = str(art.get("title", "")).strip()
        if not title:
            continue
        entry = {
            "title": title,
            "slug": slugify(str(art.get("title_en", "")), cat),
            "category": cat,
            "tag": TAGS[cat],
            "author_id": "srijan",
            "date": now,
            "summary": str(art.get("summary", "")).strip(),
            "body_hindi": str(art.get("body_hindi", "")).strip(),
            "body_awadhi": "",
            "body_english": "",
            "image": image_url(str(art.get("image_prompt", title))),
            "tweeted": False
        }
        articles.append(entry)
        titles.append(title)
        added += 1
        print(f"[OK] {cat}: {title}")

    if not added:
        sys.exit("[ERROR] koi article nahi bana")

    ARTICLES.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[DONE] {added} naye article jode gaye ({slot}).")

    if suggestions_modified:
        SUGGESTIONS.write_text(json.dumps(suggestions_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[QUEUE] suggestions.json updated with completed status.")

    # one fresh fact each run (never about सृजन)
    publish_fact(model)

if __name__ == "__main__":
    main()
