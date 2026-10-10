# 🛡️ Security Policy

## Безопасность проекта trip-schedule-app

Этот документ описывает меры безопасности, применённые к проекту после переноса на Netlify (октябрь 2026).

**Домен:** `https://trip-schedule-app.netlify.app`
**Репозиторий:** `infolifemen/trip-schedule-app` (privat)
**БД:** Supabase (PostgreSQL + Auth + RLS)

## Обязательные меры

### 1. GitHub Security

- ✅ **Secret Scanning** — автоматическое сканирование коммитов на утечки секретов
- ✅ **Branch Protection** — `main` защищён: требуется PR, code review, блокировка force push
- ✅ **No hardcoded secrets** — все секреты только через environment variables
- ✅ **`.gitignore`** — исключает `.env*`, `.netlify`, `.vercel`, `*.pem`, `*.key`, `node_modules/`, `build.log`
- ✅ **Удалён `vercel.json`** — больше не нужен, Netlify использует `netlify.toml`

### 2. Netlify Security

- ✅ **Environment Variables** — все секреты настроены в Netlify Dashboard (Site configuration → Environment variables), не в коде
- ✅ **Build Configuration** — описано в `netlify.toml` (build: `npm run build`, publish: `.next`)
- ✅ **Security Headers** — через `netlify.toml`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `X-XSS-Protection: 1; mode=block`
- ✅ **Netlify Team Protection (опционально)** — можно включить парольную защиту от неавторизованных посетителей

### 3. Supabase Security

- ✅ **RLS Policies** — Row Level Security включён на ВСЕХ таблицах
- ✅ **Auth Rate Limiting** — защита от brute-force атак
- ✅ **CORS** — разрешён только домен Netlify (`https://trip-schedule-app.netlify.app`)
- ✅ **Service Role Key** — НИКОГДА не публикуется, только в Netlify env vars
- ✅ **Anon Key** — публичный, но ограничен RLS policies
- ✅ **Миграция `002_close_anonymous_access.sql`** — доступ только для `authenticated`

### 4. Authentication

- ✅ **Middleware protection** — все маршруты защищены через Next.js middleware (`middleware.ts`)
- ✅ **Session-based auth** — через Supabase Auth с cookies
- ✅ **Fail-fast** — приложение падает если env vars не настроены (никаких fallback на хардкод)
- ✅ **Страница логина** — `app/login/page.tsx` (email/password)

## Требуемые environment variables в Netlify

Должны быть настроены в **Netlify Dashboard → Site configuration → Environment variables**:

```
NEXT_PUBLIC_SUPABASE_URL = https://tchdcqflcfuhsgqaquzn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

Без них приложение упадёт при загрузке.

## Настройка CORS в Supabase

**Supabase Dashboard → Authentication → URL Configuration:**

- Site URL: `https://trip-schedule-app.netlify.app`
- Redirect URLs: `https://trip-schedule-app.netlify.app/**`

## Проверка безопасности

### Перед каждым коммитом:
1. Убедись что `.env*` файлы не коммитятся
2. Проверь что нет hardcoded credentials
3. Запусти `npm run lint`

### Перед каждым деплоем:
1. Проверь что все env vars настроены в Netlify
2. Проверь что RLS policies активны в Supabase
3. Проверь что CORS настроен на домен Netlify
4. Проверь что `netlify.toml` содержит все security headers

## Инциденты безопасности

При обнаружении утечки секрета:
1. Немедленно отзови ключ в Supabase Dashboard
2. Сгенерируй новый ключ
3. Обнови env vars в Netlify
4. Пересоздай deploy (`git push` → триггерит новый build)
5. Проверь логи на подозрительную активность

## Шаблон для новых проектов

При создании нового проекта применяй все меры из этого документа. Используй этот файл как чек-лист.
