import os
import sys

# Добавляем путь к venv
sys.path.insert(0, r'C:\Users\exdik\Qwen-Workspace\.venv-jarvis\Lib\site-packages')

from supabase import create_client

# Supabase credentials
SUPABASE_URL = "https://tchdcqflcfuhsgqaquzn.supabase.co"
# Используем service_role key из Supabase Dashboard
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGRjcWZsY2Z1aHNncWFxdXpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTYxNCwiZXhwIjoyMDc2MjU1NjE0fQ.6ZtGvJvQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Импортируем батчи с 13 по 24
for i in range(13, 25):
    batch_file = f"batch_{i}.sql"
    if os.path.exists(batch_file):
        print(f"Импорт {batch_file}...")
        with open(batch_file, 'r', encoding='utf-8') as f:
            sql = f.read().strip()
        
        # Выполняем SQL через RPC
        try:
            result = supabase.rpc('exec_sql', {'query': sql}).execute()
            print(f"Результат: {result}")
        except Exception as e:
            print(f"Ошибка: {e}")

print("Импорт завершён!")
