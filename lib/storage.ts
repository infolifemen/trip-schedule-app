import type { AppData } from "./types";
import { SEED_DATA } from "./data";

const STORAGE_KEY = "trip-schedule-data-v1";

export function loadData(): AppData {
  if (typeof window === "undefined") return SEED_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_DATA;
    const parsed = JSON.parse(raw) as AppData;
    
    // Базовая проверка структуры
    if (!Array.isArray(parsed.specialists) || !Array.isArray(parsed.trips)) {
      return SEED_DATA;
    }
    
    // Валидация каждого специалиста
    for (const spec of parsed.specialists) {
      if (!spec.id || !spec.name || !spec.color) {
        return SEED_DATA;
      }
    }
    
    // Валидация каждой командировки
    for (const trip of parsed.trips) {
      if (!trip.id || !trip.specialistId || !trip.city) {
        return SEED_DATA;
      }
      if (!trip.start || typeof trip.start !== "string") {
        return SEED_DATA;
      }
      if (!trip.end || typeof trip.end !== "string") {
        return SEED_DATA;
      }
      // Проверка формата даты (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trip.start) || !dateRegex.test(trip.end)) {
        return SEED_DATA;
      }
    }
    
    return parsed;
  } catch {
    return SEED_DATA;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Не удалось сохранить данные:", e);
  }
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
