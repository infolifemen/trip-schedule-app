#!/usr/bin/env python3
"""
Проверка количества записей в каждом батче
"""
import os

print("Проверка батчей:")
print("=" * 60)

total_records = 0
for i in range(1, 25):
    batch_file = f'batch_{i}.sql'
    if os.path.exists(batch_file):
        with open(batch_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Подсчитаем количество INSERT values
            values_count = content.count("('excel-")
            total_records += values_count
            print(f'{batch_file}: {values_count} записей')
    else:
        print(f'{batch_file}: НЕ НАЙДЕН')

print("=" * 60)
print(f'Всего записей для импорта: {total_records}')
print(f'Текущее количество записей в БД: 750')
print(f'Ожидаемое после импорта: {750 + total_records}')
