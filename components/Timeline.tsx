"use client";

import { memo, useMemo, useEffect, useCallback, useState } from "react";
import type { Specialist, Trip, TimelineObject, ServicePeriod, Vacation, Training } from "@/lib/types";
import { parseDate, diffDays, addDays, startOfMonth, today } from "@/lib/data";

interface TimelineProps {
  specialists: Specialist[]; trips: Trip[]; servicePeriods?: ServicePeriod[]; vacations?: Vacation[]; trainings?: Training[];
  archivedIds?: string[]; showArchived?: boolean; onSelectTrip?: (trip: Trip) => void; onAddVacation?: () => void;
  onDeleteVacation?: (vacationId: string) => void; onEditVacation?: (vacation: Vacation) => void; onAddTraining?: () => void;
  onDeleteTraining?: (trainingId: string) => void; onEditTraining?: (training: Training) => void;
}

const PX_PER_DAY = 20; const ROW_HEIGHT = 44; const LEFT_COL_WIDTH = 220; const HEADER_HEIGHT = 56;
const TRIP_BAR_COLOR = "#2563eb"; const TRIP_BAR_HOVER = "#1d4ed8"; const MARKER_START_COLOR = "#16a34a"; const MARKER_END_COLOR = "#dc2626";
const BG = "#f0eeeb"; const CARD_BG = "rgba(255,255,255,0.98)"; const BORDER = "rgba(0,0,0,0.06)"; const TEXT_DIM = "#5a5a72"; const TEXT_BRIGHT = "#1a1a2e";
const ARCHIVED_BG = "rgba(245,158,11,0.06)"; const VACATION_GLASS = "rgba(245, 158, 11, 0.25)"; const TRAINING_BAR_COLOR = "#8b5cf6";

function formatDay(d: Date): string { return String(d.getDate()); }
function formatDayWeekday(d: Date): string { const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]; return weekdays[d.getDay()]; }
function isWeekend(d: Date): boolean { const day = d.getDay(); return day === 0 || day === 6; }

function groupTripsByObject(trips: Trip[]): TimelineObject[] {
  const map = new Map<string, TimelineObject>();
  for (const trip of trips) {
    const id = `${trip.city}|${trip.purpose}`;
    if (!map.has(id)) { map.set(id, { id, city: trip.city, purpose: trip.purpose, equipment: trip.equipment, trips: [], servicePeriods: [] }); }
    map.get(id)!.trips.push(trip);
    if (trip.equipment) map.get(id)!.equipment = trip.equipment;
  }
  return Array.from(map.values()).sort((a, b) => {
    const aStart = a.trips.length > 0 ? parseDate(a.trips[0].start).getTime() : 0;
    const bStart = b.trips.length > 0 ? parseDate(b.trips[0].start).getTime() : 0;
    return aStart - bStart;
  });
}

interface VacationBar { start: Date; end: Date; left: number; width: number; names: string[]; count: number; }

function mergeVacationBars(vacations: Vacation[], rangeStart: Date, specialists: Specialist[]): VacationBar[] {
  if (vacations.length === 0) return [];
  const bars = vacations.map(v => ({ start: parseDate(v.start), end: parseDate(v.end), name: specialists.find(s => s.id === v.specialistId)?.name || v.specialistId })).sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: VacationBar[] = [];
  for (const bar of bars) {
    let found = false;
    for (const m of merged) {
      if (bar.start <= addDays(m.end, 1) && bar.end >= addDays(m.start, -1)) { if (bar.start < m.start) m.start = bar.start; if (bar.end > m.end) m.end = bar.end; m.names.push(bar.name); m.count++; found = true; break; }
    }
    if (!found) { merged.push({ start: bar.start, end: bar.end, left: 0, width: 0, names: [bar.name], count: 1 }); }
  }
  for (const m of merged) { m.left = diffDays(rangeStart, m.start) * PX_PER_DAY; m.width = (diffDays(m.start, m.end) + 1) * PX_PER_DAY; }
  return merged;
}

function ObjectTooltip({ obj, servicePeriods, position }: { obj: TimelineObject; servicePeriods: ServicePeriod[]; position: { top: number; left: number } }) {
  const formatDateRu = (s: string) => { if (!s) return "—"; const d = parseDate(s); if (isNaN(d.getTime())) return "—"; const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]; return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`; };
  const objPeriods = servicePeriods.filter(p => p.objectId === obj.id);
  return (
    <div style={{ position: "fixed", top: position.top, left: position.left + 10, zIndex: 100, background: "rgba(15, 23, 42, 0.96)", backdropFilter: "blur(12px)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: 220, maxWidth: 320, fontFamily: "'Inter', -apple-system, sans-serif", pointerEvents: "none" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>📍 {obj.city}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}><span style={{ color: "#64748b" }}>Вид работ: </span><span style={{ color: "#e2e8f0", fontWeight: 500 }}>{obj.purpose || "—"}</span></div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}><span style={{ color: "#64748b" }}>Оборудование: </span><span style={{ color: "#e2e8f0", fontWeight: 500 }}>{obj.equipment || "—"}</span></div>
      </div>
      {objPeriods.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Периоды оказания услуг</div>
          {objPeriods.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(37,99,235,0.2)", color: "#60a5fa", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 11, color: "#e2e8f0" }}>{formatDateRu(p.start)} → {formatDateRu(p.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GridOverlayProps {
  totalDays: number;
  px: number;
  months: { left: number; width: number }[];
  rangeStart: Date;
  showDayLines?: boolean;
  showMonthLines?: boolean;
  showWeekend?: boolean;
}

const GridOverlay = memo(function GridOverlay({
  totalDays,
  px,
  months,
  rangeStart,
  showDayLines = true,
  showMonthLines = true,
  showWeekend = true,
}: GridOverlayProps) {
  const elements: JSX.Element[] = [];
  if (showWeekend) {
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(rangeStart, i);
      if (isWeekend(d)) {
        elements.push(
          <div
            key={`w${i}`}
            data-testid={`weekend-${i}`}
            style={{ position: "absolute", top: 0, bottom: 0, left: i * px, width: px, background: "rgba(220,38,38,0.04)", pointerEvents: "none" }}
          />
        );
      }
    }
  }
  if (showDayLines) {
    for (let i = 1; i < totalDays; i++) {
      elements.push(
        <div
          key={`d${i}`}
          data-testid={`dayline-${i}`}
          style={{ position: "absolute", top: 0, bottom: 0, left: i * px, width: 1, background: "rgba(0,0,0,0.08)", pointerEvents: "none" }}
        />
      );
    }
  }
  if (showMonthLines) {
    months.forEach((m, mi) => {
      if (mi === 0) return;
      elements.push(
        <div
          key={`m${mi}`}
          data-testid={`monthline-${mi}`}
          style={{ position: "absolute", top: 0, bottom: 0, left: m.left, width: 1, background: "rgba(0,0,0,0.14)", pointerEvents: "none" }}
        />
      );
    });
  }
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
      {elements}
    </div>
  );
});

export function Timeline({ specialists, trips, servicePeriods = [], vacations = [], trainings = [], archivedIds = [], showArchived = false, onSelectTrip, onAddVacation, onDeleteVacation, onEditVacation, onAddTraining, onDeleteTraining, onEditTraining }: TimelineProps) {
  const today_date = useMemo(() => today(), []);
  const objects = useMemo(() => groupTripsByObject(trips), [trips]);
  const enrichedObjects = useMemo(() => objects.map((obj) => { const objPeriods = servicePeriods.filter((p) => p.objectId === obj.id); return { ...obj, servicePeriods: objPeriods, archived: archivedIds.includes(obj.id) }; }), [objects, servicePeriods, archivedIds]);
  const visibleObjects = useMemo(() => { if (showArchived) return enrichedObjects.filter(o => o.archived); return enrichedObjects.filter(o => !o.archived); }, [enrichedObjects, showArchived]);

  type RowType = "object" | "vacation" | "training";
  const rows: { type: RowType; data?: TimelineObject }[] = useMemo(() => {
    const result: { type: RowType; data?: TimelineObject }[] = [];
    for (const obj of visibleObjects) result.push({ type: "object", data: obj });
    result.push({ type: "training" }); result.push({ type: "vacation" }); return result;
  }, [visibleObjects, trainings]);

  const range = useMemo(() => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2028, 0, 31);
    const totalDays = diffDays(start, end) + 1;
    return { start, end, totalDays };
  }, []);

  const months = useMemo(() => {
    const result: { label: string; left: number; width: number }[] = []; let current = range.start;
    while (current <= range.end) {
      const monthStart = current < startOfMonth(current) ? startOfMonth(current) : current;
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0); const effectiveEnd = monthEnd > range.end ? range.end : monthEnd;
      const left = diffDays(range.start, monthStart) * PX_PER_DAY; const width = (diffDays(monthStart, effectiveEnd) + 1) * PX_PER_DAY;
      const year = current.getFullYear(); const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
      const label = `${monthNames[current.getMonth()]} ${year}`;
      result.push({ label, left, width }); current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return result;
  }, [range]);

  const days = useMemo(() => Array.from({ length: range.totalDays }, (_, i) => addDays(range.start, i)), [range]);
  const todayOffset = useMemo(() => { const daysFromStart = diffDays(range.start, today_date); if (daysFromStart < 0 || daysFromStart > range.totalDays) return null; return daysFromStart * PX_PER_DAY; }, [range, today_date]);

  // Авто-скролл к сегодняшнему дню — через window (страница скроллится целиком, не внутри container)
  useEffect(() => { if (todayOffset !== null) { const scrollLeft = Math.max(0, todayOffset - window.innerWidth / 3); window.scrollTo({ left: scrollLeft, behavior: "smooth" }); } }, [todayOffset]);

  const totalWidth = range.totalDays * PX_PER_DAY;
  const [tooltipObj, setTooltipObj] = useState<TimelineObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const handleTripClick = useCallback((trip: Trip) => { if (onSelectTrip) onSelectTrip(trip); }, [onSelectTrip]);
  const vacationBars = useMemo(() => mergeVacationBars(vacations, range.start, specialists), [vacations, range.start, specialists]);


  const renderLeftRow = (row: typeof rows[0], idx: number) => {
    if (row.type === "object" && row.data) {
      const obj = row.data;
      return (
        <div key={obj.id} style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, background: showArchived ? ARCHIVED_BG : (idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"), opacity: showArchived ? 0.8 : 1, cursor: "default" }} onMouseEnter={(e) => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltipObj(obj); setTooltipPos({ top: rect.top, left: rect.right }); }} onMouseLeave={() => setTooltipObj(null)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_BRIGHT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{obj.city} — {obj.purpose}</div>
            {obj.equipment && <div style={{ fontSize: 9, color: TEXT_DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{obj.equipment}</div>}
          </div>
        </div>
      );
    } else if (row.type === "training") {
      return (
        <div key="training" style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px", background: "rgba(139,92,246,0.04)", borderLeft: "3px solid #8b5cf6", gap: 8 }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#8b5cf6" }}>📚 Обучение</div>
          {onAddTraining && <button onClick={onAddTraining} style={{ padding: "3px 8px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 6, color: "#8b5cf6", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Добавить</button>}
        </div>
      );
    } else if (row.type === "vacation") {
      return (
        <div key="vacation" style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px", background: "rgba(245,158,11,0.04)", borderLeft: "3px solid #f59e0b", gap: 8 }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>🌴 Отпуска</div>
          {onAddVacation && <button onClick={onAddVacation} style={{ padding: "3px 8px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, color: "#f59e0b", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Добавить</button>}
        </div>
      );
    }
    return null;
  };

  const renderRightRow = (row: typeof rows[0], idx: number) => {
    if (row.type === "object" && row.data) {
      const obj = row.data; const objPeriods = servicePeriods.filter(p => p.objectId === obj.id);
      const sortedTrips = [...obj.trips].sort((a, b) => parseDate(a.start).getTime() - parseDate(b.start).getTime());
      const tripBars = sortedTrips.map(trip => { const tStart = parseDate(trip.start); const tEnd = parseDate(trip.end); const left = diffDays(range.start, tStart) * PX_PER_DAY; const width = (diffDays(tStart, tEnd) + 1) * PX_PER_DAY; const names = trip.specialistIds.map(id => specialists.find(s => s.id === id)?.name || id); return { trip, left, width, names }; });
      return (
        <div key={obj.id} style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "relative", background: showArchived ? ARCHIVED_BG : (idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"), opacity: showArchived ? 0.8 : 1 }}>
          {/* === СЛОЙ 1 (z-2): ТОЛЬКО стеклянная полоса периода услуг === */}
          {objPeriods.map((period, pi) => {
            const pStart = parseDate(period.start); const pEnd = parseDate(period.end);
            const startLeft = diffDays(range.start, pStart) * PX_PER_DAY;
            const width = (diffDays(pStart, pEnd) + 1) * PX_PER_DAY;
            if (startLeft + width < 0 || startLeft > totalWidth) return null;
            return (
              <div key={`sp-glass-${pi}`} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 2 }}>
                <div style={{ position: "absolute", top: 6, left: Math.max(startLeft, 0), width: Math.max(width - 2, PX_PER_DAY), height: ROW_HEIGHT - 12, background: "rgba(37,99,235,0.12)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 4, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }} />
              </div>
            );
          })}

          {/* === СЛОЙ 2 (z-4): Плашки командировок === */}
          {tripBars.map((tb, ti) => {
            const displayName = tb.names.length <= 3 ? tb.names.join(", ") : `${tb.names.slice(0, 2).join(", ")} +${tb.names.length - 2}`;
            return (
              <button key={`trip-${ti}`} onClick={() => handleTripClick(tb.trip)} style={{ position: "absolute", top: 8, left: tb.left, width: Math.max(tb.width - 2, PX_PER_DAY - 2), height: ROW_HEIGHT - 16, background: TRIP_BAR_COLOR, border: "none", borderRadius: 5, color: "#fff", fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", overflow: "hidden", boxShadow: `0 2px 4px ${TRIP_BAR_COLOR}30`, transition: "all 0.15s ease", zIndex: 4 }} onMouseEnter={(e) => { (e.currentTarget).style.background = TRIP_BAR_HOVER; (e.currentTarget).style.transform = "scale(1.02)"; (e.currentTarget).style.zIndex = "10"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = TRIP_BAR_COLOR; (e.currentTarget).style.transform = "scale(1)"; (e.currentTarget).style.zIndex = "4"; }} title={tb.names.join(", ") + ": " + tb.trip.start + " → " + tb.trip.end}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
              </button>
            );
          })}

          {/* === СЛОЙ 3 (z-10): ТОЛЬКО маркеры начала/конца услуг === */}
          {objPeriods.map((period, pi) => {
            const pStart = parseDate(period.start);
            const pEnd = parseDate(period.end);
            const startLeft = diffDays(range.start, pStart) * PX_PER_DAY;
            const endLeft = (diffDays(range.start, pEnd) + 1) * PX_PER_DAY;
            if (startLeft > totalWidth && endLeft > totalWidth) return null;
            return (
              <div key={`sp-mark-${pi}`} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 10 }}>
                {/* Маркер НАЧАЛА услуг */}
                <div style={{ position: "absolute", top: 2, left: Math.max(startLeft - 5, 0), display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: MARKER_START_COLOR, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{pi + 1}</div>
                  <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${MARKER_START_COLOR}`, marginTop: -1 }} />
                  <div style={{ fontSize: 8, fontWeight: 700, color: MARKER_START_COLOR, fontFamily: "'JetBrains Mono', monospace", marginTop: 1, textShadow: "0 0 2px #fff" }}>{pStart.getDate()}</div>
                </div>
                {/* Маркер КОНЦА услуг */}
                <div style={{ position: "absolute", top: 2, left: Math.max(endLeft - 5, 0), display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: MARKER_END_COLOR, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{pi + 1}</div>
                  <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${MARKER_END_COLOR}`, marginTop: -1 }} />
                  <div style={{ fontSize: 8, fontWeight: 700, color: MARKER_END_COLOR, fontFamily: "'JetBrains Mono', monospace", marginTop: 1, textShadow: "0 0 2px #fff" }}>{pEnd.getDate()}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    if (row.type === "training") {
      return (
        <div key="training" style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "relative", background: "transparent" }}>
          {trainings.map((tr) => {
            const trStart = parseDate(tr.start); const trEnd = parseDate(tr.end); const left = diffDays(range.start, trStart) * PX_PER_DAY; const width = (diffDays(trStart, trEnd) + 1) * PX_PER_DAY; const spec = specialists.find(s => s.id === tr.specialistId);
            if (left + width < 0 || left > totalWidth) return null;
            return (
              <div key={tr.id} style={{ position: "absolute", top: 8, left: Math.max(left, 0), width: Math.max(width - 2, PX_PER_DAY), height: ROW_HEIGHT - 16, background: TRAINING_BAR_COLOR, border: "none", borderRadius: 5, color: "#fff", fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", overflow: "hidden", boxShadow: `0 2px 4px ${TRAINING_BAR_COLOR}30`, zIndex: 4, opacity: 0.9, cursor: "pointer" }} title={`📚 ${spec?.name || tr.specialistId}: ${tr.title} (${tr.start} → ${tr.end}) — клик=редактировать, ПКМ=удалить`} onClick={() => { if (onEditTraining) onEditTraining(tr); }} onContextMenu={(e) => { e.preventDefault(); if (onDeleteTraining && confirm(`Удалить обучение «${tr.title}»?`)) onDeleteTraining(tr.id); }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📚 {spec?.name || tr.specialistId}</span>
              </div>
            );
          })}
        </div>
      );
    }
    if (row.type === "vacation") {
      return (
        <div key="vacation" style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "relative", background: "transparent" }}>
          {vacationBars.map((bar, bi) => {
            if (bar.left + bar.width < 0 || bar.left > totalWidth) return null;
            const opacity = bar.count > 1 ? 0.45 : 0.35;
            return (
              <div key={`vac-bar-${bi}`} style={{ position: "absolute", top: 6, left: Math.max(bar.left, 0), width: Math.max(bar.width - 2, PX_PER_DAY), height: ROW_HEIGHT - 12, background: VACATION_GLASS, backdropFilter: bar.count > 1 ? "blur(8px)" : "blur(4px)", WebkitBackdropFilter: bar.count > 1 ? "blur(8px)" : "blur(4px)", border: `1px solid rgba(245, 158, 11, ${opacity})`, borderRadius: 6, color: "#92400e", fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", overflow: "hidden", boxShadow: bar.count > 1 ? "0 2px 12px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.3)" : "0 1px 4px rgba(245,158,11,0.1)", cursor: "pointer", zIndex: 4, transition: "all 0.15s ease" }} title={bar.count > 1 ? `🌴 ${bar.count} отпуска: ${bar.names.join(", ")} — клик=редактировать, ПКМ=удалить` : `🌴 ${bar.names[0]} — клик=редактировать, ПКМ=удалить`} onClick={() => { if (onEditVacation && vacations.length > 0) { const vac = vacations.find(v => { const vStart = parseDate(v.start); const vEnd = parseDate(v.end); return vStart >= bar.start && vStart <= bar.end; }); if (vac) onEditVacation(vac); } }} onContextMenu={(e) => { e.preventDefault(); if (onDeleteVacation && vacations.length > 0) { const vac = vacations.find(v => { const vStart = parseDate(v.start); return vStart >= bar.start; }); if (vac && confirm(`Удалить отпуск ${bar.names[0]}?`)) onDeleteVacation(vac.id); } }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bar.count > 1 ? `🌴 ×${bar.count}` : "🌴"} {bar.names.length <= 2 ? bar.names.join(", ") : `${bar.names[0]} +${bar.names.length - 1}`}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return <div key={row.type} style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "relative", background: "transparent" }} />;
  };

  if (rows.length <= 1 && !showArchived) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, padding: 40, fontFamily: "'Inter', sans-serif" }}>Нет данных. Добавьте командировку, чтобы начать.</div>;
  if (rows.length <= 1 && showArchived) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, padding: 40, fontFamily: "'Inter', sans-serif" }}>📦 Архив пуст.</div>;

  return (
    <div style={{ background: BG, position: "relative", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {tooltipObj && <ObjectTooltip obj={tooltipObj} servicePeriods={servicePeriods} position={tooltipPos} />}
      <div style={{ minWidth: LEFT_COL_WIDTH + totalWidth }}>
          {/* zIndex: 30 — выше wrapper toolbar (zIndex:20). Строка дат НАЕЗЖАЕТ на тулбар и закрывает его. top: 0 — прилипает к самому верху viewport. */}
          <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", height: HEADER_HEIGHT, borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.98)" }}>
            <div style={{ position: "sticky", left: 0, zIndex: 35, width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH, height: HEADER_HEIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 10, fontWeight: 600, color: TEXT_DIM, letterSpacing: "0.5px", textTransform: "uppercase", background: "rgba(255,255,255,0.98)" }}>{showArchived ? "📦 Архив — Объект" : "Объект — Вид работ"}</div>
            <div style={{ width: totalWidth, position: "relative" }}>
              <GridOverlay totalDays={range.totalDays} px={PX_PER_DAY} months={months} rangeStart={range.start} showDayLines={false} showMonthLines={true} showWeekend={true} />
              <div style={{ height: 28, position: "relative" }}>{months.map((m, i) => <div key={i} data-testid={`monthcell-${i}`} style={{ position: "absolute", top: 0, left: m.left, width: m.width, height: 28, display: "flex", alignItems: "center", paddingLeft: 8, fontSize: 11, fontWeight: 600, color: TEXT_DIM }}>{m.label}</div>)}</div>
              <div style={{ height: 28, position: "relative" }}>{days.map((day, i) => { const weekend = isWeekend(day); const isToday = diffDays(day, today_date) === 0; return (<div key={i} data-testid={`daycell-${i}`} style={{ position: "absolute", top: 0, left: i * PX_PER_DAY, width: PX_PER_DAY, height: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: isToday ? 700 : 500, color: isToday ? "#2563eb" : weekend ? "#dc2626" : TEXT_DIM, lineHeight: 1.2 }}><span>{formatDay(day)}</span><span style={{ fontSize: 6, opacity: 0.7 }}>{formatDayWeekday(day)}</span></div>); })}</div>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {/* zIndex: 15 — НИЖЕ строки дат (zIndex:30) и тулбара (zIndex:20). top: 0 — заезжает под строку дат при прокрутке. */}
            <div style={{ position: "sticky", left: 0, top: 0, zIndex: 15, width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH, background: CARD_BG, borderRight: `1px solid ${BORDER}` }}>{rows.map((row, idx) => renderLeftRow(row, idx))}</div>
            <div style={{ width: totalWidth, position: "relative" }}>
              <GridOverlay totalDays={range.totalDays} px={PX_PER_DAY} months={months} rangeStart={range.start} showDayLines={true} showMonthLines={true} showWeekend={true} />
              {todayOffset !== null && <div style={{ position: "absolute", top: 0, bottom: 0, left: todayOffset, width: 2, background: "#2563eb", zIndex: 8, pointerEvents: "none" }}><div style={{ position: "absolute", top: -6, left: -4, width: 10, height: 10, borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 8px rgba(37,99,235,0.4)" }} /></div>}
              {rows.map((row, idx) => renderRightRow(row, idx))}
            </div>
          </div>
        </div>
    </div>
  );
}
