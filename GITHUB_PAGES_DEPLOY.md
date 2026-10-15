# 🚀 Deploy trip-schedule на GitHub Pages

## Что уже сделано

✅ Next.js настроен на статический экспорт (`output: 'export'` в `next.config.js`)
✅ Supabase Auth работает через клиентский `@supabase/ssr` (без middleware — совместимо со статикой)
✅ GitHub Actions workflow создан: `.github/workflows/deploy.yml`
✅ Локальный build проверен — папка `out/` генерируется успешно
✅ .gitignore обновлён (не коммитим артефакты)

---

## Шаг 1: Включить GitHub Actions в репозитории

1. Открой: https://github.com/infolifemen/trip-schedule-app/settings/pages
2. В секции **"Build and deployment"** выбери:
   - **Source:** `GitHub Actions`
3. Сохрани (изменения применяются сразу)

---

## Шаг 2: Добавить Secrets (Supabase credentials)

1. Открой: https://github.com/infolifemen/trip-schedule-app/settings/secrets/actions
2. Нажми **"New repository secret"** и добавь два секрета:

### `NEXT_PUBLIC_SUPABASE_URL`
```
https://tchdcqflcfuhsgqaquzn.supabase.co
```
(взять из Supabase Dashboard → Settings → API → Project URL)

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```
<твой anon key>
```
(взять из Supabase Dashboard → Settings → API → Project API keys → `anon` `public`)

⚠️ **НЕ используй `service_role` key** — он даёт полный доступ к базе и не должен попадать в клиентский код!

---

## Шаг 3: Настроить CORS в Supabase

GitHub Pages будет на домене `https://infolifemen.github.io`. Нужно добавить его в CORS:

1. Открой: https://supabase.com/dashboard/project/tchdcqflcfuhsgqaquzn/auth/settings
2. Прокрути до секции **"Site configuration"**
3. В **"Site URL"** поставь: `https://infolifemen.github.io/trip-schedule-app`
4. В **"Redirect URLs"** добавь: `https://infolifemen.github.io/**`

### API CORS
1. Открой: https://supabase.com/dashboard/project/tchdcqflcfuhsgqaquzn/settings/api
2. В **"CORS"** добавь: `https://infolifemen.github.io`

---

## Шаг 4: Запушить изменения

```bash
cd C:\Users\exdik\Qwen-Workspace\trip-schedule

# Переключиться на main (если ещё не там)
git checkout main

# Добавить workflow и .gitignore
git add .github/ .gitignore

# Закоммитить
git commit -m "feat: GitHub Pages deployment workflow"

# Запушить
git push origin main
```

После пуша GitHub Actions автоматически:
1. Установит зависимости (`npm ci`)
2. Соберёт проект (`npm run build`) с подстановкой Secrets в env vars
3. Сгенерирует статический сайт в `out/`
4. Задеплоит на GitHub Pages

---

## Шаг 5: Проверить деплой

1. Открой: https://github.com/infolifemen/trip-schedule-app/actions
2. Дождись завершения workflow (зелёная галочка)
3. Открой сайт: https://infolifemen.github.io/trip-schedule-app/

⏱ Первый деплой занимает 1-2 минуты.

---

## 🐛 Troubleshooting

### Build падает с "Supabase credentials не настроены"
- Проверь что Secrets добавлены именно как **Repository secrets** (не environment)
- Имена должны быть ТОЧНО: `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 404 при переходе на /login
- Убедись что в Settings → Pages выбран **Source: GitHub Actions** (не Deploy from branch)
- Проверь что workflow выполнился успешно

### Supabase auth не работает (редиректит бесконечно)
- Проверь CORS в Supabase Dashboard (шаг 3)
- Открой DevTools → Network → смотри запросы к `*.supabase.co`, проверяй статус

### Страница открывается по кривому URL
- Если репозиторий называется `trip-schedule-app` — URL будет `https://infolifemen.github.io/trip-schedule-app/`
- actions/configure-pages автоматически настроит basePath, ничего менять не нужно

---

## 📝 Важные особенности

1. **Supabase Auth на статике работает через client-side PKCE flow** — пользователь авторизуется в браузере, сессия хранится в localStorage/cookies. Это полностью совместимо с GitHub Pages.

2. **`NEXT_PUBLIC_*` переменные подставляются при build time** — они встраиваются в JS bundle. Поэтому Secrets нужны только на этапе сборки, в runtime они уже в коде.

3. **Публичный репозиторий = бесплатный Pages**. Если репозиторий приватный — нужен GitHub Pro для Pages.

4. **Каждый push в main запускает деплой**. Для ручного запуска используй "Run workflow" в Actions.
