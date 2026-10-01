"use client";

import type { Specialist } from "@/lib/types";
import { Users } from "lucide-react";

interface FilterChipsProps {
  specialists: Specialist[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  tripCountBySpecialist: Record<string, number>;
}

export function FilterChips({
  specialists,
  selected,
  onSelect,
  tripCountBySpecialist,
}: FilterChipsProps) {
  return (
    <div className="px-6 py-3 flex gap-2 flex-wrap items-center border-b border-slate-800 bg-slate-900/50">
      <span className="text-sm text-slate-500 mr-2">Фильтр:</span>

      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          selected === null
            ? "bg-white text-slate-900 shadow-lg"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        <Users size={14} />
        Все
      </button>

      {specialists.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(selected === s.id ? null : s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === s.id
              ? "text-white shadow-lg ring-2 ring-white/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          style={
            selected === s.id
              ? { backgroundColor: s.color, boxShadow: `0 4px 14px ${s.color}60` }
              : {}
          }
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.name}
          <span className="text-xs opacity-70">
            {tripCountBySpecialist[s.id] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}
