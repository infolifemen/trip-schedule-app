#!/usr/bin/env python3
"""
Автоматический импорт оставшихся батчей (13-24) в Supabase
"""
import os
import sys
import subprocess

# Путь к git
GIT_PATH = r'C:\Program Files\Git\bin\git.exe'

def import_batch_via_mcp(batch_num):
    """Импорт одного батча через Supabase MCP"""
    batch_file = f'batch_{batch_num}.sql'
    if not os.path.exists(batch_file):
        print(f"Файл {batch_file} не найден")
        return False
    
    with open(batch_file, 'r', encoding='utf-8') as f:
        sql = f.read().strip()
    
    print(f"Импорт батча {batch_num}...")
    # Здесь нужно использовать Supabase MCP execute_sql
    # Но мы не можем вызвать MCP напрямую из Python
    # Поэтому вернём SQL для выполнения
    return sql

def main():
    print("=" * 60)
    print("Автоматический импорт батчей 13-24")
    print("=" * 60)
    
    # Проверяем текущее состояние
    # У нас уже 750 записей (excel-0 до excel-649)
    # Нужно импортировать excel-650 до excel-1184
    
    for i in range(13, 25):
        batch_file = f'batch_{i}.sql'
        if os.path.exists(batch_file):
            with open(batch_file, 'r', encoding='utf-8') as f:
                content = f.read()
                values_count = content.count("('excel-")
                print(f"Батч {i}: {values_count} записей")
        else:
            print(f"Батч {i}: НЕ НАЙДЕН")
    
    print("\nДля импорта нужно выполнить SQL через Supabase MCP")
    print("Или использовать Supabase REST API с service_role key")

if __name__ == '__main__':
    main()
