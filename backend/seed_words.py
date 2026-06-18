#!/usr/bin/env python3
"""
Скрипт генерации SQL для заполнения таблиц words и translations.
Источник: открытый датасет частотных слов с переводами.
Запуск: python3 seed_words.py
Результат: seed_words.sql — готовый файл для выполнения в PostgreSQL.
"""

import urllib.request
import json
import re

# 10 языков приложения — коды должны совпадать с тем что загрузил DataSeeder
LANGUAGES = {
    "en": 1, "ru": 2, "de": 3, "fr": 4, "es": 5,
    "it": 6, "pt": 7, "zh": 8, "ja": 9, "ko": 10
}

# Тематические категории — простая эвристика по спискам слов
TOPICS = {
    "travel": ["hotel", "airport", "ticket", "passport", "luggage", "flight",
               "journey", "trip", "map", "tourist", "visa", "booking"],
    "business": ["meeting", "contract", "company", "profit", "salary", "office",
                 "manager", "budget", "market", "invest", "client", "report"],
    "food": ["breakfast", "lunch", "dinner", "recipe", "cook", "kitchen",
             "restaurant", "menu", "taste", "ingredient", "meal", "drink"],
    "technology": ["computer", "software", "internet", "phone", "data", "system",
                   "network", "code", "program", "digital", "device", "screen"],
    "health": ["doctor", "hospital", "medicine", "exercise", "diet", "sleep",
               "heart", "pain", "treatment", "health", "sport", "mental"],
    "everyday": []  # дефолтная категория для остальных слов
}

def get_topic(word: str) -> str:
    """Определить тему слова по спискам ключевых слов."""
    word_lower = word.lower()
    for topic, keywords in TOPICS.items():
        if topic == "everyday":
            continue
        if word_lower in keywords:
            return topic
    return "everyday"

def clean_word(word: str) -> bool:
    """
    Проверить что слово подходит для изучения.
    Фильтруем: служебные слова, сокращения, числа, слишком короткие.
    """
    if len(word) < 3:
        return False
    if not re.match(r'^[a-zA-Z]+$', word):
        return False
    # Стоп-слова — служебные части речи бесполезны для словаря
    stopwords = {
        "the", "and", "for", "are", "but", "not", "you", "all",
        "can", "had", "her", "was", "one", "our", "out", "day",
        "get", "has", "him", "his", "how", "its", "may", "new",
        "now", "old", "see", "two", "way", "who", "did", "its",
        "let", "put", "say", "she", "too", "use"
    }
    if word.lower() in stopwords:
        return False
    return True

def fetch_english_words(limit: int = 5000) -> list[str]:
    """Скачать топ частотных английских слов."""
    print("Скачиваем английские слова...")
    url = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt"

    with urllib.request.urlopen(url) as response:
        content = response.read().decode("utf-8")

    words = []
    for line in content.strip().split("\n"):
        parts = line.split(" ")
        if len(parts) >= 1:
            word = parts[0].strip()
            if clean_word(word):
                words.append(word)
                if len(words) >= limit:
                    break

    print(f"Отобрано {len(words)} английских слов.")
    return words

def fetch_translations(words: list[str], target_lang: str) -> dict[str, str]:
    """
    Получить переводы слов через MyMemory бесплатный API.
    Лимит: 500 запросов в день без ключа.
    Для полного сидирования нужен API ключ или офлайн словарь.
    """
    # Для MVP используем встроенный мини-словарь наиболее частых слов
    # В продакшне заменить на полноценный API или офлайн датасет
    builtin_ru = {
        "time": "время", "person": "человек", "year": "год", "way": "путь",
        "day": "день", "thing": "вещь", "man": "мужчина", "world": "мир",
        "life": "жизнь", "hand": "рука", "part": "часть", "place": "место",
        "case": "случай", "week": "неделя", "company": "компания", "system": "система",
        "program": "программа", "question": "вопрос", "work": "работа", "government": "правительство",
        "number": "число", "night": "ночь", "point": "точка", "home": "дом",
        "water": "вода", "room": "комната", "mother": "мать", "area": "район",
        "money": "деньги", "story": "история", "fact": "факт", "month": "месяц",
        "lot": "много", "right": "право", "study": "учёба", "book": "книга",
        "eye": "глаз", "job": "работа", "word": "слово", "business": "бизнес",
        "issue": "проблема", "side": "сторона", "kind": "вид", "head": "голова",
        "house": "дом", "service": "сервис", "friend": "друг", "father": "отец",
        "power": "власть", "hour": "час", "game": "игра", "line": "линия",
        "end": "конец", "among": "среди", "never": "никогда", "last": "последний",
        "city": "город", "play": "играть", "small": "маленький", "number": "число",
        "off": "выключить", "always": "всегда", "move": "двигаться", "live": "жить",
        "believe": "верить", "hold": "держать", "bring": "приносить", "happen": "случаться",
        "write": "писать", "provide": "обеспечивать", "sit": "сидеть", "stand": "стоять",
        "lose": "терять", "pay": "платить", "meet": "встречать", "include": "включать",
        "continue": "продолжать", "learn": "учиться", "change": "менять", "lead": "вести",
        "understand": "понимать", "watch": "смотреть", "follow": "следовать", "stop": "останавливать",
        "create": "создавать", "speak": "говорить", "read": "читать", "spend": "тратить",
        "grow": "расти", "open": "открывать", "walk": "ходить", "offer": "предлагать",
        "remember": "помнить", "love": "любовь", "consider": "рассматривать", "appear": "появляться",
        "buy": "покупать", "wait": "ждать", "serve": "служить", "die": "умирать",
        "send": "отправлять", "build": "строить", "stay": "оставаться", "fall": "падать",
        "cut": "резать", "reach": "достигать", "kill": "убивать", "remain": "оставаться",
        "suggest": "предлагать", "raise": "поднимать", "pass": "проходить", "sell": "продавать",
        "require": "требовать", "report": "сообщать", "decide": "решать", "pull": "тянуть",
        "airport": "аэропорт", "hotel": "отель", "ticket": "билет", "passport": "паспорт",
        "luggage": "багаж", "flight": "рейс", "journey": "путешествие", "trip": "поездка",
        "map": "карта", "tourist": "турист", "visa": "виза", "booking": "бронирование",
        "meeting": "встреча", "contract": "контракт", "profit": "прибыль", "salary": "зарплата",
        "office": "офис", "manager": "менеджер", "budget": "бюджет", "market": "рынок",
        "invest": "инвестировать", "client": "клиент", "breakfast": "завтрак", "lunch": "обед",
        "dinner": "ужин", "recipe": "рецепт", "cook": "готовить", "kitchen": "кухня",
        "restaurant": "ресторан", "menu": "меню", "taste": "вкус", "ingredient": "ингредиент",
        "meal": "еда", "drink": "напиток", "computer": "компьютер", "software": "программное обеспечение",
        "internet": "интернет", "phone": "телефон", "network": "сеть", "digital": "цифровой",
        "device": "устройство", "screen": "экран", "doctor": "доктор", "hospital": "больница",
        "medicine": "лекарство", "exercise": "упражнение", "diet": "диета", "sleep": "сон",
        "heart": "сердце", "pain": "боль", "treatment": "лечение", "sport": "спорт",
        "mental": "психический", "family": "семья", "child": "ребёнок", "school": "школа",
        "student": "студент", "teacher": "учитель", "language": "язык", "country": "страна",
        "people": "люди", "woman": "женщина", "girl": "девочка", "boy": "мальчик",
        "door": "дверь", "window": "окно", "floor": "пол", "wall": "стена",
        "car": "машина", "road": "дорога", "street": "улица", "bridge": "мост",
        "river": "река", "mountain": "гора", "forest": "лес", "sea": "море",
        "sky": "небо", "sun": "солнце", "moon": "луна", "star": "звезда",
        "color": "цвет", "black": "чёрный", "white": "белый", "red": "красный",
        "blue": "синий", "green": "зелёный", "yellow": "жёлтый", "brown": "коричневый",
        "beautiful": "красивый", "large": "большой", "high": "высокий", "long": "длинный",
        "great": "великий", "little": "маленький", "own": "собственный", "other": "другой",
        "old": "старый", "young": "молодой", "important": "важный", "public": "публичный",
        "private": "частный", "real": "настоящий", "best": "лучший", "free": "свободный",
        "able": "способный", "human": "человеческий", "local": "местный", "sure": "уверенный",
    }

    if target_lang == "ru":
        return builtin_ru

    return {}

def escape_sql(value: str) -> str:
    """Экранировать одиночные кавычки для SQL."""
    return value.replace("'", "''")

def generate_sql(words: list[str]) -> str:
    """Сгенерировать SQL для вставки слов и переводов."""
    print("Генерируем SQL...")

    lines = []
    lines.append("-- Автогенерированный файл. Не редактировать вручную.")
    lines.append("-- Запустить: psql -U postgres -d vocabapp -f seed_words.sql")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    # Вставляем английские слова
    lines.append("-- Английские слова (language_id = 1)")
    lines.append("INSERT INTO words (language_id, word, topic) VALUES")

    word_rows = []
    for word in words:
        topic = get_topic(word)
        word_rows.append(f"  (1, '{escape_sql(word)}', '{topic}')")

    lines.append(",\n".join(word_rows) + ";")
    lines.append("")

    # Вставляем переводы на русский
    translations_ru = fetch_translations(words, "ru")

    if translations_ru:
        lines.append("-- Переводы на русский (target_language_id = 2)")
        lines.append("INSERT INTO translations (word_id, target_language_id, translation)")
        lines.append("SELECT w.id, 2, t.translation")
        lines.append("FROM words w")
        lines.append("JOIN (VALUES")

        trans_rows = []
        for word, translation in translations_ru.items():
            if word in words:
                trans_rows.append(
                    f"  ('{escape_sql(word)}', '{escape_sql(translation)}')"
                )

        if trans_rows:
            lines.append(",\n".join(trans_rows))
            lines.append(") AS t(word, translation) ON w.word = t.word")
            lines.append("WHERE w.language_id = 1;")

    lines.append("")
    lines.append("COMMIT;")

    return "\n".join(lines)

def main():
    words = fetch_english_words(5000)
    sql = generate_sql(words)

    output_file = "seed_words.sql"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"SQL файл сохранён: {output_file}")
    print(f"Слов: {len(words)}")
    print(f"Для применения выполни:")
    print(f"  psql -U postgres -d vocabapp -f {output_file}")

if __name__ == "__main__":
    main()