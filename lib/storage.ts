import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training } from "./types";
import { SEED_DATA } from "./data";
import { createSupabaseClient } from "./supabase-browser";

const CACHE_KEY = "trip-schedule-cache";

/**
 * Безопасная обёртка для Supabase-запросов.
 * Возвращает { data, error } при успехе или { data: null, error } при ошибке.
 * Тип `any` — чтобы TS не ругался на generic PostgrestBuilder.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuery(queryFn: () => Promise<any>): Promise<any> {
  try {
    const result = await queryFn();
    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[SafeQuery] Supabase error:", msg);
    return { data: null, error: { message: msg } };
  }
}

export async function loadData(): Promise<AppData> {
  try {
    const supabase = createSupabaseClient();

    const specs = await safeQuery(() =>
      supabase.from("specialists").select("*").order("id")
    );
    const tripsRes = await safeQuery(() =>
      supabase.from("trips").select("*").order("start_date")
    );
    const spRes = await safeQuery(() =>
      supabase.from("service_periods").select("*")
    );
    const vacRes = await safeQuery(() =>
      supabase.from("vacations").select("*")
    );
    const trRes = await safeQuery(() =>
      supabase.from("trainings").select("*")
    );

    const hasCriticalError =
      specs?.error || tripsRes?.error || spRes?.error || vacRes?.error || trRes?.error;

    if (hasCriticalError) {
      console.warn("[loadData] Supabase error, falling back:", {
        specialists: specs?.error?.message,
        trips: tripsRes?.error?.message,
        service_periods: spRes?.error?.message,
        vacations: vacRes?.error?.message,
        trainings: trRes?.error?.message,
      });
      return loadFromCacheOrSeed();
    }

    if (!specs?.data || !tripsRes?.data) {
      console.warn("[loadData] No data from Supabase, falling back");
      return loadFromCacheOrSeed();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specialists: Specialist[] = (specs.data || []).map((s: any) => ({
      id: s.id as string,
      name: s.name as string,
      color: (s.color as string) || "#3b82f6",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripsList: Trip[] = (tripsRes.data || []).map((t: any) => {
      let specialistIds: string[];
      const specialistIdsRaw = t.specialist_ids;
      const specialistId = t.specialist_id as string | undefined;

      if (specialistIdsRaw && typeof specialistIdsRaw === "string") {
        try {
          specialistIds = JSON.parse(specialistIdsRaw);
          if (!Array.isArray(specialistIds)) {
            specialistIds = specialistId ? [specialistId] : [];
          }
        } catch {
          specialistIds = specialistId ? [specialistId] : [];
        }
      } else if (specialistId) {
        specialistIds = [specialistId];
      } else {
        specialistIds = [];
      }

      return {
        id: t.id as string,
        specialistIds,
        city: t.city as string,
        purpose: t.purpose as string,
        equipment: (t.equipment as string) || undefined,
        start: t.start_date as string,
        end: t.end_date as string,
        note: (t.note as string) || undefined,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicePeriods: ServicePeriod[] = (spRes?.data || []).map((sp: any) => ({
      id: sp.id as string,
      objectId: sp.object_id as string,
      start: sp.start_date as string,
      end: sp.end_date as string,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vacations: Vacation[] = (vacRes?.data || []).map((v: any) => ({
      id: v.id as string,
      specialistId: v.specialist_id as string,
      start: v.start_date as string,
      end: v.end_date as string,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trainings: Training[] = (trRes?.data || []).map((t: any) => ({
      id: t.id as string,
      specialistId: t.specialist_id as string,
      title: (t.title as string) || "",
      start: t.start_date as string,
      end: t.end_date as string,
    }));

    let archivedIds: string[] = [];
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AppData;
        archivedIds = parsed.archivedIds || [];
      }
    } catch {
      // ignore
    }

    const result: AppData = {
      specialists,
      trips: tripsList,
      servicePeriods,
      vacations,
      trainings,
      archivedIds,
    };

    saveToCache(result);
    return result;
  } catch (e) {
    console.error("[loadData] Fatal error, falling back:", e);
    return loadFromCacheOrSeed();
  }
}

function saveToCache(data: AppData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadFromCacheOrSeed(): AppData {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as AppData;
      if (parsed.specialists && parsed.trips) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (parsed.trips.some((t: any) => (t as any).specialistId && !(t as any).specialistIds)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsed.trips = parsed.trips.map((t: any) => ({
            ...t,
            specialistIds: (t as any).specialistIds || [(t as any).specialistId],
          }));
        }
        if (!parsed.trainings) parsed.trainings = [];
        if (!parsed.archivedIds) parsed.archivedIds = [];
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return SEED_DATA;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeUpsert(tableName: string, data: any): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await supabase.from(tableName).upsert(data as any);
    if (result.error) console.warn(`[safeUpsert] ${tableName}:`, result.error.message);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[safeUpsert] ${tableName}:`, msg);
  }
}

async function safeDelete(tableName: string, column: string, value: string): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const result = await supabase.from(tableName).delete().eq(column, value);
    if (result.error) console.warn(`[safeDelete] ${tableName}:`, result.error.message);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[safeDelete] ${tableName}:`, msg);
  }
}

export async function saveTrip(trip: Trip): Promise<void> {
  await safeUpsert("trips", {
    id: trip.id,
    specialist_id: trip.specialistIds[0] || "",
    specialist_ids: JSON.stringify(trip.specialistIds),
    city: trip.city,
    purpose: trip.purpose,
    equipment: trip.equipment || "",
    start_date: trip.start,
    end_date: trip.end,
    note: trip.note || "",
  });
}

export async function deleteTrip(tripId: string): Promise<void> {
  await safeDelete("trips", "id", tripId);
}

export async function saveSpecialist(specialist: Specialist): Promise<void> {
  await safeUpsert("specialists", {
    id: specialist.id,
    name: specialist.name,
    color: specialist.color,
  });
}

export async function saveServicePeriods(objectId: string, periods: ServicePeriod[]): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("service_periods").delete().eq("object_id", objectId);
    if (periods.length > 0) {
      const { error } = await supabase.from("service_periods").insert(
        periods.map((p) => ({
          id: p.id,
          object_id: p.objectId,
          start_date: p.start,
          end_date: p.end,
        }))
      );
      if (error) console.warn("[saveServicePeriods]:", error.message);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[saveServicePeriods]:", msg);
  }
}

export async function saveVacation(vacation: Vacation): Promise<void> {
  await safeUpsert("vacations", {
    id: vacation.id,
    specialist_id: vacation.specialistId,
    start_date: vacation.start,
    end_date: vacation.end,
  });
}

export async function deleteVacation(vacationId: string): Promise<void> {
  await safeDelete("vacations", "id", vacationId);
}

export async function saveTraining(training: Training): Promise<void> {
  await safeUpsert("trainings", {
    id: training.id,
    specialist_id: training.specialistId,
    title: training.title,
    start_date: training.start,
    end_date: training.end,
  });
}

export async function deleteTraining(trainingId: string): Promise<void> {
  await safeDelete("trainings", "id", trainingId);
}

export function saveTrainings(trainings: Training[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA };
    data.trainings = trainings;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function saveArchivedIds(archivedIds: string[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? (JSON.parse(cached) as AppData) : { ...SEED_DATA };
    data.archivedIds = archivedIds;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
