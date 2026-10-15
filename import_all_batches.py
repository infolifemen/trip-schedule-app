import os
import requests
import time

# Supabase credentials
SUPABASE_URL = "https://tchdcqflcfuhsgqaquzn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGRjcWZsY2Z1aHNncWFxdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk2MTQsImV4cCI6MjA3NjI1NTYxNH0.6ZtGvJvQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ"

# Функция для выполнения SQL через REST API
def execute_sql(sql):
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    data = {"query": sql}
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Импортируем батчи с 12 по 24
for i in range(12, 25):
    batch_file = f"batch_{i}.sql"
    if os.path.exists(batch_file):
        print(f"Импорт {batch_file}...")
        with open(batch_file, 'r', encoding='utf-8') as f:
            sql = f.read().strip()
        
        result = execute_sql(sql)
        print(f"Результат: {result}")
        time.sleep(0.5)
    else:
        print(f"Файл {batch_file} не найден")

print("Импорт завершён!")
