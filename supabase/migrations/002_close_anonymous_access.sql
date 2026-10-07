-- Миграция 002: Закрытие анонимного доступа и настройка RLS для аутентифицированных пользователей
-- Дата: 2026-10-08
-- Описание: Удаляет анонимный доступ, создаёт политики для authenticated пользователей

-- ========================================
-- ШАГ 1: Удаление анонимных политик (если есть)
-- ========================================

-- Удаляем все существующие политики для specialists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.specialists;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.specialists;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.specialists;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.specialists;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.specialists;

-- Удаляем все существующие политики для trips
DROP POLICY IF EXISTS "Enable read access for all users" ON public.trips;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.trips;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.trips;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.trips;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.trips;

-- ========================================
-- ШАГ 2: Создание политик для аутентифицированных пользователей
-- ========================================

-- Политики для таблицы specialists
CREATE POLICY "Enable read access for authenticated users"
ON public.specialists
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.specialists
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.specialists
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON public.specialists
FOR DELETE
TO authenticated
USING (true);

-- Политики для таблицы trips
CREATE POLICY "Enable read access for authenticated users"
ON public.trips
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.trips
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.trips
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON public.trips
FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- ШАГ 3: Включение RLS (если ещё не включен)
-- ========================================

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ШАГ 4: Проверка
-- ========================================

-- Проверяем что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('specialists', 'trips');

-- Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('specialists', 'trips')
ORDER BY tablename, policyname;
