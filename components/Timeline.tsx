"use client";

import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import type { Specialist, Trip, TimelineObject, ServiceMarker, TripGroup } from "@/lib/types";
import {
  parseDate,
  diffDays,
  addDays,
  startOfMonth,
  monthNameShort,
  today,
} from "@/lib/data";

interface TimelineProps {
  specialists: Specialist[];
  trips: Trip[];
  serviceMarkers?: ServiceMarker[];
  onSelectTrip?: (trip: Trip) => void;
}

// Дизайн-токены
const PX_PER_DAY = 20;
const ROW_HEIGHT = 44;
const LEFT_COL_WIDTH = 220;
const HEADER_HEIGHT = 56;
const TRIP_BAR_COLOR = "#2563eb";       // blue
const TRIP_BAR_HOVER = "#1d4ed8";
const MARKER_START_COLOR = "#86efac";  // dim green — начало оказания услуг
const MARKER_END_COLOR = "#fde047";    // dim yellow — окончание оказания услуг
const BG = "#f0eeeb";
const CARD_BG = "rgba(255,255,255,0.72)";
const BORDER = "rgba(0,0,0,0.06)";
const TEXT_DIM = "#5a5a72";
const TEXT_BRIGHT = "#1a1a2e";
const COMPLETED_BG = "rgba(134,239,172,0.08)";

// Утилиты форматирования
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
        trips: [],
        startMarkers: [],
        endMarkers: [],
      });
    }
    map.get(id)!.trips.push(trip);
  }

  // Сортируем: сначала по дате начала первой командировки
  const sorted = Array.from(map.values()).sort((a, b) => {
    const aStart = a.trips.length > 0 ? parseDate(a.trips[0].start).getTime() : 0;
    const bStart = b.trips.length > 0 ? parseDate(b.trips[0].start).getTime() : 0;
    return aStart - bStart;
  });

  return sorted;
}

// Группировка пересекающихся командировок внутри одного объекта
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

    // Ищем группу, с которой пересекается эта командировка
    let merged = false;
    for (const group of groups) {
      if (tripStart <= group.end && tripEnd >= group.start) {
        // Пересекается — добавляем в группу
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

  // Вычисляем позиции и имена специалистов
  for (const group of groups) {
    group.left = diffDays(rangeStart, group.start) * PX_PER_DAY;
    group.width = (diffDays(group.start, group.end) + 1) * PX_PER_DAY;
    // Уникальные имена специалистов
    const names = new Set<string>();
    for (const trip of group.trips) {
      names.add(trip.specialistId);
    }
    group.specialistNames = Array.from(names);
  }

  return groups;
}

export function Timeline({ specialists, trips, serviceMarkers = [], onSelectTrip }: TimelineProps) {
  const today_date = useMemo(() => today(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State для управления скрытием выполненных объектов
  const [completedHidden, setCompletedHidden] = useState(true);
  // localStorage для запоминания отмеченных как выполненные объектов
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

  // Сохраняем completed overrides в localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("completedObjects", JSON.stringify(Array.from(completedOverrides)));
    }
  }, [completedOverrides]);

  // Группируем командировки по объектам
  const objects = useMemo(() => groupTripsByObject(trips), [trips]);

  // Привязываем маркеры и completed статус к объектам
  const enrichedObjects = useMemo(() => {
    return objects.map((obj) => {
      const objMarkers = serviceMarkers.filter((m) => m.objectId === obj.id);
      const isCompleted = completedOverrides.has(obj.id);
      return {
        ...obj,
        startMarkers: objMarkers.filter((m) => m.type === "start").slice(0, 4),
        endMarkers: objMarkers.filter((m) => m.type === "end").slice(0, 4),
        completed: isCompleted,
      };
    });
  }, [objects, serviceMarkers, completedOverrides]);

  // Разделяем на активные и выполненные
  const activeObjects = useMemo(() => enrichedObjects.filter(o => !o.completed), [enrichedObjects]);
  const completedObjects = useMemo(() => enrichedObjects.filter(o => o.completed), [enrichedObjects]);

  // Строки таймлайна
  const rows: { type: "object" | "completed-section" | "training" | "vacation1" | "vacation2"; data?: TimelineObject }[] = useMemo(() => {
    const result: typeof rows = [];
    
    // Активные объекты
    for (const obj of activeObjects) {
      result.push({ type: "object", data: obj });
    }
    
    // Секция выполненных объектов
    if (completedObjects.length > 0) {
      result.push({ type: "completed-section" });
      if (!completedHidden) {
        for (const obj of completedObjects) {
          result.push({ type: "object", data: obj });
        }
      }
    }
    
    result.push({ type: "training" });
    result.push({ type: "vacation1" });
    result.push({ type: "vacation2" });
    return result;
  }, [activeObjects, completedObjects, completedHidden]);

  // Вычисляем диапазон дат
  const range = useMemo(() => {
    if (trips.length === 0) {
      const start = addDays(today_date, -30);
      return { start, end: addDays(today_date, 90), totalDays: 121 };
    }

    const minDate = trips.reduce((min, t) => {
      const d = parseDate(t.start);
      return d < min ? d : min;
    }, parseDate(trips[0].start));

    const maxDate = trips.reduce((max, t) => {
      const d = parseDate(t.end);
      return d > max ? d : max;
    }, parseDate(trips[0].end));

    const start = addDays(startOfMonth(minDate), -14);
    const end = addDays(startOfMonth(addDays(maxDate, 31)), 15);
    const totalDays = diffDays(start, end) + 1;

    return { start, end, totalDays };
  }, [trips, today_date]);

  // Месяцы для заголовка
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

  // Дни
  const days = useMemo(() => {
    return Array.from({ length: range.totalDays }, (_, i) => addDays(range.start, i));
  }, [range]);

  // Позиция "сегодня"
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

  // Обработчик клика по плашке
  const handleTripClick = useCallback(
    (trip: Trip) => {
      if (onSelectTrip) onSelectTrip(trip);
    },
    [onSelectTrip]
  );

  // Toggle completed status для объекта
  const toggleCompleted = useCallback((objectId: string) => {
    setCompletedOverrides(prev => {
      const next = new Set(prev);
      if (next.has(objectId)) {
        next.delete(objectId);
      } else {
        next.add(objectId);
      }
      return next;
    });
  }, []);

  if (rows.length <= 3) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, padding: 40, fontFamily: "'Inter', sans-serif" }}>
        Нет данных. Добавьте командировку, чтобы начать.
      </div>
    );
  }

  // Рендер строки объекта (левая колонка)
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
          }}
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
          </div>
          {/* Кнопка "отметить как выполненное" */}
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
    } else if (row.type === "training") {
      return (
        <div key="training" style={{
          height: ROW_HEIGHT,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          background: "rgba(124,58,237,0.04)",
          borderLeft: "3px solid #7c3aed",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>
            📚 Обучение
          </div>
        </div>
      );
    } else if (row.type === "vacation1" || row.type === "vacation2") {
      return (
        <div key={row.type} style={{
          height: ROW_HEIGHT,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          background: "rgba(245,158,11,0.04)",
          borderLeft: "3px solid #f59e0b",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
            🌴 Отпуск
          </div>
        </div>
      );
    }
    return null;
  };

  // Рендер строки с плашками (правая часть)
  const renderRightRow = (row: typeof rows[0], idx: number) => {
    if (row.type === "object" && row.data) {
      const obj = row.data;
      // Группируем пересекающиеся командировки
      const tripGroups = groupOverlappingTrips(obj.trips, range.start);

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
          {/* Вертикальные линии дней */}
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

          {/* Маркеры начала (dim green) */}
          {obj.startMarkers.map((marker, mi) => {
            const markerDate = parseDate(marker.date);
            const offset = diffDays(range.start, markerDate) * PX_PER_DAY;
            if (offset < 0 || offset > totalWidth) return null;
            return (
              <div
                key={`start-${mi}`}
                style={{
                  position: "absolute",
                  left: offset,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: MARKER_START_COLOR,
                  zIndex: 6,
                  pointerEvents: "none",
                }}
                title={`🟢 Начало: ${marker.date}${marker.label ? " — " + marker.label : ""}`}
              >
                <div style={{
                  position: "absolute",
                  top: 2,
                  left: -2,
                  width: 0,
                  height: 0,
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: `7px solid ${MARKER_START_COLOR}`,
                }} />
              </div>
            );
          })}

          {/* Маркеры окончания (dim yellow) */}
          {obj.endMarkers.map((marker, mi) => {
            const markerDate = parseDate(marker.date);
            const offset = diffDays(range.start, markerDate) * PX_PER_DAY;
            if (offset < 0 || offset > totalWidth) return null;
            return (
              <div
                key={`end-${mi}`}
                style={{
                  position: "absolute",
                  left: offset,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: MARKER_END_COLOR,
                  zIndex: 6,
                  pointerEvents: "none",
                }}
                title={`🟡 Окончание: ${marker.date}${marker.label ? " — " + marker.label : ""}`}
              >
                <div style={{
                  position: "absolute",
                  bottom: 2,
                  left: -2,
                  width: 0,
                  height: 0,
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: `7px solid ${MARKER_END_COLOR}`,
                }} />
              </div>
            );
          })}

          {/* Плашки групп командировок */}
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
                title={group.trips.map(t => `${t.specialistId}: ${t.start} → ${t.end}`).join("\n")}
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

    // Специальные строки
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
        {/* Вертикальные линии для специальных строк тоже */}
        {days.map((day, i) => (
          <div
            key={`vline-spec-${i}`}
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

  return (
    <div style={{ flex: 1, overflow: "hidden", background: BG, position: "relative", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Основной контейнер с горизонтальным и вертикальным скроллом */}
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
          {/* ===== ФИКСИРОВАННАЯ ЛЕВАЯ КОЛОНКА ===== */}
          <div
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
            {/* Заголовок левой колонки (sticky top) */}
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
                background: "rgba(255,255,255,0.85)",
                position: "sticky",
                top: 0,
                zIndex: 15,
              }}
            >
              Объект — Вид работ
            </div>

            {/* Строки объектов */}
            {rows.map((row, idx) => renderLeftRow(row, idx))}
          </div>

          {/* ===== ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ С ТАЙМЛАЙНОМ ===== */}
          <div style={{ position: "relative", width: totalWidth }}>
            {/* Заголовок: месяцы + дни (sticky top — год и дни недели всегда видны) */}
            <div style={{ height: HEADER_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}>
              {/* Месяцы с годом */}
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

            {/* Область со строками */}
            <div style={{ position: "relative" }}>
              {/* Линия "сегодня" */}
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

              {/* Строки */}
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
          <div style={{ width: 3, height: 10, background: MARKER_START_COLOR, borderRadius: 1 }} />
          <span>Начало услуг</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 3, height: 10, background: MARKER_END_COLOR, borderRadius: 1 }} />
          <span>Окончание услуг</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 2, height: 10, background: "#2563eb", borderRadius: 1 }} />
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
}
