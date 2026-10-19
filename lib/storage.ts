import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training } from "./types";
import { SEED_DATA } from "./data";
import { createSupabaseClient } from "./supabase-browser";

const CACHE_KEY = "trip-schedule-cache";

// === Загрузка всех данных из Supabase ===
export async function loadData(): Promise<AppData> {
  try {
    const supabase = createSupabaseClient();

    const results = await Promise.allSettled([
      supabase.from("specialists").select("*").order("id"),
      supabase.from("trips").select("*").order("start_date"),
      supabase.from("service_periods").select("*"),
      supabase.from("vacations").select("*"),
      supabase.from("trainings").select("*"),
    ]);

    const specs = results[0].status === "fulfilled" ? results[0].value : null;
    const tripsRes = results[1].status === "fulfilled" ? results[1].value : null;
    const spRes = results[2].status === "fulfilled" ? results[2].value : null;
    const vacRes = results[3].status === "fulfilled" ? results[3].value : null;
    const trRes = results[4].status === "fulfilled" ? results[4].value : null;

    // Если есть критическая ошибка — кеш/seed
    if (specs?.error || tripsRes?.error) {
      console.warn("Supabase ошибка, используем кеш/seed:", specs?.error || tripsRes?.error);
      return loadFromCacheOrSeed();
    }

    const specialists: Specialist[] = (specs?.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      color: s.color,
    }));

    // Парсим trips с обратной совместимостью
    const tripsList: Trip[] = (tripsRes?.data || []).map((t: any) => {
      let specialistIds: string[];
      if (t.specialist_ids) {
        try {
          specialistIds = JSON.parse(t.specialist_ids);
          if (!Array.isArray(specialistIds)) specialistIds = [t.specialist_id || t.specialist_ids];
        } catch {
          specialistIds = t.specialist_id ? [t.specialist_id] : [];
        }
      } else if (t.specialist_id) {
        specialistIds = [t.specialist_id];
      } else {
        specialistIds = [];
      }

      return {
        id: t.id,
        specialistIds,
        city: t.city,
        purpose: t.purpose,
        equipment: t.equipment || undefined,
        start: t.start_date,
        end: t.end_date,
        note: t.note || undefined,
      };
    });

    const servicePeriods: ServicePeriod[] = (spRes?.data || []).map((sp: any) => ({
      id: sp.id,
      objectId: sp.object_id,
      start: sp.start_date,
      end: sp.end_date,
    }));

    const vacations: Vacation[] = (vacRes?.data || []).map((v: any) => ({
      id: v.id,
      specialistId: v.specialist_id,
      start: v.start_date,
      end: v.end_date,
    }));

    const trainings: Training[] = (trRes?.data || []).map((t: any) => ({
      id: t.id,
      specialistId: t.specialist_id,
      title: t.title || "",
      start: t.start_date,
      end: t.end_date,
    }));

    // Архив из localStorage (metadata, не критично)
    let archivedIds: string[] = [];
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AppData;
        archivedIds = parsed.archivedIds || [];
      }
    } catch {}

    // Если база пуста — сидируем
    if (specialists.length === 0 && tripsList.length === 0) {
      await seedInitialData().catch(() => {});
      const fresh = await loadDataFromSupabase(supabase);
      if (fresh && (fresh.specialists.length > 0 || fresh.trips.length > 0)) {
        const result = { ...fresh, archivedIds };
        saveToCache(result);
        return result;
      }
      saveToCache(SEED_DATA);
      return SEED_DATA;
    }

    const result: AppData = { specialists, trips: tripsList, servicePeriods, vacations, trainings, archivedIds };
    saveToCache(result);
    return result;
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    return loadFromCacheOrSeed();
  }
}

async function loadDataFromSupabase(supabase: ReturnType<typeof createSupabaseClient>): Promise<AppData | null> {
  try {
    const results = await Promise.allSettled([
      supabase.from("specialists").select("*").order("id"),
      supabase.from("trips").select("*").order("start_date"),
      supabase.from("service_periods").select("*"),
      supabase.from("vacations").select("*"),
      supabase.from("trainings").select("*"),
    ]);

    const specs = results[0].status === "fulfilled" ? results[0].value : null;
    const tripsRes = results[1].status === "fulfilled" ? results[1].value : null;
    const spRes = results[2].status === "fulfilled" ? results[2].value : null;
    const vacRes = results[3].status === "fulfilled" ? results[3].value : null;
    const trRes = results[4].status === "fulfilled" ? results[4].value : null;

    if (specs?.error || tripsRes?.error) return null;

    const specialists: Specialist[] = (specs?.data || []).map((s: any) => ({
      id: s.id, name: s.name, color: s.color,
    }));

    const trips: Trip[] = (tripsRes?.data || []).map((t: any) => {
      let specialistIds: string[];
      if (t.specialist_ids) {
        try {
          specialistIds = JSON.parse(t.specialist_ids);
          if (!Array.isArray(specialistIds)) specialistIds = [t.specialist_id || t.specialist_ids];
        } catch {
          specialistIds = t.specialist_id ? [t.specialist_id] : [];
        }
      } else if (t.specialist_id) {
        specialistIds = [t.specialist_id];
      } else {
        specialistIds = [];
      }
      return {
        id: t.id, specialistIds, city: t.city, purpose: t.purpose,
        equipment: t.equipment || undefined, start: t.start_date, end: t.end_date, note: t.note || undefined,
      };
    });

    const servicePeriods: ServicePeriod[] = (spRes?.data || []).map((sp: any) => ({
      id: sp.id, objectId: sp.object_id, start: sp.start_date, end: sp.end_date,
    }));

    const vacations: Vacation[] = (vacRes?.data || []).map((v: any) => ({
      id: v.id, specialistId: v.specialist_id, start: v.start_date, end: v.end_date,
    }));

    const trainings: Training[] = (trRes?.data || []).map((t: any) => ({
      id: t.id, specialistId: t.specialist_id, title: t.title || "", start: t.start_date, end: t.end_date,
    }));

    return { specialists, trips, servicePeriods, vacations, trainings };
  } catch {
    return null;
  }
}

// === Кеш ===
function saveToCache(data: AppData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function loadFromCacheOrSeed(): AppData {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as AppData;
      if (parsed.specialists && parsed.trips) {
        if (parsed.trips.some((t: any) => t.specialistId && !t.specialistIds)) {
          parsed.trips = parsed.trips.map((t: any) => ({
            ...t,
            specialistIds: t.specialistIds || [t.specialistId],
          }));
        }
        if (!parsed.trainings) parsed.trainings = [];
        if (!parsed.archivedIds) parsed.archivedIds = [];
        return parsed;
      }
    }
  } catch {}
  return SEED_DATA;
}

// === Сидирование ===
async function seedInitialData(): Promise<void> {
  const supabase = createSupabaseClient();

  await supabase.from("specialists").insert(
    SEED_DATA.specialists.map((s) => ({ id: s.id, name: s.name, color: s.color }))
  ).then(r => { if (r.error) console.warn("Seed specialists error:", r.error.message); });

  await supabase.from("trips").insert(
    SEED_DATA.trips.map((t) => ({
      id: t.id,
      specialist_id: t.specialistIds[0] || "",
      specialist_ids: JSON.stringify(t.specialistIds),
      city: t.city,
      purpose: t.purpose,
      equipment: t.equipment || "",
      start_date: t.start,
      end_date: t.end,
      note: t.note || "",
    }))
  ).then(r => { if (r.error) console.warn("Seed trips error:", r.error.message); });

  await supabase.from("service_periods").insert(
    (SEED_DATA.servicePeriods || []).map((sp) => ({
      id: sp.id, object_id: sp.objectId, start_date: sp.start, end_date: sp.end,
    }))
  ).then(r => { if (r.error) console.warn("Seed service_periods error:", r.error.message); });

  await supabase.from("vacations").insert(
    (SEED_DATA.vacations || []).map((v) => ({
      id: v.id, specialist_id: v.specialistId, start_date: v.start, end_date: v.end,
    }))
  ).then(r => { if (r.error) console.warn("Seed vacations error:", r.error.message); });

  await supabase.from("trainings").insert(
    (SEED_DATA.trainings || []).map((t) => ({
      id: t.id, specialist_id: t.specialistId, title: t.title, start_date: t.start, end_date: t.end,
    }))
  ).then(r => { if (r.error) console.warn("Seed trainings error:", r.error.message); });
}

// === Сохранение командировки ===
export async function saveTrip(trip: Trip): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("trips").upsert({
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
    if (error) console.warn("saveTrip error:", error.message);
  } catch (e) {
    console.warn("saveTrip catch:", e);
  }
}

// === Удаление командировки ===
export async function deleteTrip(tripId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("trips").delete().eq("id", tripId);
  } catch {}
}

// === Сохранение специалиста ===
export async function saveSpecialist(specialist: Specialist): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("specialists").upsert({
      id: specialist.id, name: specialist.name, color: specialist.color,
    });
  } catch {}
}

// === Сохранение периодов оказания услуг для объекта ===
export async function saveServicePeriods(objectId: string, periods: ServicePeriod[]): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("service_periods").delete().eq("object_id", objectId);
    if (periods.length > 0) {
      const { error } = await supabase.from("service_periods").insert(
        periods.map((p) => ({
          id: p.id, object_id: p.objectId, start_date: p.start, end_date: p.end,
        }))
      );
      if (error) console.warn("saveServicePeriods error:", error.message);
    }
  } catch (e) {
    console.warn("saveServicePeriods catch:", e);
  }
}

// === Сохранение отпуска ===
export async function saveVacation(vacation: Vacation): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("vacations").upsert({
      id: vacation.id,
      specialist_id: vacation.specialistId,
      start_date: vacation.start,
      end_date: vacation.end,
    });
    if (error) console.warn("saveVacation error:", error.message);
  } catch (e) {
    console.warn("saveVacation catch:", e);
  }
}

// === Удаление отпуска ===
export async function deleteVacation(vacationId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("vacations").delete().eq("id", vacationId);
  } catch {}
}

// === Сохранение обучения (Supabase) ===
export async function saveTraining(training: Training): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("trainings").upsert({
      id: training.id,
      specialist_id: training.specialistId,
      title: training.title,
      start_date: training.start,
      end_date: training.end,
    });
    if (error) console.warn("saveTraining error:", error.message);
  } catch (e) {
    console.warn("saveTraining catch:", e);
  }
}

// === Удаление обучения ===
export async function deleteTraining(trainingId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await supabase.from("trainings").delete().eq("id", trainingId);
  } catch {}
}

// === Сохранение обучения (localStorage legacy — для совместимости) ===
export function saveTrainings(trainings: Training[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? JSON.parse(cached) as AppData : { ...SEED_DATA };
    data.trainings = trainings;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

// === Сохранение архивированных объектов ===
export function saveArchivedIds(archivedIds: string[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? JSON.parse(cached) as AppData : { ...SEED_DATA };
    data.archivedIds = archivedIds;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

// === Legacy ===
export function clearData(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}
