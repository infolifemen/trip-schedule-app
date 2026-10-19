import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training } from "./types";
import { SEED_DATA } from "./data";
import { createSupabaseClient } from "./supabase-browser";

const CACHE_KEY = "trip-schedule-cache";
const SCHEMA_VERSION = 3;
// Всё, что заканчивается ДО этой даты — считается "до 2026" и отбрасывается миграцией
const MIN_DATE = "2026-01-01";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuery(queryFn: () => Promise<any>): Promise<any> {
  try { const result = await queryFn(); return result; } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); console.warn("[SafeQuery] Supabase error:", msg); return { data: null, error: { message: msg } }; }
}

// Фильтрация записей, заканчивающихся до 2026-01-01 (пользователь попросил удалить всё до 2026)
function filterByEnd<T extends { end: string }>(items: T[]): T[] {
  return items.filter(i => i.end >= MIN_DATE);
}
function migrateData(data: AppData): AppData {
  return {
    specialists: data.specialists || [],
    trips: filterByEnd(data.trips || []),
    servicePeriods: filterByEnd(data.servicePeriods || []),
    vacations: filterByEnd(data.vacations || []),
    trainings: filterByEnd(data.trainings || []),
    archivedIds: data.archivedIds || [],
  };
}

// Синхронная загрузка из localStorage (для lazy-инициализации useState, чтобы не было "мигания" seed → пусто)
export function loadFromCacheSync(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as AppData & { _schema?: number };
    // Миграция схемы: старые данные без _schema → применяем миграцию
    if (!parsed._schema || parsed._schema < SCHEMA_VERSION) {
      // Миграция поля specialistId → specialistIds
      if (parsed.trips?.some((t: unknown) => (t as { specialistId?: string }).specialistId && !(t as { specialistIds?: string[] }).specialistIds)) {
        parsed.trips = (parsed.trips || []).map((t: unknown) => {
          const tt = t as Trip & { specialistId?: string };
          return { ...tt, specialistIds: tt.specialistIds || (tt.specialistId ? [tt.specialistId] : []) };
        });
      }
      if (!parsed.trainings) parsed.trainings = [];
      if (!parsed.archivedIds) parsed.archivedIds = [];
    }
    const migrated = migrateData(parsed);
    // Если после миграции список пуст — НЕ возвращаем (упадём на SEED_DATA)
    if (migrated.trips.length === 0 && migrated.specialists.length === 0) return null;
    return migrated;
  } catch { return null; }
}

export async function loadData(): Promise<AppData> {
  try {
    const supabase = createSupabaseClient();
    const specs = await safeQuery(() => supabase.from("specialists").select("*").order("id"));
    const tripsRes = await safeQuery(() => supabase.from("trips").select("*").order("start_date"));
    const spRes = await safeQuery(() => supabase.from("service_periods").select("*"));
    const vacRes = await safeQuery(() => supabase.from("vacations").select("*"));
    const trRes = await safeQuery(() => supabase.from("trainings").select("*"));
    const hasCriticalError = specs?.error || tripsRes?.error || spRes?.error || vacRes?.error || trRes?.error;
    if (hasCriticalError) { console.warn("[loadData] Supabase error, falling back"); return loadFromCacheOrSeed(); }
    if (!specs?.data || !tripsRes?.data) { console.warn("[loadData] No data from Supabase, falling back"); return loadFromCacheOrSeed(); }
    const specialists: Specialist[] = (specs.data || []).map((s: unknown) => { const ss = s as Record<string, unknown>; return { id: ss.id as string, name: ss.name as string, color: (ss.color as string) || "#3b82f6" }; });
    const tripsList: Trip[] = (tripsRes.data || []).map((t: unknown) => {
      const tt = t as Record<string, unknown>;
      let specialistIds: string[]; const specialistIdsRaw = tt.specialist_ids; const specialistId = tt.specialist_id as string | undefined;
      if (specialistIdsRaw && typeof specialistIdsRaw === "string") { try { specialistIds = JSON.parse(specialistIdsRaw); if (!Array.isArray(specialistIds)) specialistIds = specialistId ? [specialistId] : []; } catch { specialistIds = specialistId ? [specialistId] : []; } } else if (specialistId) { specialistIds = [specialistId]; } else { specialistIds = []; }
      return { id: tt.id as string, specialistIds, city: tt.city as string, purpose: tt.purpose as string, equipment: (tt.equipment as string) || undefined, start: tt.start_date as string, end: tt.end_date as string, note: (tt.note as string) || undefined };
    });
    const servicePeriods: ServicePeriod[] = (spRes?.data || []).map((sp: unknown) => { const s = sp as Record<string, unknown>; return { id: s.id as string, objectId: s.object_id as string, start: s.start_date as string, end: s.end_date as string }; });
    const vacations: Vacation[] = (vacRes?.data || []).map((v: unknown) => { const vv = v as Record<string, unknown>; return { id: vv.id as string, specialistId: vv.specialist_id as string, start: vv.start_date as string, end: vv.end_date as string }; });
    const trainings: Training[] = (trRes?.data || []).map((t: unknown) => { const tt = t as Record<string, unknown>; return { id: tt.id as string, specialistId: tt.specialist_id as string, title: (tt.title as string) || "", start: tt.start_date as string, end: tt.end_date as string }; });
    // Получаем archivedIds из cache
    let archivedIds: string[] = [];
    try { const cached = loadFromCacheSync(); if (cached) archivedIds = cached.archivedIds || []; } catch { /* ignore */ }
    let result: AppData = { specialists, trips: tripsList, servicePeriods, vacations, trainings, archivedIds };
    result = migrateData(result);
    // Если Supabase вернул пусто после миграции — падаем на cache/seed (чтобы не терять локальные данные)
    if (result.trips.length === 0 && result.specialists.length === 0) {
      console.warn("[loadData] Empty result from Supabase, falling back to cache/seed");
      return loadFromCacheOrSeed();
    }
    saveToCache(result); return result;
  } catch (e) { console.error("[loadData] Fatal error, falling back:", e); return loadFromCacheOrSeed(); }
}

function saveToCache(data: AppData): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION })); } catch { /* ignore */ }
}

function loadFromCacheOrSeed(): AppData {
  const cached = loadFromCacheSync();
  if (cached && cached.trips.length > 0) return cached;
  return migrateData({ ...SEED_DATA });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeUpsert(tableName: string, data: any): Promise<void> { try { const supabase = createSupabaseClient(); const result = await supabase.from(tableName).upsert(data as any); if (result.error) console.warn(`[safeUpsert] ${tableName}:`, result.error.message); } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); console.warn(`[safeUpsert] ${tableName}:`, msg); } }
async function safeDelete(tableName: string, column: string, value: string): Promise<void> { try { const supabase = createSupabaseClient(); const result = await supabase.from(tableName).delete().eq(column, value); if (result.error) console.warn(`[safeDelete] ${tableName}:`, result.error.message); } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); console.warn(`[safeDelete] ${tableName}:`, msg); } }

export async function saveTrip(trip: Trip): Promise<void> { await safeUpsert("trips", { id: trip.id, specialist_id: trip.specialistIds[0] || "", specialist_ids: JSON.stringify(trip.specialistIds), city: trip.city, purpose: trip.purpose, equipment: trip.equipment || "", start_date: trip.start, end_date: trip.end, note: trip.note || "" }); }
export async function deleteTrip(tripId: string): Promise<void> { await safeDelete("trips", "id", tripId); }
export async function saveSpecialist(specialist: Specialist): Promise<void> { await safeUpsert("specialists", { id: specialist.id, name: specialist.name, color: specialist.color }); }
export async function saveServicePeriods(objectId: string, periods: ServicePeriod[]): Promise<void> { try { const supabase = createSupabaseClient(); await supabase.from("service_periods").delete().eq("object_id", objectId); if (periods.length > 0) { const { error } = await supabase.from("service_periods").insert(periods.map((p) => ({ id: p.id, object_id: p.objectId, start_date: p.start, end_date: p.end }))); if (error) console.warn("[saveServicePeriods]:", error.message); } } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); console.warn("[saveServicePeriods]:", msg); } }
export async function saveVacation(vacation: Vacation): Promise<void> { await safeUpsert("vacations", { id: vacation.id, specialist_id: vacation.specialistId, start_date: vacation.start, end_date: vacation.end }); }
export async function deleteVacation(vacationId: string): Promise<void> { await safeDelete("vacations", "id", vacationId); }
export async function saveTraining(training: Training): Promise<void> { await safeUpsert("trainings", { id: training.id, specialist_id: training.specialistId, title: training.title, start_date: training.start, end_date: training.end }); }
export async function deleteTraining(trainingId: string): Promise<void> { await safeDelete("trainings", "id", trainingId); }
export function saveTrainings(trainings: Training[]): void { try { const cached = localStorage.getItem(CACHE_KEY); const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA }; data.trainings = trainings; localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION })); } catch { /* ignore */ } }
export function saveArchivedIds(archivedIds: string[]): void { try { const cached = localStorage.getItem(CACHE_KEY); const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA }; data.archivedIds = archivedIds; localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION })); } catch { /* ignore */ } }
export function clearData(): void { try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ } }
