"use client";

import { useMemo } from "react";
import type { Specialist, Trip } from "@/lib/types";
import {
  parseDate,
  diffDays,
  addDays,
  startOfMonth,
  daysInMonth,
  monthNameShort,
  today,
  formatDateRange,
} from "@/lib/data";

interface TimelineProps {
  specialists: Specialist[];
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
}

const PX_PER_DAY = 14;
const ROW_HEIGHT = 52;
const NAME_COL_WIDTH = 180;
const HEADER_HEIGHT = 40;

export function Timeline({ specialists, trips, onSelectTrip }: TimelineProps) {
  const today_date = useMemo(() => today(), []);

  // Вычисляем диапазон дат
  const range = useMemo(() => {
    if (trips.length === 0) {
      const start = startOfMonth(today_date);
      return {
        start,
        end: addDays(start, 90),
        totalDays: 91,
      };
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
      
      result.push({
        label: monthNameShort(current),
        left,
        width,
      });
      
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return result;
  }, [range]);

  // Позиция сегодня
  const todayOffset = useMemo(() => {
    const days = diffDays(range.start, today_date);
    if (days < 0 || days > range.totalDays) return null;
    return days * PX_PER_DAY;
  }, [range, today_date]);

  // Дни (для сетки)
  const days = useMemo(() => {
    return Array.from({ length: range.totalDays }, (_, i) => addDays(range.start, i));
  }, [range]);

  const totalWidth = range.totalDays * PX_PER_DAY;

  if (specialists.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 py-20">
        Нет специалистов. Добавьте командировку, чтобы начать.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-950 relative">
      {/* Фиксированная левая колонка с именами */}
      <div
        className="sticky left-0 z-10 bg-slate-950 border-r border-slate-800"
        style={{ width: NAME_COL_WIDTH }}
      >
        {/* Заголовок */}
        <div
          className="flex items-center px-4 text-sm font-semibold text-slate-400 border-b border-slate-800 bg-slate-900/50"
          style={{ height: HEADER_HEIGHT }}
        >
          Специалист
        </div>

        {/* Строки специалистов */}
        {specialists.map((spec) => (
          <div
            key={spec.id}
            className="flex items-center px-4 border-b border-slate-800/50 bg-slate-950"
            style={{ height: ROW_HEIGHT }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: spec.color }}
              >
                {spec.name.substring(0, 2)}
              </div>
              <span className="text-sm font-medium text-slate-200 truncate">
                {spec.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Прокручиваемая область с таймлайном */}
      <div
        className="inline-block align-top relative"
        style={{ width: totalWidth, minWidth: totalWidth }}
      >
        {/* Заголовок месяцев */}
        <div
          className="relative border-b border-slate-800 bg-slate-900/50"
          style={{ height: HEADER_HEIGHT }}
        >
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex items-center px-3 text-sm font-medium text-slate-400 border-r border-slate-800/50"
              style={{ left: m.left, width: m.width }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Строки с полосками командировок */}
        <div className="relative">
          {/* Вертикальные линии дней (выходные) */}
          {days.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            if (!isWeekend) return null;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 bg-slate-800/20"
                style={{
                  left: i * PX_PER_DAY,
                  width: PX_PER_DAY,
                }}
              />
            );
          })}

          {/* Линия сегодня */}
          {todayOffset !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: todayOffset }}
            >
              <div className="absolute -top-2 -left-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30" />
            </div>
          )}

          {/* Строки специалистов */}
          {specialists.map((spec) => {
            const specTrips = trips.filter((t) => t.specialistId === spec.id);
            return (
              <div
                key={spec.id}
                className="relative border-b border-slate-800/50"
                style={{ height: ROW_HEIGHT }}
              >
                {specTrips.map((trip) => {
                  const tripStart = parseDate(trip.start);
                  const tripEnd = parseDate(trip.end);
                  const left = diffDays(range.start, tripStart) * PX_PER_DAY;
                  const width = (diffDays(tripStart, tripEnd) + 1) * PX_PER_DAY;

                  return (
                    <button
                      key={trip.id}
                      onClick={() => onSelectTrip(trip)}
                      className="absolute top-2 rounded-md flex items-center px-2 text-white text-xs font-medium overflow-hidden transition-all hover:brightness-110 hover:scale-[1.02] hover:z-10 group cursor-pointer"
                      style={{
                        left,
                        width,
                        height: ROW_HEIGHT - 16,
                        backgroundColor: spec.color,
                        boxShadow: `0 2px 8px ${spec.color}40`,
                      }}
                      title={`${trip.city}\n${formatDateRange(trip.start, trip.end)}\n${trip.purpose}${trip.note ? "\n" + trip.note : ""}`}
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate font-semibold">{trip.city}</div>
                        <div className="truncate text-[10px] opacity-80">
                          {formatDateRange(trip.start, trip.end)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
