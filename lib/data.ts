import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training } from "./types";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316"];

const SEED_SPECIALISTS: Specialist[] = [
  { id: "АДА", name: "АДА", color: COLORS[0] }, { id: "ККА", name: "ККА", color: COLORS[1] }, { id: "СНМ", name: "СНМ", color: COLORS[2] },
  { id: "ЧАС", name: "ЧАС", color: COLORS[3] }, { id: "СМВ", name: "СМВ", color: COLORS[4] }, { id: "ТИС", name: "ТИС", color: COLORS[5] },
  { id: "ТАА", name: "ТАА", color: COLORS[6] }, { id: "ЯН", name: "ЯН", color: COLORS[7] }, { id: "КДА", name: "КДА", color: COLORS[8] },
];

const SEED_TRIPS: Trip[] = [
  { id: "t1", specialistIds: ["АДА", "ККА"], city: "Сахалинская Энергия", purpose: "ОБТК", equipment: "Силовой трансформатор", start: "2026-10-05", end: "2026-10-15" },
  { id: "t3", specialistIds: ["СНМ", "ЧАС"], city: "Краснодарская ТЭЦ", purpose: "КДО", equipment: "ЭД 6 кВ, бл.2-4", start: "2026-10-20", end: "2026-11-05", note: "ЭД 6 кВ, бл.2-4" },
  { id: "t5", specialistIds: ["СМВ", "ТИС"], city: "Прегольская ТЭС", purpose: "ТИ", equipment: "ТГ-10, 11", start: "2026-11-10", end: "2026-11-20", note: "ТГ-10, 11" },
  { id: "t7", specialistIds: ["ТАА", "ЯН"], city: "Калининградская ТЭЦ-2", purpose: "ЧР", equipment: "Г-10, 11", start: "2026-11-25", end: "2026-12-05", note: "Г-10, 11" },
  { id: "t9", specialistIds: ["КДА"], city: "Астраханская ТЭЦ-2", purpose: "КДО", equipment: "ТГ-4, Т-4", start: "2026-12-10", end: "2026-12-20", note: "ТГ-4, Т-4" },
  { id: "t11", specialistIds: ["АДА", "ЧАС"], city: "Шатурская ГРЭС", purpose: "КДО", equipment: "ТГ-2, 5", start: "2026-12-01", end: "2026-12-08", note: "ТГ-2, 5" },
  { id: "t13", specialistIds: ["СНМ", "ЯН"], city: "Ставропольская ГРЭС", purpose: "ВД", equipment: "ТГ-2, 3", start: "2026-10-01", end: "2026-10-10", note: "ТГ-2, 3" },
  { id: "t15", specialistIds: ["ККА", "АДА"], city: "Сочинская ТЭС", purpose: "КДО", equipment: "ГТУ-1, 2", start: "2026-11-01", end: "2026-11-08", note: "ГТУ-1, 2" },
  { id: "t17", specialistIds: ["АДА", "СМВ"], city: "Новочеркасская ГРЭС", purpose: "ОБТК", equipment: "ТГ-3, 4", start: "2027-01-15", end: "2027-01-25", note: "ТГ-3, 4" },
  { id: "t18", specialistIds: ["ККА", "ТАА"], city: "Костромская ГРЭС", purpose: "КДО", equipment: "Г-12, 13", start: "2027-02-10", end: "2027-02-20", note: "Г-12, 13" },
  { id: "t19", specialistIds: ["СНМ", "ТИС"], city: "Рязанская ГРЭС", purpose: "ТИ", equipment: "ТГ-5, 6", start: "2027-03-05", end: "2027-03-15", note: "ТГ-5, 6" },
];

const SEED_SERVICE_PERIODS: ServicePeriod[] = [
  { id: "sp1", objectId: "Сахалинская Энергия|ОБТК", start: "2026-10-01", end: "2026-10-20" },
  { id: "sp2", objectId: "Сахалинская Энергия|ОБТК", start: "2026-11-01", end: "2026-11-15" },
  { id: "sp3", objectId: "Краснодарская ТЭЦ|КДО", start: "2026-10-15", end: "2026-11-10" },
  { id: "sp4", objectId: "Прегольская ТЭС|ТИ", start: "2026-11-05", end: "2026-11-25" },
  { id: "sp5", objectId: "Ставропольская ГРЭС|ВД", start: "2026-09-25", end: "2026-10-15" },
  { id: "sp6", objectId: "Сочинская ТЭС|КДО", start: "2026-10-28", end: "2026-11-12" },
  { id: "sp7", objectId: "Новочеркасская ГРЭС|ОБТК", start: "2027-01-10", end: "2027-01-30" },
  { id: "sp8", objectId: "Костромская ГРЭС|КДО", start: "2027-02-05", end: "2027-02-25" },
];

const SEED_VACATIONS: Vacation[] = [
  { id: "v1", specialistId: "АДА", start: "2026-10-25", end: "2026-11-03" },
  { id: "v2", specialistId: "ККА", start: "2026-12-15", end: "2026-12-28" },
  { id: "v3", specialistId: "СНМ", start: "2026-11-20", end: "2026-11-30" },
  { id: "v4", specialistId: "ТИС", start: "2026-10-18", end: "2026-10-25" },
  { id: "v5", specialistId: "СМВ", start: "2027-01-05", end: "2027-01-12" },
];

const SEED_TRAININGS: Training[] = [
  { id: "tr1", specialistId: "АДА", title: "Повышение квалификации по ОТ", start: "2026-11-10", end: "2026-11-14" },
  { id: "tr2", specialistId: "ККА", title: "Курс по диагностике ТГ", start: "2026-10-15", end: "2026-10-19" },
  { id: "tr3", specialistId: "СМВ", title: "Обучение работе с ЧР", start: "2026-12-01", end: "2026-12-05" },
  { id: "tr4", specialistId: "ТАА", title: "Аттестация по электробезопасности", start: "2026-11-18", end: "2026-11-22" },
  { id: "tr5", specialistId: "ЧАС", title: "Семинар по КДО", start: "2026-11-10", end: "2026-11-13" },
  { id: "tr6", specialistId: "ЯН", title: "Курс по диагностике ЧР", start: "2027-02-15", end: "2027-02-19" },
];

export const SEED_DATA: AppData = { specialists: SEED_SPECIALISTS, trips: SEED_TRIPS, servicePeriods: SEED_SERVICE_PERIODS, vacations: SEED_VACATIONS, trainings: SEED_TRAININGS, archivedIds: [] };

export function parseDate(s: string): Date { if (!s || typeof s !== "string") return new Date(); const parts = s.split("-").map(Number); if (parts.length !== 3 || parts.some(isNaN)) return new Date(); const [y, m, d] = parts; const date = new Date(y, m - 1, d); return isNaN(date.getTime()) ? new Date() : date; }
export function formatDate(s: string): string { if (!s || typeof s !== "string") return "—"; const d = parseDate(s); if (isNaN(d.getTime())) return "—"; const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]; return `${d.getDate()} ${months[d.getMonth()]}`; }
export function formatDateRange(start: string, end: string): string { return `${formatDate(start)} — ${formatDate(end)}`; }
export function diffDays(a: Date, b: Date): number { const ms = b.getTime() - a.getTime(); return Math.round(ms / 86400000); }
export function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
export function startOfMonth(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), 1); }
export function endOfMonth(date: Date): Date { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
export function daysInMonth(date: Date): number { return endOfMonth(date).getDate(); }
export function monthName(date: Date): string { const names = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]; return `${names[date.getMonth()]} ${date.getFullYear()}`; }
export function monthNameShort(date: Date): string { const names = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]; const year = date.getFullYear(); if (year === 2026) return names[date.getMonth()]; return `${names[date.getMonth()]} ${year}`; }
export function today(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
export function toISODate(date: Date): string { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }
export function getSpecialistColor(specialists: Specialist[], id: string): string { return specialists.find((s) => s.id === id)?.color || "#6b7280"; }
