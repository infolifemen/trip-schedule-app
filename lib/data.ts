import type { AppData, Specialist, Trip, ServiceMarker } from "./types";

// Цветовая палитра для специалистов (используется только для фильтров)
const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316",
];

const SEED_SPECIALISTS: Specialist[] = [
  { id: "АДА", name: "АДА", color: COLORS[0] },
  { id: "ККА", name: "ККА", color: COLORS[1] },
  { id: "СНМ", name: "СНМ", color: COLORS[2] },
  { id: "ЧАС", name: "ЧАС", color: COLORS[3] },
  { id: "СМВ", name: "СМВ", color: COLORS[4] },
  { id: "ТИС", name: "ТИС", color: COLORS[5] },
  { id: "ТАА", name: "ТАА", color: COLORS[6] },
  { id: "ЯН", name: "ЯН", color: COLORS[7] },
  { id: "КДА", name: "КДА", color: COLORS[8] },
  { id: "СДС", name: "СДС", color: COLORS[9] },
];

const SEED_TRIPS: Trip[] = [
  { id: "t1", specialistId: "АДА", city: "Сахалинская Энергия", purpose: "ОБТК", start: "2026-10-05", end: "2026-10-15" },
  { id: "t2", specialistId: "ККА", city: "Сахалинская Энергия", purpose: "ОБТК", start: "2026-10-05", end: "2026-10-15" },
  { id: "t3", specialistId: "СНМ", city: "Краснодарская ТЭЦ", purpose: "КДО", start: "2026-10-20", end: "2026-11-05", note: "ЭД 6 кВ, бл.2-4" },
  { id: "t4", specialistId: "ЧАС", city: "Краснодарская ТЭЦ", purpose: "КДО", start: "2026-10-20", end: "2026-11-05", note: "ЭД 6 кВ" },
  { id: "t5", specialistId: "СМВ", city: "Прегольская ТЭС", purpose: "ТИ", start: "2026-11-10", end: "2026-11-20", note: "ТГ-10, 11" },
  { id: "t6", specialistId: "ТИС", city: "Прегольская ТЭС", purpose: "ТИ", start: "2026-11-10", end: "2026-11-20", note: "ТГ-10, 11" },
  { id: "t7", specialistId: "ТАА", city: "Калининградская ТЭЦ-2", purpose: "ЧР", start: "2026-11-25", end: "2026-12-05", note: "Г-10, 11" },
  { id: "t8", specialistId: "ЯН", city: "Калининградская ТЭЦ-2", purpose: "ЧР", start: "2026-11-25", end: "2026-12-05", note: "Г-10, 11" },
  { id: "t9", specialistId: "КДА", city: "Астраханская ТЭЦ-2", purpose: "КДО", start: "2026-12-10", end: "2026-12-20", note: "ТГ-4, Т-4" },
  { id: "t10", specialistId: "СДС", city: "Астраханская ТЭЦ-2", purpose: "КДО", start: "2026-12-10", end: "2026-12-20", note: "ТГ-4, Т-4" },
  { id: "t11", specialistId: "АДА", city: "Шатурская ГРЭС", purpose: "КДО", start: "2026-12-01", end: "2026-12-08", note: "ТГ-2, 5" },
  { id: "t12", specialistId: "ЧАС", city: "Шатурская ГРЭС", purpose: "КДО", start: "2026-12-01", end: "2026-12-08", note: "ТГ-2, 5" },
  { id: "t13", specialistId: "СНМ", city: "Ставропольская ГРЭС", purpose: "ВД", start: "2026-10-01", end: "2026-10-10", note: "ТГ-2, 3" },
  { id: "t14", specialistId: "ЯН", city: "Ставропольская ГРЭС", purpose: "ВД", start: "2026-10-01", end: "2026-10-10", note: "ТГ-2, 3" },
  { id: "t15", specialistId: "ККА", city: "Сочинская ТЭС", purpose: "КДО", start: "2026-11-01", end: "2026-11-08", note: "ГТУ-1, 2" },
  { id: "t16", specialistId: "АДА", city: "Сочинская ТЭС", purpose: "КДО", start: "2026-11-01", end: "2026-11-08", note: "ГТУ-1, 2" },
];

// Маркеры начала и окончания оказания услуг
const SEED_MARKERS: ServiceMarker[] = [
  // Сахалинская Энергия — ОБТК
  { id: "m1", objectId: "Сахалинская Энергия|ОБТК", type: "start", date: "2026-10-05", label: "Начало работ" },
  { id: "m2", objectId: "Сахалинская Энергия|ОБТК", type: "end", date: "2026-10-15", label: "Окончание работ" },
  // Краснодарская ТЭЦ — КДО
  { id: "m3", objectId: "Краснодарская ТЭЦ|КДО", type: "start", date: "2026-10-20", label: "Начало КДО" },
  { id: "m4", objectId: "Краснодарская ТЭЦ|КДО", type: "end", date: "2026-11-05", label: "Окончание КДО" },
  // Прегольская ТЭС — ТИ
  { id: "m5", objectId: "Прегольская ТЭС|ТИ", type: "start", date: "2026-11-10" },
  { id: "m6", objectId: "Прегольская ТЭС|ТИ", type: "end", date: "2026-11-20" },
  // Ставропольская ГРЭС — ВД
  { id: "m7", objectId: "Ставропольская ГРЭС|ВД", type: "start", date: "2026-10-01" },
  { id: "m8", objectId: "Ставропольская ГРЭС|ВД", type: "end", date: "2026-10-10" },
];

export const SEED_DATA: AppData = {
  specialists: SEED_SPECIALISTS,
  trips: SEED_TRIPS,
  serviceMarkers: SEED_MARKERS,
};

// === Утилиты для работы с датами ===

export function parseDate(s: string): Date {
  if (!s || typeof s !== "string") return new Date();
  const parts = s.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? new Date() : date;
}

export function formatDate(s: string): string {
  if (!s || typeof s !== "string") return "—";
  const d = parseDate(s);
  if (isNaN(d.getTime())) return "—";
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function diffDays(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function daysInMonth(date: Date): number {
  return endOfMonth(date).getDate();
}

export function monthName(date: Date): string {
  const names = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  return `${names[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthNameShort(date: Date): string {
  const names = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return `${names[date.getMonth()]} ${date.getFullYear()}`;
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getSpecialistColor(specialists: Specialist[], id: string): string {
  return specialists.find((s) => s.id === id)?.color || "#6b7280";
}
