import type { AppData, Specialist, Trip } from "./types";
import { SEED_DATA } from "./data";

const STORAGE_KEY = "trip_schedule_data";

// === Загрузка всех данных из localStorage ===
export async function loadData(): Promise<AppData> {
  try {
    // Небольшая задержка для имитации асинхронности (не обязательно)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      // Первый запуск — сохраняем SEED_DATA в localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    
    const parsed = JSON.parse(stored) as AppData;
    
    // Валидация данных
    if (!parsed.specialists || !parsed.trips) {
      console.warn("Данные в localStorage повреждены, используем SEED_DATA");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    
    return parsed;
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    // В случае ошибки — возвращаем SEED_DATA
    return SEED_DATA;
  }
}

// === Сохранение данных в localStorage ===
function saveToStorage(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Ошибка сохранения в localStorage:", e);
  }
}

// === Получение текущих данных ===
function getCurrentData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return SEED_DATA;
    return JSON.parse(stored) as AppData;
  } catch {
    return SEED_DATA;
  }
}

// === Сохранение командировки (создание или обновление) ===
export async function saveTrip(trip: Trip): Promise<void> {
  const data = getCurrentData();
  const existingIdx = data.trips.findIndex(t => t.id === trip.id);
  
  if (existingIdx >= 0) {
    // Обновление существующей
    data.trips[existingIdx] = trip;
  } else {
    // Создание новой
    data.trips.push(trip);
  }
  
  saveToStorage(data);
}

// === Удаление командировки ===
export async function deleteTrip(tripId: string): Promise<void> {
  const data = getCurrentData();
  data.trips = data.trips.filter(t => t.id !== tripId);
  saveToStorage(data);
}

// === Сохранение нового специалиста ===
export async function saveSpecialist(specialist: Specialist): Promise<void> {
  const data = getCurrentData();
  const existingIdx = data.specialists.findIndex(s => s.id === specialist.id);
  
  if (existingIdx >= 0) {
    data.specialists[existingIdx] = specialist;
  } else {
    data.specialists.push(specialist);
  }
  
  saveToStorage(data);
}

// === Сброс данных к начальному состоянию ===
export async function resetData(): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
}

// === Legacy: для обратной совместимости ===
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}