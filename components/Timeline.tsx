"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import type { Specialist, Trip, TimelineObject, ServiceMarker } from "@/lib/types";
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

// Дизайн-токены (из дашборда агента)
const PX_PER_DAY = 18;
const ROW_HEIGHT = 56;
const LEFT_COL_WIDTH = 240;
const HEADER_HEIGHT = 64;
const TRIP_BAR_COLOR = "#2563eb";       // blue — единый цвет для всех плашек
const TRIP_BAR_HOVER = "#1d4ed8";
const MARKER_START_COLOR = "#16a34a";  // green — начало оказания услуг
const MARKER_END_COLOR = "#dc2626";    // red — окончание оказания услуг
const BG = "#f0eeeb";
const CARD_BG = "rgba(255,255,255,0.72)";
const BORDER = "rgba(0,0,0,0.06)";
const TEXT_DIM = "#5a5a72";
const TEXT_BRIGHT = "#1a1a2e";

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

export function Timeline({ specialists, trips, serviceMarkers = [], onSelectTrip }: TimelineProps) {
  const today_date = useMemo(() => today(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Группируем командировки по объектам
  const objects = useMemo(() => groupTripsByObject(trips), [trips]);

  // Привязываем маркеры к объектам
  const enrichedObjects = useMemo(() => {
    return objects.map((obj) => {
      const objMarkers = serviceMarkers.filter((m) => m.objectId === obj.id);
      return {
        ...obj,
        startMarkers: objMarkers.filter((m) => m.type === "start").slice(0, 4),
        endMarkers: objMarkers.filter((m) => m.type === "end").slice(0, 4),
      };
    });
  }, [objects, serviceMarkers]);

  // Строки таймлайна: объекты + специальные строки
  const rows: { type: "object" | "training" | "vacation1" | "vacation2"; data?: TimelineObject }[] = useMemo(() => {
    const result: typeof rows = [];
    for (const obj of enrichedObjects) {
      result.push({ type: "object", data: obj });
    }
    result.push({ type: "training" });
    result.push({ type: "vacation1" });
    result.push({ type: "vacation2" });
    return result;
  }, [enrichedObjects]);

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
      // Скроллим так, чтобы "сегодня" был виден в левой трети экрана
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

  if (rows.length <= 3) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, padding: 40, fontFamily: "'Inter', sans-serif" }}>
        Нет данных. Добавьте командировку, чтобы начать.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", background: BG, position: "relative", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Основной контейнер с горизонтальным скроллом */}
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
            {/* Заголовок левой колонки */}
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                fontSize: 12,
                fontWeight: 600,
                color: TEXT_DIM,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.5)",
              }}
            >
              Объект / Вид работ
            </div>

            {/* Строки объектов */}
            {rows.map((row, idx) => {
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
                      padding: "0 16px",
                      gap: 10,
                      background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: TEXT_BRIGHT,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {obj.city}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: TEXT_DIM,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}>
                        {obj.purpose}
                      </div>
                    </div>
                  </div>
                );
              } else if (row.type === "training") {
                return (
                  <div key="training" style={{
                    height: ROW_HEIGHT,
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    background: "rgba(124,58,237,0.04)",
                    borderLeft: "3px solid #7c3aed",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>
                      📚 Обучение
                    </div>
                  </div>
                );
              } else if (row.type === "vacation1") {
                return (
                  <div key="vacation1" style={{
                    height: ROW_HEIGHT,
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    background: "rgba(245,158,11,0.04)",
                    borderLeft: "3px solid #f59e0b",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
                      🌴 Отпуск
                    </div>
                  </div>
                );
              } else if (row.type === "vacation2") {
                return (
                  <div key="vacation2" style={{
                    height: ROW_HEIGHT,
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
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
            })}
          </div>

          {/* ===== ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ С ТАЙМЛАЙНОМ ===== */}
          <div style={{ position: "relative", width: totalWidth }}>
            {/* Заголовок: месяцы + дни */}
            <div style={{ height: HEADER_HEIGHT, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)" }}>
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
                      fontSize: 12,
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
              <div style={{ height: 36, position: "relative" }}>
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
                        height: 36,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? "#2563eb" : weekend ? "#dc2626" : TEXT_DIM,
                        background: weekend ? "rgba(220,38,38,0.04)" : "transparent",
                        borderRight: `0.5px solid ${BORDER}`,
                        lineHeight: 1.2,
                      }}
                    >
                      <span>{formatDay(day)}</span>
                      <span style={{ fontSize: 7, opacity: 0.7 }}>{formatDayWeekday(day)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Область со строками */}
            <div style={{ position: "relative" }}>
              {/* Вертикальные линии выходных */}
              {days.map((day, i) => {
                if (!isWeekend(day)) return null;
                return (
                  <div
                    key={`weekend-${i}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: i * PX_PER_DAY,
                      width: PX_PER_DAY,
                      background: "rgba(220,38,38,0.03)",
                      pointerEvents: "none",
                    }}
                  />
                );
              })}

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
              {rows.map((row, idx) => {
                if (row.type === "object" && row.data) {
                  const obj = row.data;
                  return (
                    <div
                      key={obj.id}
                      style={{
                        height: ROW_HEIGHT,
                        borderBottom: `1px solid ${BORDER}`,
                        position: "relative",
                        background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                      }}
                    >
                      {/* Маркеры начала (зелёные флаги) */}
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
                            {/* Флаг */}
                            <div style={{
                              position: "absolute",
                              top: 2,
                              left: -2,
                              width: 0,
                              height: 0,
                              borderTop: "6px solid transparent",
                              borderBottom: "6px solid transparent",
                              borderLeft: `8px solid ${MARKER_START_COLOR}`,
                            }} />
                          </div>
                        );
                      })}

                      {/* Маркеры окончания (красные флаги) */}
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
                            title={`🔴 Окончание: ${marker.date}${marker.label ? " — " + marker.label : ""}`}
                          >
                            <div style={{
                              position: "absolute",
                              bottom: 2,
                              left: -2,
                              width: 0,
                              height: 0,
                              borderTop: "6px solid transparent",
                              borderBottom: "6px solid transparent",
                              borderLeft: `8px solid ${MARKER_END_COLOR}`,
                            }} />
                          </div>
                        );
                      })}

                      {/* Плашки специалистов */}
                      {obj.trips.map((trip) => {
                        const tripStart = parseDate(trip.start);
                        const tripEnd = parseDate(trip.end);
                        const left = diffDays(range.start, tripStart) * PX_PER_DAY;
                        const width = (diffDays(tripStart, tripEnd) + 1) * PX_PER_DAY;
                        const spec = specialists.find((s) => s.id === trip.specialistId);
                        const specName = spec?.name || trip.specialistId;

                        return (
                          <button
                            key={trip.id}
                            onClick={() => handleTripClick(trip)}
                            style={{
                              position: "absolute",
                              top: 10,
                              left,
                              width: Math.max(width - 2, PX_PER_DAY - 2),
                              height: ROW_HEIGHT - 20,
                              background: TRIP_BAR_COLOR,
                              border: "none",
                              borderRadius: 6,
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 600,
                              fontFamily: "'JetBrains Mono', monospace",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 4px",
                              overflow: "hidden",
                              boxShadow: `0 2px 6px ${TRIP_BAR_COLOR}30`,
                              transition: "all 0.15s ease",
                              zIndex: 4,
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.background = TRIP_BAR_HOVER;
                              (e.target as HTMLElement).style.transform = "scale(1.03)";
                              (e.target as HTMLElement).style.zIndex = "10";
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.background = TRIP_BAR_COLOR;
                              (e.target as HTMLElement).style.transform = "scale(1)";
                              (e.target as HTMLElement).style.zIndex = "4";
                            }}
                            title={`${specName}\n${trip.city} — ${trip.purpose}\n${trip.start} → ${trip.end}${trip.note ? "\n" + trip.note : ""}`}
                          >
                            <span style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                              {specName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                // Специальные строки (Обучение, Отпуск)
                const rowColor = row.type === "training" ? "#7c3aed" : "#f59e0b";
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
                    {/* Сюда можно добавлять плашки обучения/отпуска по аналогии с командировками */}
                  </div>
                );
              })}
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
        gap: 16,
        padding: "8px 16px",
        background: CARD_BG,
        backdropFilter: "blur(16px)",
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
        fontSize: 10,
        color: TEXT_DIM,
        fontFamily: "'Inter', sans-serif",
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 12, borderRadius: 3, background: TRIP_BAR_COLOR }} />
          <span>Командировка</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 3, height: 12, background: MARKER_START_COLOR, borderRadius: 1 }} />
          <span>Начало услуг</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 3, height: 12, background: MARKER_END_COLOR, borderRadius: 1 }} />
          <span>Окончание услуг</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 2, height: 12, background: "#2563eb", borderRadius: 1 }} />
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
}
