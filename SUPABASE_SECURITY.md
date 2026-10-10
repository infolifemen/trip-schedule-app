# Supabase Security — trip-schedule-app

## Текущие настройки (обновлено 2026-10-11)

**Project URL:** `https://tchdcqflcfuhsgqaquzn.supabase.co`
**Client:** `trip-schedule-app` (Netlify)
**Платформа:** Netlify (было Vercel до октября 2026)

## Настройки аутентификации (Supabase Dashboard → Authentication → URL Configuration)

| Параметр | Значение |
|----------|----------|
| Site URL | `https://trip-schedule-app.netlify.app` |
| Redirect URLs | `https://trip-schedule-app.netlify.app/**` |

## CORS / Redirect URLs (обязательно проверь!)

После переноса на Netlify нужно обновить:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. В поле **Site URL** указать: `https://trip-schedule-app.netlify.app`
3. В поле **Redirect URLs** добавить: `https://trip-schedule-app.netlify.app/**`
4. Удалить старый Vercel домен: ~~`https://trip-schedule-five.vercel.app`~~

## Row Level Security

Миграция `002_close_anonymous_access.sql` закрывает анонимный доступ:
- Все политики требуют роль `authenticated`
- Публичный `anon` ключ ограничен только RLS-защищёнными операциями

## Ключи

| Тип | Где хранится | Назначение |
|-----|--------------|------------|
| `anon` (pub) | Netlify env vars: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Клиентские запросы (ограничен RLS) |
| `service_role` (secret) | **НЕ** в коде, только для серверных задач | Обход RLS — никогда не публикуется |

## Чек-лист после переноса

- [ ] Site URL обновлён в Supabase Dashboard
- [ ] Redirect URLs содержат `https://trip-schedule-app.netlify.app/**`
- [ ] Старый Vercel домен удалён из разрешённых
- [ ] Env vars настроены в Netlify
- [ ] RLS активен на всех таблицах (проверить в Table editor → Policies)
