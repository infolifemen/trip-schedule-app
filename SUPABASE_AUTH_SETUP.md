# Supabase Auth — Настройка авторизации

Эта инструкция описывает, как настроить настоящую авторизацию через Supabase Auth (email + password) вместо хардкод-пароля.

## Шаг 1: Включить Email-провайдер

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект `trip-schedule-app` (ID: `tchdcqflcfuhsgqaquzn`)
3. Перейдите в **Authentication** → **Providers**
4. Найдите **Email** и включите его
5. **ВАЖНО**: отключите опцию "Confirm email" (если не хотите, чтобы пользователи подтверждали email)
   - Settings → **Enable email confirmations** → **OFF**

## Шаг 2: Создать пользователя

1. Перейдите в **Authentication** → **Users**
2. Нажмите **Add user** → **Create new user**
3. Заполните:
   - **Email**: ваш email (например, `admin@example.com`)
   - **Password**: ваш пароль (минимум 6 символов)
   - **Auto Confirm User**: ✅ включено
4. Нажмите **Create user**

Теперь вы можете войти на сайт с этими credentials.

## Шаг 3: Настроить Row Level Security (RLS)

RLS гарантирует, что только авторизованные пользователи могут читать/писать данные.

1. Перейдите в **SQL Editor** → **New query**
2. Выполните следующий SQL:

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- Политики для SELECT (чтение)
CREATE POLICY "Разрешить SELECT для авторизованных" ON specialists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON service_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON vacations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON trainings FOR SELECT TO authenticated USING (true);

-- Политики для INSERT (создание)
CREATE POLICY "Разрешить INSERT для авторизованных" ON specialists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON service_periods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON vacations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON trainings FOR INSERT TO authenticated WITH CHECK (true);

-- Политики для UPDATE (обновление)
CREATE POLICY "Разрешить UPDATE для авторизованных" ON specialists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON service_periods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON vacations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON trainings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Политики для DELETE (удаление)
CREATE POLICY "Разрешить DELETE для авторизованных" ON specialists FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON trips FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON service_periods FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON vacations FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON trainings FOR DELETE TO authenticated USING (true);
```

3. Нажмите **Run**

## Шаг 4: Управление пользователями

### Добавить нового пользователя

1. **Authentication** → **Users** → **Add user**
2. Введите email и пароль
3. **Auto Confirm User**: ✅ включено

### Сбросить пароль пользователю

1. **Authentication** → **Users**
2. Найдите пользователя
3. Нажмите ⋮ → **Update user**
4. Измените пароль

### Удалить пользователя

1. **Authentication** → **Users**
2. Найдите пользователя
3. Нажмите ⋮ → **Delete user**

## Как это работает

### Vercel (SSR)

1. Пользователь вводит email/password на `/login`
2. Клиент вызывает `supabase.auth.signInWithPassword()`
3. Supabase возвращает JWT-токен
4. JWT сохраняется в cookies (httpOnly, secure)
5. `middleware.ts` проверяет JWT через `supabase.auth.getUser()`
6. Если JWT валиден → доступ разрешён

### GitHub Pages (Static)

1. Пользователь вводит email/password на `/login`
2. Клиент вызывает `supabase.auth.signInWithPassword()`
3. Supabase возвращает JWT-токен
4. JWT сохраняется в localStorage/cookies
5. `components/AuthGate.tsx` проверяет сессию через `supabase.auth.getSession()`
6. Если сессия валидна → доступ разрешён

## Безопасность

- ✅ Пароли хешируются в Supabase (bcrypt)
- ✅ JWT-токены имеют срок действия (обычно 1 час)
- ✅ Refresh tokens автоматически продлевают сессию
- ✅ RLS защищает данные на уровне базы
- ✅ Нет хардкод-паролей в коде

## Troubleshooting

### Ошибка "Invalid login credentials"

- Проверьте, что email и пароль правильные
- Убедитесь, что пользователь создан в Supabase
- Проверьте, что Email-провайдер включён

### Ошибка "Email not confirmed"

- Включите **Auto Confirm User** при создании пользователя, ИЛИ
- Отключите **Enable email confirmations** в Authentication → Settings

### После входа редиректит обратно на /login

- Проверьте, что Supabase URL и Anon Key правильные в переменных окружения
- Откройте DevTools → Console и посмотрите ошибки
- Проверьте, что RLS политики применены

### Данные не загружаются после авторизации

- Проверьте RLS политики (Шаг 3)
- Убедитесь, что пользователь имеет роль `authenticated`
- Попробуйте выполнить `SELECT * FROM specialists;` в SQL Editor от имени пользователя

## Переменные окружения

### Vercel

В Settings → Environment Variables должны быть:

- `NEXT_PUBLIC_SUPABASE_URL` = ваш Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ваш Anon Key
- `SITE_PASSWORD` можно удалить (больше не используется)

### GitHub Pages

В `.github/workflows/deploy-pages.yml` уже настроены:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Миграция со старого пароля

1. Создайте пользователя в Supabase (Шаг 2)
2. Примените RLS политики (Шаг 3)
3. Задеплойте код (PR #37)
4. Сообщите пользователям новые credentials
5. Удалите `NEXT_PUBLIC_SITE_PASSWORD` из workflow и Vercel

## Дополнительная информация

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Email and Password Auth](https://supabase.com/docs/guides/auth/passwords)
