import type { AppData, Specialist, Trip } from "./types";
import { SEED_DATA } from "./data";
import { createClient } from "./supabase-browser";

// === Загрузка всех данных из Supabase ===
export async function loadData(): Promise<AppData> {
  const supabase = createClient();
  
  try {
    const [specResult, tripsResult] = await Promise.all([
      supabase.from("specialists").select("*").order("id"),
      supabase.from("trips").select("*").order("start_date"),
    ]);

    if (specResult.error || tripsResult.error) {
      console.error("Ошибка загрузки:", specResult.error || tripsResult.error);
      return SEED_DATA;
    }

    // Преобразуем данные из Supabase в формат AppData
    const specialists: Specialist[] = (specResult.data || []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
    }));

    const trips: Trip[] = (tripsResult.data || []).map((t) => ({
      id: t.id,
      specialistId: t.specialist_id,
      city: t.city,
      purpose: t.purpose,
      start: t.start_date,
      end: t.end_date,
      note: t.note || undefined,
    }));

    if (specialists.length === 0 && trips.length === 0) {
      // База пуста — сидируем начальными данными
      await seedInitialData();
      return SEED_DATA;
    }

    return { specialists, trips };
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    return SEED_DATA;
  }
}

// === Сидирование начальных данных ===
async function seedInitialData(): Promise<void> {
  const supabase = createClient();
  
  try {
    // Вставляем специалистов
    await supabase.from("specialists").insert(
      SEED_DATA.specialists.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
      }))
    );

    // Вставляем командировки
    await supabase.from("trips").insert(
      SEED_DATA.trips.map((t) => ({
        id: t.id,
        specialist_id: t.specialistId,
        city: t.city,
        purpose: t.purpose,
        start_date: t.start,
        end_date: t.end,
        note: t.note || "",
      }))
    );
  } catch (e) {
    console.error("Ошибка сидирования:", e);
  }
}

// === Сохранение командировки (создание или обновление) ===
export async function saveTrip(trip: Trip): Promise<void> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.from("trips").upsert({
      id: trip.id,
      specialist_id: trip.specialistId,
      city: trip.city,
      purpose: trip.purpose,
      start_date: trip.start,
      end_date: trip.end,
      note: trip.note || "",
    });

    if (error) {
      console.error("Ошибка сохранения командировки:", error);
    }
  } catch (e) {
    console.error("Ошибка сохранения командировки:", e);
  }
}

// === Удаление командировки ===
export async function deleteTrip(tripId: string): Promise<void> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      console.error("Ошибка удаления командировки:", error);
    }
  } catch (e) {
    console.error("Ошибка удаления командировки:", e);
  }
}

// === Сохранение нового специалиста ===
export async function saveSpecialist(specialist: Specialist): Promise<void> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.from("specialists").upsert({
      id: specialist.id,
      name: specialist.name,
      color: specialist.color,
    });

    if (error) {
      console.error("Ошибка сохранения специалиста:", error);
    }
  } catch (e) {
    console.error("Ошибка сохранения специалиста:", e);
  }
}

// === Legacy: для обратной совместимости (не используется) ===
export function clearData(): void {
  console.warn("clearData() не поддерживается в Supabase режиме");
}
