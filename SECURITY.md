# 🛡️ Security Policy

## Безопасность проекта

Этот документ описывает меры безопасности, применённые к проекту.

## Обязательные меры (применяются ко ВСЕМ проектам)

### 1. GitHub Security

- ✅ **Secret Scanning** — автоматическое сканирование коммитов на утечки секретов
- ✅ **Branch Protection** — `main` защищён: требуется PR, code review, блокировка force push
- ✅ **No hardcoded secrets** — все секреты только через environment variables
- ✅ **`.gitignore`** — исключает `.env*`, `*.pem`, `*.key`, `node_modules/`, `build.log`

### 2. Vercel Security

- ✅ **Environment Variables** — все секреты настроены в Vercel Dashboard, не в коде
- ✅ **Deployment Protection** — preview окружения защищены (Production Branch Protection)
- ✅ **Security Headers** — через `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 3. Supabase Security

- ✅ **RLS Policies** — Row Level Security включён на ВСЕХ таблицах
- ✅ **Auth Rate Limiting** — защита от brute-force атак
- ✅ **CORS** — разрешён только домен Vercel (trip-schedule-five.vercel.app)
- ✅ **Service Role Key** — НИКОГДА не публикуется, только в Vercel env vars
- ✅ **Anon Key** — публичный, но ограничен RLS policies

### 4. Authentication

- ✅ **Middleware protection** — все маршруты защищены через Next.js middleware
- ✅ **Session-based auth** — через Supabase Auth с cookies
- ✅ **Fail-fast** — приложение падает если env vars не настроены (никаких fallback на хардкод)

## Проверка безопасности

### Перед каждым коммитом:
1. Убедись что `.env*` файлы не коммитятся
2. Проверь что нет hardcoded credentials
3. Запусти `npm run lint` (если настроен)

### Перед каждым деплоем:
1. Проверь что все env vars настроены в Vercel
2. Проверь что RLS policies активны в Supabase
3. Проверь что CORS настроен правильно

## Инциденты безопасности

При обнаружении утечки секрета:
1. Немедленно отзови ключ в Supabase/GitHub/etc
2. Сгенерируй новый ключ
3. Обнови env vars в Vercel
4. Проверь логи на подозрительную активность

## Шаблон для новых проектов

При создании нового проекта применяй все меры из этого документа. Используй этот файл как чек-лист.
