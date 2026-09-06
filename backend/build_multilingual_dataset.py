#!/usr/bin/env python3
"""
Параллельный скрипт сборки 5-язычного датасета на базе Oxford 5000:
1: en (English)
2: ru (Русский)
3: es (Español)
4: zh (中文)
5: hi (हिन्दी)
"""

import urllib.request
import urllib.parse
import json
import os
import csv
import time
import sys
from concurrent.futures import ThreadPoolExecutor

CACHE_FILE = "backend/dataset_cache.json"
SQL_FILE = "backend/seed_5000_multilingual.sql"

TOPIC_KEYWORDS = {
    "travel": {
        "hotel", "airport", "ticket", "passport", "luggage", "flight", "journey", "trip",
        "map", "tourist", "visa", "booking", "train", "plane", "station", "subway", "bus",
        "vacation", "holiday", "beach", "island", "resort", "voyage", "travel", "cruise",
        "guide", "excursion", "arrival", "departure", "customs", "border", "route", "suitcase"
    },
    "business": {
        "meeting", "contract", "company", "profit", "salary", "office", "manager", "budget",
        "market", "invest", "client", "report", "revenue", "strategy", "trade", "finance",
        "employee", "employer", "boss", "career", "corporate", "deal", "negotiation", "tax",
        "accounting", "audit", "commercial", "enterprise", "executive", "firm", "industry",
        "marketing", "partner", "sales", "stock", "wealth", "wage", "bank", "currency"
    },
    "food": {
        "breakfast", "lunch", "dinner", "recipe", "cook", "kitchen", "restaurant", "menu",
        "taste", "ingredient", "meal", "drink", "coffee", "tea", "bread", "butter", "cheese",
        "meat", "beef", "chicken", "pork", "fish", "soup", "salad", "vegetable", "fruit",
        "apple", "banana", "orange", "cake", "sugar", "salt", "pepper", "rice", "pasta",
        "milk", "water", "beer", "wine", "juice", "hungry", "delicious", "bake", "fry", "boil"
    },
    "technology": {
        "computer", "software", "internet", "phone", "data", "system", "network", "code",
        "program", "digital", "device", "screen", "algorithm", "hardware", "cyber", "online",
        "website", "app", "mobile", "database", "server", "cloud", "robot", "artificial",
        "intelligence", "electronic", "tech", "laptop", "battery", "wireless", "signal",
        "virtual", "security", "developer", "user", "file", "download", "upload", "click"
    },
    "health": {
        "doctor", "hospital", "medicine", "exercise", "diet", "sleep", "heart", "pain",
        "treatment", "health", "sport", "mental", "illness", "disease", "patient", "clinic",
        "nurse", "surgery", "drug", "pill", "virus", "infection", "fever", "cough", "healthy",
        "therapy", "dentist", "blood", "muscle", "bone", "injury", "wound", "recovery"
    },
    "nature": {
        "forest", "mountain", "river", "lake", "ocean", "sea", "tree", "flower", "animal",
        "bird", "fish", "weather", "rain", "snow", "wind", "sun", "cloud", "storm", "nature",
        "earth", "planet", "sky", "star", "moon", "grass", "plant", "landscape", "wildlife",
        "environment", "climate", "island", "desert", "field", "wood", "season", "spring"
    },
    "education": {
        "school", "university", "college", "student", "teacher", "professor", "class", "lesson",
        "course", "study", "learn", "exam", "test", "grade", "degree", "homework", "library",
        "book", "read", "write", "knowledge", "science", "research", "lecture", "academy",
        "education", "academic", "theory", "paper", "pencil", "math", "history", "physics"
    },
    "shopping": {
        "shop", "store", "buy", "sell", "price", "cost", "cheap", "expensive", "discount",
        "sale", "customer", "cash", "credit", "card", "pay", "payment", "clothes", "shoes",
        "dress", "shirt", "pants", "fashion", "mall", "market", "order", "delivery", "brand"
    },
    "sports": {
        "football", "soccer", "basketball", "tennis", "game", "match", "team", "player",
        "score", "win", "lose", "champion", "race", "run", "jump", "swim", "athlete", "ball",
        "stadium", "coach", "fitness", "gym", "workout", "tournament", "medal", "cup"
    }
}

def detect_topic(word: str) -> str:
    w = word.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if w in keywords:
            return topic
        for kw in keywords:
            if kw in w and len(kw) >= 4:
                return topic
    return "everyday"

def fetch_oxford_words() -> list[tuple[str, str, str]]:
    url = "https://raw.githubusercontent.com/nalgeon/words/main/data/oxford-5k.csv"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        lines = [l.decode("utf-8") for l in resp.readlines()]

    reader = csv.DictReader(lines)
    seen = set()
    words = []

    for row in reader:
        w = row["word"].strip().lower()
        if not w.isalpha() or len(w) < 2 or w in seen:
            continue
        seen.add(w)
        level = row.get("level", "a1")
        topic = detect_topic(w)
        words.append((w, level, topic))

    if len(words) < 5000:
        extra_url = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt"
        req = urllib.request.Request(extra_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
        for line in content.split("\n"):
            p = line.split(" ")
            if p and p[0]:
                w = p[0].strip().lower()
                if w.isalpha() and len(w) >= 3 and w not in seen:
                    seen.add(w)
                    words.append((w, "b2", detect_topic(w)))
                    if len(words) >= 5000:
                        break

    return words[:5000]

def translate_batch(words: list[str], target_lang: str) -> list[str]:
    tl = "zh-CN" if target_lang == "zh" else target_lang
    params = [("client", "dict-chrome-ex"), ("sl", "en"), ("tl", tl)]
    for w in words:
        params.append(("q", w))

    url = "https://clients5.google.com/translate_a/t?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if isinstance(data, list) and len(data) == len(words):
                    return [str(item) for item in data]
        except Exception:
            time.sleep(1.0 + attempt)

    # Поэлементный фоллбэк если батч не прошёл
    fallback = []
    for w in words:
        p = [("client", "dict-chrome-ex"), ("sl", "en"), ("tl", tl), ("q", w)]
        u = "https://clients5.google.com/translate_a/t?" + urllib.parse.urlencode(p)
        r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(r, timeout=6) as rsp:
                d = json.loads(rsp.read().decode("utf-8"))
                fallback.append(str(d[0]) if d and isinstance(d, list) else w)
        except Exception:
            fallback.append(w)
    return fallback

def escape_sql(val: str) -> str:
    return val.replace("'", "''")

def main():
    print("1. Получение списка 5000 Oxford слов...")
    word_entries = fetch_oxford_words()
    print(f"   Загружено {len(word_entries)} слов.")

    dataset = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                dataset = json.load(f)
            print(f"   Загружен кэш: {len(dataset)} слов.")
        except Exception:
            dataset = {}

    target_languages = ["ru", "es", "zh", "hi"]
    batch_size = 50

    missing = []
    for w, lvl, topic in word_entries:
        if w not in dataset or any(l not in dataset[w] for l in target_languages):
            missing.append((w, lvl, topic))

    print(f"2. Требуется перевести: {len(missing)} слов на 4 языка...")

    def process_chunk(chunk):
        words_chunk = [w for w, _, _ in chunk]
        results = {}
        for tl in target_languages:
            results[tl] = translate_batch(words_chunk, tl)
        return words_chunk, results, chunk

    with ThreadPoolExecutor(max_workers=3) as executor:
        chunks = [missing[i:i + batch_size] for i in range(0, len(missing), batch_size)]
        future_to_chunk = [executor.submit(process_chunk, c) for c in chunks]

        completed = 0
        for future in future_to_chunk:
            words_chunk, results, chunk = future.result()
            for idx, (w, lvl, topic) in enumerate(chunk):
                if w not in dataset:
                    dataset[w] = {}
                for tl in target_languages:
                    dataset[w][tl] = results[tl][idx]
                dataset[w]["en"] = w
                dataset[w]["level"] = lvl
                dataset[w]["topic"] = topic

            completed += len(chunk)
            print(f"   Прогресс: {completed}/{len(missing)} слов...")
            if completed % 200 == 0 or completed >= len(missing):
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(dataset, f, ensure_ascii=False)

    print("3. Генерация SQL дампа...")

    LANG_IDS = {"en": 1, "ru": 2, "es": 5, "zh": 8, "hi": 11}

    lines = []
    lines.append("-- 5000 Words Multilingual Dataset")
    lines.append("BEGIN;")
    lines.append("TRUNCATE TABLE translations CASCADE;")
    lines.append("TRUNCATE TABLE user_word_progress CASCADE;")
    lines.append("TRUNCATE TABLE custom_set_words CASCADE;")
    lines.append("DELETE FROM words;")
    lines.append("ALTER SEQUENCE words_id_seq RESTART WITH 1;")
    lines.append("ALTER SEQUENCE translations_id_seq RESTART WITH 1;")
    lines.append("")

    print("   Формирование INSERT для words...")
    word_rows = []
    concept_idx = 0
    for w, lvl, topic in word_entries:
        if w not in dataset:
            continue
        entry = dataset[w]
        topic = entry.get("topic", "everyday")
        for lang_code in ["en", "ru", "es", "zh", "hi"]:
            lang_id = LANG_IDS[lang_code]
            word_str = entry.get(lang_code, w)
            word_rows.append(f"({lang_id}, '{escape_sql(word_str)}', '{topic}')")
        concept_idx += 1

    lines.append("INSERT INTO words (language_id, word, topic) VALUES")
    lines.append(",\n".join(word_rows) + ";")
    lines.append("")

    print("   Формирование INSERT для translations...")
    trans_rows = []
    lang_order = ["en", "ru", "es", "zh", "hi"]

    for c in range(concept_idx):
        base_id = c * 5
        for src_i, src_lang in enumerate(lang_order):
            src_word_id = base_id + src_i + 1
            for tgt_i, tgt_lang in enumerate(lang_order):
                if src_lang == tgt_lang:
                    continue
                tgt_lang_id = LANG_IDS[tgt_lang]
                tgt_word_str = dataset[word_entries[c][0]].get(tgt_lang, word_entries[c][0])
                trans_rows.append(f"({src_word_id}, {tgt_lang_id}, '{escape_sql(tgt_word_str)}')")

    chunk_size = 5000
    for i in range(0, len(trans_rows), chunk_size):
        chunk = trans_rows[i:i + chunk_size]
        lines.append("INSERT INTO translations (word_id, target_language_id, translation) VALUES")
        lines.append(",\n".join(chunk) + ";")

    lines.append("")
    lines.append("COMMIT;")

    with open(SQL_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"4. Готово! Файл сохранён: {SQL_FILE}")
    print(f"   Понятий: {concept_idx}")
    print(f"   Слов в words: {concept_idx * 5}")
    print(f"   Связей в translations: {len(trans_rows)}")

if __name__ == "__main__":
    main()
