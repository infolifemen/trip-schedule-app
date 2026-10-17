-- Миграция 003: Добавление поддержки множественных специалистов, оборудования,
-- периодов оказания услуг и отпусков
-- Дата: 2026-10-18

-- ========================================
-- ШАГ 1: Новые колонки в таблице trips
-- ========================================

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS specialist_ids TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS equipment TEXT;

-- Заполняем specialist_ids из specialist_id для существующих записей
UPDATE public.trips
SET specialist_ids = '["' || specialist_id || '"]'
WHERE specialist_ids IS NULL AND specialist_id IS NOT NULL;

-- ========================================
-- ШАГ 2: Таблица периодов оказания услуг
-- ========================================

CREATE TABLE IF NOT EXISTS public.service_periods (
  id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ШАГ 3: Таблица отпусков
-- ========================================

CREATE TABLE IF NOT EXISTS public.vacations (
  id TEXT PRIMARY KEY,
  specialist_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ШАГ 4: Включение RLS для новых таблиц
-- ========================================

ALTER TABLE public.service_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ШАГ 5: Политики доступа для service_periods
-- ========================================

CREATE POLICY "Enable read access for authenticated users"
ON public.service_periods
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.service_periods
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.service_periods
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON public.service_periods
FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- ШАГ 6: Политики доступа для vacations
-- ========================================

CREATE POLICY "Enable read access for authenticated users"
ON public.vacations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.vacations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.vacations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON public.vacations
FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- Проверка
-- ========================================

SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('trips', 'service_periods', 'vacations');
