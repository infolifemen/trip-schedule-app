#!/usr/bin/env python3
"""
Импорт командировок из Excel в Supabase.

Использует данные из excel_trips.json (сгенерированного parse_excel.py).
Создаёт виртуального специалиста "Команда" и привязывает все командировки к нему.
Пользователь может позже добавить реальных специалистов через UI.
"""
import json
import os
import sys
import requests
from datetime import datetime

# Supabase конфигурация
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://tchdcqflcfuhsgqaquzn.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_KEY:
    # Попробуем прочитать из .env.vercel
    env_file = os.path.join(os.path.dirname(__file__), ".env.vercel")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_KEY="):
                    SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')
                    break

if not SUPABASE_KEY:
    print("ОШИБКА: Не найден SUPABASE_SERVICE_KEY")
    print("Установите переменную окружения или добавьте в .env.vercel")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def ensure_team_specialist():
    """Создаёт специалиста 'Команда' если его нет."""
    url = f"{SUPABASE_URL}/rest/v1/specialists?id=eq.team"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200 and resp.json():
        print("Специалист 'Команда' уже существует")
        return "team"
    
    # Создаём
    data = {
        "id": "team",
        "name": "Команда",
        "color": "#2563eb",
    }
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/specialists", headers=HEADERS, json=data)
    if resp.status_code in (200, 201):
        print("Создан специалист 'Команда'")
        return "team"
    else:
        print(f"Ошибка создания специалиста: {resp.status_code} {resp.text}")
        sys.exit(1)


def clear_existing_trips():
    """Удаляет все существующие командировки (опционально)."""
    resp = input("Удалить все существующие командировки перед импортом? (y/N): ")
    if resp.lower() != "y":
        print("Пропускаем очистку")
        return
    
    url = f"{SUPABASE_URL}/rest/v1/trips"
    resp = requests.delete(url, headers=HEADERS)
    if resp.status_code == 204:
        print("Все командировки удалены")
    else:
        print(f"Ошибка удаления: {resp.status_code} {resp.text}")


def import_trips(data_file="excel_trips.json"):
    """Импортирует командировки из JSON файла."""
    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    trips = data.get("trips", [])
    completed_objects = {(co["object"], co["work"]) for co in data.get("completed_objects", [])}
    
    specialist_id = ensure_team_specialist()
    
    print(f"\nИмпорт {len(trips)} командировок...")
    
    imported = 0
    errors = 0
    
    for i, trip in enumerate(trips):
        # Генерируем уникальный ID
        trip_id = f"excel-{i}-{trip['start']}-{trip['object'][:10]}"
        
        # Определяем completed статус
        is_completed = (trip["object"], trip["work"]) in completed_objects
        
        record = {
            "id": trip_id,
            "specialist_id": specialist_id,
            "city": trip["object"],
            "purpose": trip["work"],
            "start_date": trip["start"],
            "end_date": trip["end"],
            "note": f"Импорт из Excel. Цвет: {trip['color']}. {'ВЫПОЛНЕНО' if is_completed else ''}",
        }
        
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/trips",
            headers=HEADERS,
            json=record,
        )
        
        if resp.status_code in (200, 201):
            imported += 1
            if (i + 1) % 50 == 0:
                print(f"  Импортировано: {i + 1}/{len(trips)}")
        else:
            errors += 1
            if errors <= 5:
                print(f"  Ошибка #{errors}: {resp.status_code} {resp.text[:100]}")
    
    print(f"\nГотово!")
    print(f"  Импортировано: {imported}")
    print(f"  Ошибок: {errors}")
    print(f"  Выполненных объектов: {len(completed_objects)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Импорт командировок из Excel в Supabase")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Файл данных: excel_trips.json")
    print()
    
    if not os.path.exists("excel_trips.json"):
        print("ОШИБКА: Файл excel_trips.json не найден")
        print("Сначала запустите parse_excel.py")
        sys.exit(1)
    
    clear_existing_trips()
    import_trips()
