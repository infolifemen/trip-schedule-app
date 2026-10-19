-- Migration: Настройка RLS для Supabase Auth
-- Дата: 2026-10-19
-- Описание: Включает Row Level Security для всех таблиц и создаёт политики
--           для авторизованных пользователей (роль 'authenticated')

-- Включаем RLS для всех таблиц
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- === Политики для SELECT (чтение) ===
CREATE POLICY "Разрешить SELECT для авторизованных" ON specialists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON service_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON vacations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Разрешить SELECT для авторизованных" ON trainings FOR SELECT TO authenticated USING (true);

-- === Политики для INSERT (создание) ===
CREATE POLICY "Разрешить INSERT для авторизованных" ON specialists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON service_periods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON vacations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Разрешить INSERT для авторизованных" ON trainings FOR INSERT TO authenticated WITH CHECK (true);

-- === Политики для UPDATE (обновление) ===
CREATE POLICY "Разрешить UPDATE для авторизованных" ON specialists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON service_periods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON vacations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить UPDATE для авторизованных" ON trainings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- === Политики для DELETE (удаление) ===
CREATE POLICY "Разрешить DELETE для авторизованных" ON specialists FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON trips FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON service_periods FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON vacations FOR DELETE TO authenticated USING (true);
CREATE POLICY "Разрешить DELETE для авторизованных" ON trainings FOR DELETE TO authenticated USING (true);
