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
    <div
      style={{
        padding: "8px 24px",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.36)",
        backdropFilter: "blur(8px)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <span style={{ fontSize: 12, color: "#8e8ea0", marginRight: 8, fontWeight: 500 }}>
        Фильтр:
      </span>

      <button
        onClick={() => onSelect(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          border: selected === null ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(0,0,0,0.06)",
          background: selected === null ? "#2563eb" : "rgba(255,255,255,0.6)",
          color: selected === null ? "#fff" : "#5a5a72",
          boxShadow: selected === null ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
          transition: "all 0.15s ease",
          fontFamily: "inherit",
        }}
      >
        <Users size={12} />
        Все
      </button>

      {specialists.map((s) => {
        const isSelected = selected === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(isSelected ? null : s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: isSelected ? `1px solid ${s.color}40` : "1px solid rgba(0,0,0,0.06)",
              background: isSelected ? s.color : "rgba(255,255,255,0.6)",
              color: isSelected ? "#fff" : "#5a5a72",
              boxShadow: isSelected ? `0 2px 8px ${s.color}40` : "none",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: s.color,
                flexShrink: 0,
              }}
            />
            {s.name}
            <span style={{
              fontSize: 10,
              opacity: isSelected ? 0.8 : 0.6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {tripCountBySpecialist[s.id] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
