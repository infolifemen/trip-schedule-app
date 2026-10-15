#!/usr/bin/env python3
"""
Генерирует SQL для импорта командировок из Excel в Supabase.
Запустите этот SQL в Supabase SQL Editor.
"""
import json
import sys


def generate_sql(data_file="excel_trips.json", output_file="import_trips.sql"):
    """Генерирует SQL INSERT statements."""
    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    trips = data.get("trips", [])
    completed_objects = {(co["object"], co["work"]) for co in data.get("completed_objects", [])}
    
    print(f"Генерация SQL для {len(trips)} командировок...")
    
    lines = []
    lines.append("-- Импорт командировок из Excel")
    lines.append("-- Сгенерировано автоматически")
    lines.append("")
    
    # Создаём специалиста "Команда" если его нет
    lines.append("-- Создаём виртуального специалиста 'Команда'")
    lines.append("""
INSERT INTO specialists (id, name, color)
VALUES ('team', 'Команда', '#2563eb')
ON CONFLICT (id) DO NOTHING;
""")
    
    # Удаляем старые импортированные записи
    lines.append("-- Удаляем старые импортированные записи (с ID начинающимся на 'excel-')")
    lines.append("DELETE FROM trips WHERE id LIKE 'excel-%';")
    lines.append("")
    
    # Вставляем командировки батчами по 50
    batch_size = 50
    for i in range(0, len(trips), batch_size):
        batch = trips[i:i+batch_size]
        lines.append(f"-- Батч {i//batch_size + 1} ({i+1}-{i+len(batch)})")
        lines.append("INSERT INTO trips (id, specialist_id, city, purpose, start_date, end_date, note) VALUES")
        
        values = []
        for j, trip in enumerate(batch):
            trip_id = f"excel-{i+j}-{trip['start']}-{trip['object'][:10].replace(' ', '-')}"
            is_completed = (trip["object"], trip["work"]) in completed_objects
            note = f"Импорт из Excel. {'ВЫПОЛНЕНО' if is_completed else ''}"
            
            # Экранируем одинарные кавычки
            city = trip["object"].replace("'", "''")
            purpose = trip["work"].replace("'", "''")
            note = note.replace("'", "''")
            
            values.append(f"  ('{trip_id}', 'team', '{city}', '{purpose}', '{trip['start']}', '{trip['end']}', '{note}')")
        
        lines.append(",\n".join(values) + ";")
        lines.append("")
    
    # Итого
    lines.append(f"-- Импортировано: {len(trips)} командировок")
    lines.append(f"-- Выполненных объектов: {len(completed_objects)}")
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    
    print(f"SQL сохранён в {output_file}")
    print(f"Откройте Supabase Dashboard → SQL Editor → Вставьте содержимое файла")


if __name__ == "__main__":
    generate_sql()
