# Настройка аутентификации в trip-schedule

## Что сделано

✅ **SQL миграция** (`supabase/migrations/002_close_anonymous_access.sql`)
- Закрывает анонимный доступ к БД
- Создаёт RLS политики только для аутентифицированных пользователей

✅ **Middleware** (`middleware.ts`)
- Защищает все роуты кроме `/login`
- Автоматически редиректит неаутентифицированных пользователей на `/login`

✅ **Страница логина** (`app/login/page.tsx`)
- Форма email/password
- Отображение ошибок
- Подсказка с тестовыми credentials

✅ **Кнопка выхода** (`components/LogoutButton.tsx`)
- Интегрирована в Header

✅ **Обновлён Header** (`components/Header.tsx`)
- Добавлена кнопка "Выйти"

## Что нужно сделать

### Шаг 1: Установить npm пакеты

```bash
cd trip-schedule
npm install @supabase/ssr --registry https://registry.npmjs.org
```

**Важно:** Если возникнет ошибка с `@supabase/realtime-js`, используйте официальный registry:
```bash
npm install @supabase/ssr @supabase/supabase-js --registry https://registry.npmjs.org
```

### Шаг 2: Выполнить SQL миграцию

См. `MIGRATION_INSTRUCTIONS.md` для деталей.

**Кратко:**
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/tchdcqflcfuhsgqaquzn)
2. Перейдите в **SQL Editor**
3. Скопируйте содержимое `supabase/migrations/002_close_anonymous_access.sql`
4. Выполните SQL
5. Проверьте что RLS включен и есть 8 политик

### Шаг 3: Создать тестового пользователя

**Вариант А: Быстрый пароль (для тестирования)**

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/tchdcqflcfuhsgqaquzn)
2. Перейдите в **Authentication** → **Users**
3. Нажмите **Add user**
4. Заполните:
   - **Email:** `admin@test.com`
   - **Password:** `test123456`
   - **Auto Confirm User:** ✅ (включить)
5. Нажмите **Create user**

**Вариант Б: Нормальная аутентификация**

Для продакшена настройте:
- Email templates (подтверждение email, сброс пароля)
- Auth providers (Google, GitHub и т.д.)
- Rate limiting
- Redirect URLs

См. [Supabase Auth docs](https://supabase.com/docs/guides/auth)

### Шаг 4: Запустить приложение

```bash
npm run dev
```

Откройте `http://localhost:3000` — вас должно редиректить на `/login`.

Войдите с тестовыми credentials:
- Email: `admin@test.com`
- Password: `test123456`

### Шаг 5: Проверить

1. ✅ Без логина — редирект на `/login`
2. ✅ После логина — доступ к данным из Supabase
3. ✅ Кнопка "Выйти" — возвращает на `/login`
4. ✅ Данные загружаются только для аутентифицированных пользователей

## Структура файлов

```
trip-schedule/
├── middleware.ts                          # Next.js middleware для защиты роутов
├── app/
│   ├── login/
│   │   └── page.tsx                       # Страница логина
│   └── page.tsx                           # Главная страница (защищена)
├── components/
│   ├── Header.tsx                         # Header с кнопкой выхода
│   └── LogoutButton.tsx                   # Компонент кнопки выхода
├── lib/
│   └── supabase.ts                        # Supabase client
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql         # (уже выполнена)
        └── 002_close_anonymous_access.sql # Новая миграция
```

## Troubleshooting

### Ошибка: "Invalid API key"
- Убедитесь что выполнили SQL миграцию
- Проверьте что RLS включен для таблиц `specialists` и `trips`

### Ошибка: "User not found"
- Создайте пользователя через Supabase Dashboard (Шаг 3)
- Убедитесь что включили "Auto Confirm User"

### Middleware не работает
- Убедитесь что установлен `@supabase/ssr`
- Перезапустите `npm run dev`

### Данные не загружаются после логина
- Проверьте консоль браузера на ошибки
- Убедитесь что RLS политики разрешают доступ для `authenticated` роли
- Проверьте что пользователь действительно аутентифицирован (выведите `supabase.auth.getUser()` в консоль)

## Следующие улучшения

- [ ] Добавить регистрацию новых пользователей
- [ ] Email confirmation flow
- [ ] Сброс пароля (forgot password)
- [ ] OAuth providers (Google, GitHub)
- [ ] User roles и permissions (admin/user)
- [ ] Audit log для действий пользователей
