import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training } from "./types";
import { SEED_DATA } from "./data";
import { createSupabaseClient } from "./supabase-browser";
import { getCurrentUser } from "./auth";

const CACHE_KEY = "trip-schedule-cache";
const SCHEMA_VERSION = 5;
const MIN_DATE = "2026-01-01";
const BLACKLIST_NAMES = new Set(["команда"]);

let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

function isBlacklisted(s: { id: string; name?: string }): boolean {
  const n = (s.name || s.id || "").toString().toLowerCase().trim();
  return BLACKLIST_NAMES.has(n);
}

function filterByEnd<T extends { end: string }>(items: T[]): T[] {
  return items.filter(i => i.end >= MIN_DATE);
}

function migrateData(data: AppData): AppData {
  const cleanSpecialists = (data.specialists || []).filter((s) => !isBlacklisted(s));
  const removedSpecIds = new Set(
    (data.specialists || []).filter(isBlacklisted).map((s) => s.id)
  );
  const cleanedTrips = filterByEnd(data.trips || [])
    .map((t) => ({ ...t, specialistIds: t.specialistIds.filter((id) => !removedSpecIds.has(id)) }))
    .filter((t) => t.specialistIds.length > 0);
  const cleanVacations = filterByEnd(data.vacations || []).filter((v) => !removedSpecIds.has(v.specialistId));
  const cleanTrainings = filterByEnd(data.trainings || []).filter((tr) => !removedSpecIds.has(tr.specialistId));
  return {
    specialists: cleanSpecialists,
    trips: cleanedTrips,
    servicePeriods: filterByEnd(data.servicePeriods || []),
    vacations: cleanVacations,
    trainings: cleanTrainings,
    archivedIds: data.archivedIds || [],
  };
}

export function loadFromCacheSync(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as AppData & { _schema?: number };
    if (parsed.trips?.some((t: unknown) => (t as { specialistId?: string }).specialistId && !(t as { specialistIds?: string[] }).specialistIds)) {
      parsed.trips = (parsed.trips || []).map((t: unknown) => {
        const tt = t as Trip & { specialistId?: string };
        return { ...tt, specialistIds: tt.specialistIds || (tt.specialistId ? [tt.specialistId] : []) };
      });
    }
    if (!parsed.trainings) parsed.trainings = [];
    if (!parsed.archivedIds) parsed.archivedIds = [];
    const migrated = migrateData(parsed);
    if (migrated.trips.length === 0 && migrated.specialists.length === 0) return null;
    return migrated;
  } catch { return null; }
}

export function saveToCache(data: AppData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION }));
  } catch { /* ignore */ }
}

// === Cloud snapshot (SECURITY DEFINER RPC bypasses RLS) ===
export function scheduleSnapshot(data: AppData): void {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    void saveSnapshot(data);
  }, 800);
}

export async function saveSnapshot(data: AppData): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const username = getCurrentUser() || "anon";
    const { error } = await supabase.rpc("app_save_snapshot", {
      p_data: data as unknown as never,
      p_updated_by: username,
    });
    if (error) {
      console.warn("[saveSnapshot] RPC error:", error.message);
    } else {
      console.info("[saveSnapshot] saved for", username);
    }
  } catch (e) {
    console.warn("[saveSnapshot] network error:", e);
  }
}

export async function loadData(): Promise<AppData> {
  try {
    const supabase = createSupabaseClient();
    const { data: snapshot, error } = await supabase.rpc("app_load_snapshot");
    if (error) {
      console.warn("[loadData] RPC error, fallback:", error.message);
      return loadFromCacheOrSeed();
    }
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) || Object.keys(snapshot as object).length === 0) {
      console.info("[loadData] Empty snapshot, falling back to seed");
      const seed = migrateData({ ...SEED_DATA });
      saveToCache(seed);
      scheduleSnapshot(seed);
      return seed;
    }
    const raw = snapshot as Partial<AppData>;
    const typed: AppData = {
      specialists: (raw.specialists || []) as Specialist[],
      trips: (raw.trips || []) as Trip[],
      servicePeriods: (raw.servicePeriods || []) as ServicePeriod[],
      vacations: (raw.vacations || []) as Vacation[],
      trainings: (raw.trainings || []) as Training[],
      archivedIds: (raw.archivedIds || []) as string[],
    };
    const result = migrateData(typed);
    saveToCache(result);
    return result;
  } catch (e) {
    console.error("[loadData] Fatal, fallback:", e);
    return loadFromCacheOrSeed();
  }
}

function loadFromCacheOrSeed(): AppData {
  const cached = loadFromCacheSync();
  if (cached && cached.trips.length > 0) return cached;
  return migrateData({ ...SEED_DATA });
}

// Per-table handlers kept as no-ops for backward compatibility.
// Actual persistence is handled by scheduleSnapshot() from page.tsx.
export async function saveTrip(_trip: Trip): Promise<void> { /* snapshot handles */ }
export async function deleteTrip(_tripId: string): Promise<void> { /* snapshot handles */ }
export async function saveSpecialist(_specialist: Specialist): Promise<void> { /* snapshot handles */ }
export async function saveServicePeriods(_objectId: string, _periods: ServicePeriod[]): Promise<void> { /* snapshot handles */ }
export async function saveVacation(_vacation: Vacation): Promise<void> { /* snapshot handles */ }
export async function deleteVacation(_vacationId: string): Promise<void> { /* snapshot handles */ }
export async function saveTraining(_training: Training): Promise<void> { /* snapshot handles */ }
export async function deleteTraining(_trainingId: string): Promise<void> { /* snapshot handles */ }

export function saveTrainings(trainings: Training[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA };
    data.trainings = trainings;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION }));
  } catch { /* ignore */ }
}

export function saveArchivedIds(archivedIds: string[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA };
    data.archivedIds = archivedIds;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _schema: SCHEMA_VERSION }));
  } catch { /* ignore */ }
}

export function clearData(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}
