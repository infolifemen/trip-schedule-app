"use client";

import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import type { Specialist, Trip, TimelineObject, ServicePeriod, Vacation, TripGroup } from "@/lib/types";
import {
  parseDate,
  diffDays,
  addDays,
  startOfMonth,
  monthNameShort,
  today,
  getSpecialistColor,
} from "@/lib/data";

interface TimelineProps {
  specialists: Specialist[];
  trips: Trip[];
  servicePeriods?: ServicePeriod[];
  vacations?: Vacation[];
  onSelectTrip?: (trip: Trip) => void;
  onAddVacation?: () => void;
  onDeleteVacation?: (vacationId: string) => void;
}

// Дизайн-токены
const PX_PER_DAY = 20;
const ROW_HEIGHT = 44;
const LEFT_COL_WIDTH = 220;
const HEADER_HEIGHT = 56;
const TRIP_BAR_COLOR = "#2563eb";
const TRIP_BAR_HOVER = "#1d4ed8";
const MARKER_START_COLOR = "#86efac";
const MARKER_END_COLOR = "#fde047";
const BG = "#f0eeeb";
const CARD_BG = "rgba(255,255,255,0.72)";
const BORDER = "rgba(0,0,0,0.06)";
const TEXT_DIM = "#5a5a72";
const TEXT_BRIGHT = "#1a1a2e";
const COMPLETED_BG = "rgba(134,239,172,0.08)";
const VACATION_BAR_COLOR = "#f59e0b";

function formatDay(d: Date): string {
  return String(d.getDate());
}

function formatDayWeekday(d: Date): string {
  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return weekdays[d.getDay()];
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// Группировка командировок по объектам
function groupTripsByObject(trips: Trip[]): TimelineObject[] {
  const map = new Map<string, TimelineObject>();

  for (const trip of trips) {
    const id = `${trip.city}|${trip.purpose}`;
    if (!map.has(id)) {
      map.set(id, {
        id,
        city: trip.city,
        purpose: trip.purpose,
        equipment: trip.equipment,
        trips: [],
        servicePeriods: [],
      });
    }
    map.get(id)!.trips.push(trip);
    // Обновляем equipment если есть
    if (trip.equipment) map.get(id)!.equipment = trip.equipment;
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    const aStart = a.trips.length > 0 ? parseDate(a.trips[0].start).getTime() : 0;
    const bStart = b.trips.length > 0 ? parseDate(b.trips[0].start).getTime() : 0;
    return aStart - bStart;
  });

  return sorted;
}

// Группировка пересекающихся командировок
function groupOverlappingTrips(trips: Trip[], rangeStart: Date): TripGroup[] {
  if (trips.length === 0) return [];

  const sorted = [...trips].sort((a, b) => {
    const aStart = parseDate(a.start).getTime();
    const bStart = parseDate(b.start).getTime();
    return aStart - bStart;
  });

  const groups: TripGroup[] = [];

  for (const trip of sorted) {
    const tripStart = parseDate(trip.start);
    const tripEnd = parseDate(trip.end);

    let merged = false;
    for (const group of groups) {
      if (tripStart <= group.end && tripEnd >= group.start) {
        group.trips.push(trip);
        if (tripStart < group.start) group.start = tripStart;
        if (tripEnd > group.end) group.end = tripEnd;
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push({
        trips: [trip],
        start: tripStart,
        end: tripEnd,
        left: 0,
        width: 0,
        specialistNames: [],
      });
    }
  }

  for (const group of groups) {
    group.left = diffDays(rangeStart, group.start) * PX_PER_DAY;
    group.width = (diffDays(group.start, group.end) + 1) * PX_PER_DAY;
    const names = new Set<string>();
    for (const trip of group.trips) {
      for (const sid of trip.specialistIds) {
        names.add(sid);
      }
    }
    group.specialistNames = Array.from(names);
  }

  return groups;
}

// Компонент тултипа для объекта
function ObjectTooltip({
  obj,
  servicePeriods,
  position,
}: {
  obj: TimelineObject;
  servicePeriods: ServicePeriod[];
  position: { top: number; left: number };
}) {
  const formatDateRu = (s: string) => {
    if (!s) return "—";
    const d = parseDate(s);
    if (isNaN(d.getTime())) return "—";
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const objPeriods = servicePeriods.filter(p => p.objectId === obj.id);

  return (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left + 10,
        zIndex: 100,
        background: "rgba(15, 23, 42, 0.96)",
        backdropFilter: "blur(12px)",
        borderRadius: 10,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        minWidth: 220,
        maxWidth: 320,
        fontFamily: "'Inter', -apple-system, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        📍 {obj.city}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          <span style={{ color: "#64748b" }}>Вид работ: </span>
          <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{obj.purpose || "—"}</span>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          <span style={{ color: "#64748b" }}>Оборудование: </span>
          <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{obj.equipment || "—"}</span>
        </div>
      </div>

      {objPeriods.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Периоды оказания услуг
          </div>
          {objPeriods.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: "rgba(37,99,235,0.2)", color: "#60a5fa",
                fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 11, color: "#e2e8f0" }}>
                {formatDateRu(p.start)} → {formatDateRu(p.end)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Timeline({ specialists, trips, servicePeriods = [], vacations = [], onSelectTrip, onAddVacation, onDeleteVacation }: TimelineProps) {
  const today_date = useMemo(() => today(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);

  const [completedHidden, setCompletedHidden] = useState(true);
  const [completedOverrides, setCompletedOverrides] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("completedObjects");
        return new Set(saved ? JSON.parse(saved) : []);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // Тултип
  const [tooltipObj, setTooltipObj] = useState<TimelineObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("completedObjects", JSON.stringify(Array.from(completedOverrides)));
    }
  }, [completedOverrides]);

  const objects = useMemo(() => groupTripsByObject(trips), [trips]);

  const enrichedObjects = useMemo(() => {
    return objects.map((obj) => {
      const objPeriods = servicePeriods.filter((p) => p.objectId === obj.id);
      const isCompleted = completedOverrides.has(obj.id);
      return {
        ...obj,
        servicePeriods: objPeriods,
        completed: isCompleted,
      };
    });
  }, [objects, servicePeriods, completedOverrides]);

  const activeObjects = useMemo(() => enrichedObjects.filter(o => !o.completed), [enrichedObjects]);
  const completedObjects = useMemo(() => enrichedObjects.filter(o => o.completed), [enrichedObjects]);

  // Строки таймлайна
  type RowType = "object" | "vacation" | "completed-section";
  const rows: { type: RowType; data?: TimelineObject }[] = useMemo(() => {
    const result: { type: RowType; data?: TimelineObject }[] = [];

    for (const obj of activeObjects) {
      result.push({ type: "object", data: obj });
    }

    if (completedObjects.length > 0) {
      result.push({ type: "completed-section" });
      if (!completedHidden) {
        for (const obj of completedObjects) {
          result.push({ type: "object", data: obj });
        }
      }
    }

    // Строка отпусков
    result.push({ type: "vacation" });

    return result;
  }, [activeObjects, completedObjects, completedHidden]);

  // Диапазон дат
  const range = useMemo(() => {
    if (trips.length === 0 && vacations.length === 0) {
      const start = addDays(today_date, -30);
      return { start, end: addDays(today_date, 90), totalDays: 121 };
    }

    const allDates: Date[] = [];
    for (const t of trips) {
      allDates.push(parseDate(t.start));
      allDates.push(parseDate(t.end));
    }
    for (const v of vacations) {
      allDates.push(parseDate(v.start));
      allDates.push(parseDate(v.end));
    }

    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    const maxDate = allDates.reduce((max, d) => d > max ? d : max, allDates[0]);

    const start = addDays(startOfMonth(minDate), -14);
    const end = addDays(startOfMonth(addDays(maxDate, 31)), 15);
    const totalDays = diffDays(start, end) + 1;

    return { start, end, totalDays };
  }, [trips, vacations, today_date]);

  // Месяцы
  const months = useMemo(() => {
    const result: { label: string; left: number; width: number }[] = [];
    let current = range.start;
    while (current <= range.end) {
      const monthStart = current < startOfMonth(current) ? startOfMonth(current) : current;
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const effectiveEnd = monthEnd > range.end ? range.end : monthEnd;

      const left = diffDays(range.start, monthStart) * PX_PER_DAY;
      const width = (diffDays(monthStart, effectiveEnd) + 1) * PX_PER_DAY;

      result.push({ label: monthNameShort(current), left, width });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return result;
  }, [range]);

  const days = useMemo(() => {
    return Array.from({ length: range.totalDays }, (_, i) => addDays(range.start, i));
  }, [range]);

  const todayOffset = useMemo(() => {
    const daysFromStart = diffDays(range.start, today_date);
    if (daysFromStart < 0 || daysFromStart > range.totalDays) return null;
    return daysFromStart * PX_PER_DAY;
  }, [range, today_date]);

  // Автопрокрутка к текущему дню
  useEffect(() => {
    if (todayOffset !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = Math.max(0, todayOffset - container.clientWidth / 3);
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [todayOffset]);

  const totalWidth = range.totalDays * PX_PER_DAY;

  const handleTripClick = useCallback(
    (trip: Trip) => {
      if (onSelectTrip) onSelectTrip(trip);
    },
    [onSelectTrip]
  );

  const toggleCompleted = useCallback((objectId: string) => {
    setCompletedOverrides(prev => {
      const next = new Set(prev);
      if (next.has(objectId)) next.delete(objectId);
      else next.add(objectId);
      return next;
    });
  }, []);

  // === Рендер левой колонки ===
  const renderLeftRow = (row: typeof rows[0], idx: number) => {
    if (row.type === "object" && row.data) {
      const obj = row.data;
      return (
        <div
          key={obj.id}
          style={{
            height: ROW_HEIGHT,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
            background: obj.completed ? COMPLETED_BG : (idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"),
            opacity: obj.completed ? 0.7 : 1,
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setTooltipObj(obj);
            setTooltipPos({ top: rect.top, left: rect.right });
          }}
          onMouseLeave={() => setTooltipObj(null)}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: TEXT_BRIGHT,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {obj.city} — {obj.purpose}
            </div>
            {obj.equipment && (
              <div style={{
                fontSize: 9,
                color: TEXT_DIM,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 1,
              }}>
                {obj.equipment}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompleted(obj.id);
            }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: `1px solid ${obj.completed ? MARKER_START_COLOR : BORDER}`,
              background: obj.completed ? MARKER_START_COLOR : "transparent",
              color: obj.completed ? "#166534" : TEXT_DIM,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              flexShrink: 0,
            }}
            title={obj.completed ? "Отметить как активный" : "Отметить как выполненный"}
          >
            {obj.completed ? "✓" : ""}
          </button>
        </div>
      );
    } else if (row.type === "completed-section") {
      return (
        <div
          key="completed-section"
          onClick={() => setCompletedHidden(!completedHidden)}
          style={{
            height: ROW_HEIGHT,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
            background: COMPLETED_BG,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>
            {completedHidden ? "▶" : "▼"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#166534" }}>
            ✅ Выполненные объекты ({completedObjects.length})
          </span>
        </div>
      );
    } else if (row.type === "vacation") {
      return (
        <div key="vacation" style={{
          height: ROW_HEIGHT,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          background: "rgba(245,158,11,0.04)",
          borderLeft: "3px solid #f59e0b",
          gap: 8,
        }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
            🌴 Отпуска
          </div>
          {onAddVacation && (
            <button
              onClick={onAddVacation}
              style={{
                padding: "3px 8px",
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 6,
                color: "#f59e0b",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + Добавить
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  // === Рендер правой части (плашки) ===
  const renderRightRow = (row: typeof rows[0], idx: number) => {
    if (row.type === "object" && row.data) {
      const obj = row.data;
      const tripGroups = groupOverlappingTrips(obj.trips, range.start);
      const objPeriods = servicePeriods.filter(p => p.objectId === obj.id);

      return (
        <div
          key={obj.id}
          style={{
            height: ROW_HEIGHT,
            borderBottom: `1px solid ${BORDER}`,
            position: "relative",
            background: obj.completed ? COMPLETED_BG : (idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"),
            opacity: obj.completed ? 0.7 : 1,
          }}
        >
          {/* Вертикальные линии */}
          {days.map((day, i) => (
            <div
              key={`vline-${i}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: i * PX_PER_DAY,
                width: 1,
                background: isWeekend(day) ? "rgba(220,38,38,0.06)" : "rgba(0,0,0,0.03)",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Маркеры периодов оказания услуг */}
          {objPeriods.map((period, pi) => {
            const pStart = parseDate(period.start);
            const pEnd = parseDate(period.end);
            const left = diffDays(range.start, pStart) * PX_PER_DAY;
            const width = (diffDays(pStart, pEnd) + 1) * PX_PER_DAY;

            if (left + width < 0 || left > totalWidth) return null;

            return (
              <div
                key={`sp-${pi}`}
                style={{
                  position: "absolute",
                  top: 2,
                  left: Math.max(left, 0),
                  width: Math.max(width - 2, 4),
                  height: ROW_HEIGHT - 4,
                  background: "rgba(37, 99, 235, 0.06)",
                  border: "1px dashed rgba(37, 99, 235, 0.25)",
                  borderRadius: 4,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                {/* Начало */}
                <div style={{
                  position: "absolute",
                  left: -1,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: MARKER_START_COLOR,
                  borderRadius: "2px 0 0 2px",
                }} />
                {/* Конец */}
                <div style={{
                  position: "absolute",
                  right: -1,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: MARKER_END_COLOR,
                  borderRadius: "0 2px 2px 0",
                }} />
                {/* Номер периода */}
                <div style={{
                  position: "absolute",
                  top: 1,
                  left: 3,
                  fontSize: 7,
                  fontWeight: 700,
                  color: "rgba(37,99,235,0.5)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {pi + 1}
                </div>
              </div>
            );
          })}

          {/* Плашки командировок */}
          {tripGroups.map((group, gi) => {
            const displayName = group.specialistNames.length <= 3
              ? group.specialistNames.join(", ")
              : `${group.specialistNames.slice(0, 2).join(", ")} +${group.specialistNames.length - 2}`;

            return (
              <button
                key={`group-${gi}`}
                onClick={() => {
                  if (group.trips.length > 0) handleTripClick(group.trips[0]);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  left: group.left,
                  width: Math.max(group.width - 2, PX_PER_DAY - 2),
                  height: ROW_HEIGHT - 16,
                  background: TRIP_BAR_COLOR,
                  border: "none",
                  borderRadius: 5,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  overflow: "hidden",
                  boxShadow: `0 2px 4px ${TRIP_BAR_COLOR}30`,
                  transition: "all 0.15s ease",
                  zIndex: 4,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = TRIP_BAR_HOVER;
                  (e.target as HTMLElement).style.transform = "scale(1.02)";
                  (e.target as HTMLElement).style.zIndex = "10";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = TRIP_BAR_COLOR;
                  (e.target as HTMLElement).style.transform = "scale(1)";
                  (e.target as HTMLElement).style.zIndex = "4";
                }}
                title={group.trips.map(t =>
                  `${t.specialistIds.join(", ")}: ${t.start} → ${t.end}`
                ).join("\n")}
              >
                <span style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    // Строка отпусков — отображаем плашки
    if (row.type === "vacation") {
      return (
        <div
          key="vacation"
          style={{
            height: ROW_HEIGHT,
            borderBottom: `1px solid ${BORDER}`,
            position: "relative",
            background: "transparent",
          }}
        >
          {days.map((day, i) => (
            <div
              key={`vline-vac-${i}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: i * PX_PER_DAY,
                width: 1,
                background: "rgba(0,0,0,0.02)",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Плашки отпусков */}
          {vacations.map((vac) => {
            const vacStart = parseDate(vac.start);
            const vacEnd = parseDate(vac.end);
            const left = diffDays(range.start, vacStart) * PX_PER_DAY;
            const width = (diffDays(vacStart, vacEnd) + 1) * PX_PER_DAY;
            const color = getSpecialistColor(specialists, vac.specialistId);
            const spec = specialists.find(s => s.id === vac.specialistId);

            if (left + width < 0 || left > totalWidth) return null;

            return (
              <div
                key={vac.id}
                style={{
                  position: "absolute",
                  top: 8,
                  left: Math.max(left, 0),
                  width: Math.max(width - 2, PX_PER_DAY),
                  height: ROW_HEIGHT - 16,
                  background: color,
                  border: "none",
                  borderRadius: 5,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  overflow: "hidden",
                  boxShadow: `0 2px 4px ${color}30`,
                  cursor: "pointer",
                  zIndex: 4,
                  opacity: 0.85,
                }}
                title={`🌴 ${spec?.name || vac.specialistId}: ${vac.start} → ${vac.end}`}
                onClick={() => {
                  if (onDeleteVacation && confirm(`Удалить отпуск ${spec?.name || vac.specialistId}?`)) {
                    onDeleteVacation(vac.id);
                  }
                }}
              >
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🌴 {spec?.name || vac.specialistId}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback
    return (
      <div
        key={row.type}
        style={{
          height: ROW_HEIGHT,
          borderBottom: `1px solid ${BORDER}`,
          position: "relative",
          background: "transparent",
        }}
      >
        {days.map((day, i) => (
          <div
            key={`vline-fb-${i}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: i * PX_PER_DAY,
              width: 1,
              background: "rgba(0,0,0,0.02)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    );
  };

  if (rows.length <= 1) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, padding: 40, fontFamily: "'Inter', sans-serif" }}>
        Нет данных. Добавьте командировку, чтобы начать.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", background: BG, position: "relative", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Тултип */}
      {tooltipObj && (
        <ObjectTooltip
          obj={tooltipObj}
          servicePeriods={servicePeriods}
          position={tooltipPos}
        />
      )}

      {/* Основной скролл-контейнер */}
      <div
        ref={scrollContainerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", minWidth: LEFT_COL_WIDTH + totalWidth }}>
          {/* === ФИКСИРОВАННАЯ ЛЕВАЯ КОЛОНКА === */}
          <div
            ref={leftColRef}
            style={{
              position: "sticky",
              left: 0,
              zIndex: 10,
              width: LEFT_COL_WIDTH,
              minWidth: LEFT_COL_WIDTH,
              background: CARD_BG,
              backdropFilter: "blur(16px)",
              borderRight: `1px solid ${BORDER}`,
            }}
          >
            {/* Заголовок левой колонки */}
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                fontSize: 10,
                fontWeight: 600,
                color: TEXT_DIM,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.92)",
                position: "sticky",
                top: 0,
                zIndex: 15,
              }}
            >
              Объект — Вид работ
            </div>

            {rows.map((row, idx) => renderLeftRow(row, idx))}
          </div>

          {/* === ПРОКРУЧИВАЕМЫЙ ТАЙМЛАЙН === */}
          <div style={{ position: "relative", width: totalWidth }}>
            {/* STICKY HEADER — месяцы и дни */}
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: `1px solid ${BORDER}`,
                position: "sticky",
                top: 0,
                zIndex: 12,
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Месяцы */}
              <div style={{ height: 28, position: "relative" }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: m.left,
                      width: m.width,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      color: TEXT_DIM,
                      borderRight: `1px solid ${BORDER}`,
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Дни */}
              <div style={{ height: 28, position: "relative" }}>
                {days.map((day, i) => {
                  const weekend = isWeekend(day);
                  const isToday = diffDays(day, today_date) === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: i * PX_PER_DAY,
                        width: PX_PER_DAY,
                        height: 28,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? "#2563eb" : weekend ? "#dc2626" : TEXT_DIM,
                        background: weekend ? "rgba(220,38,38,0.04)" : "transparent",
                        borderRight: `0.5px solid ${BORDER}`,
                        lineHeight: 1.2,
                      }}
                    >
                      <span>{formatDay(day)}</span>
                      <span style={{ fontSize: 6, opacity: 0.7 }}>{formatDayWeekday(day)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Область строк */}
            <div style={{ position: "relative" }}>
              {/* Линия «сегодня» */}
              {todayOffset !== null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: todayOffset,
                    width: 2,
                    background: "#2563eb",
                    zIndex: 8,
                    pointerEvents: "none",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: -6,
                    left: -4,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#2563eb",
                    boxShadow: "0 0 8px rgba(37,99,235,0.4)",
                  }} />
                </div>
              )}

              {rows.map((row, idx) => renderRightRow(row, idx))}
            </div>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div style={{
        position: "absolute",
        bottom: 12,
        right: 16,
        display: "flex",
        gap: 14,
        padding: "6px 14px",
        background: CARD_BG,
        backdropFilter: "blur(16px)",
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        fontSize: 9,
        color: TEXT_DIM,
        fontFamily: "'Inter', sans-serif",
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 18, height: 10, borderRadius: 3, background: TRIP_BAR_COLOR }} />
          <span>Командировка</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 16, height: 10, borderRadius: 3, background: "rgba(37,99,235,0.1)", border: "1px dashed rgba(37,99,235,0.4)" }} />
          <span>Период услуг</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 18, height: 10, borderRadius: 3, background: VACATION_BAR_COLOR }} />
          <span>Отпуск</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 2, height: 10, background: "#2563eb", borderRadius: 1 }} />
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
}
