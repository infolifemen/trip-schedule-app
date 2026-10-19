/**
 * Серверный клиент Supabase.
 *
 * НЕ использует @supabase/ssr — он делает preflight-запросы к Auth API,
 * что возвращает "Database error querying schema" и ломает рендер.
 *
 * Все данные загружаются клиентски через lib/supabase-browser.ts.
 */
export async function createClient() {
  return null;
}
