# Инструкция по закрытию дыры в базе данных

## Что сделано

Создан SQL файл миграции: `supabase/migrations/002_close_anonymous_access.sql`

Эта миграция:
- ✅ Удаляет анонимный доступ к таблицам `specialists` и `trips`
- ✅ Создаёт RLS политики только для аутентифицированных пользователей
- ✅ Включает Row Level Security (RLS) если ещё не включен

## Как выполнить миграцию

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/tchdcqflcfuhsgqaquzn)
2. Перейдите в **SQL Editor** (левая панель)
3. Нажмите **New Query**
4. Скопируйте содержимое файла `supabase/migrations/002_close_anonymous_access.sql`
5. Вставьте в SQL Editor
6. Нажмите **Run** (или Ctrl+Enter)
7. Проверьте результаты:
   - Должны увидеть 2 таблицы с `rowsecurity = true`
   - Должны увидеть 8 политик (4 для specialists, 4 для trips) с `roles = {authenticated}`

### Вариант 2: Через Supabase CLI (если установлен)

```bash
cd trip-schedule
npx supabase db push
```

## Проверка

После выполнения миграции:

1. Попробуйте открыть приложение без логина — данные НЕ должны загружаться
2. В консоли браузера должны быть ошибки 401 Unauthorized
3. Это нормально — теперь нужен логин

## Следующий шаг: Настройка аутентификации

После выполнения миграции нужно настроить Supabase Auth:

### А) Быстрый пароль (для тестирования)
- Создание тестового пользователя через Supabase Dashboard
- Email: `admin@test.com`
- Password: `test123456`

### Б) Нормальная аутентификация
- Supabase Auth с email/password
- Middleware в Next.js для защиты роутов
- UI для логина/логаута

См. следующую инструкцию: `AUTH_SETUP.md`
