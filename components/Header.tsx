"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Archive, ArchiveRestore, Filter, ChevronDown } from "lucide-react";
import LogoutButton from "./LogoutButton";
import type { Specialist } from "@/lib/types";

interface HeaderProps {
  onAddTrip: () => void;
  onArchiveClick: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  tripCount: number;
  specialistCount: number;
  archivedCount: number;
  specialists: Specialist[];
  selectedSpecialist: string | null;
  onSelectSpecialist: (id: string | null) => void;
  tripCountBySpecialist: Record<string, number>;
}

export function Header({ onAddTrip, onArchiveClick, showArchived, onToggleArchived, tripCount, specialistCount, archivedCount, specialists, selectedSpecialist, onSelectSpecialist, tripCountBySpecialist }: HeaderProps) {
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (archiveRef.current && !archiveRef.current.contains(e.target as Node)) setArchiveMenuOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const btnStyle: React.CSSProperties = { padding: 8, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, color: "#5a5a72", cursor: "pointer", transition: "all 0.15s ease", display: "inline-flex", alignItems: "center", justifyContent: "center" };

  return (
    // zIndex: 50 — ВЫШЕ sticky header в Timeline (zIndex: 15). Dropdown гарантированно ПОВЕРХ строки дат.
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: 0, letterSpacing: "-0.3px" }}>📊 График командировок</h1>
          <p style={{ fontSize: 12, color: "#5a5a72", marginTop: 4, margin: 0 }}>{specialistCount} специалистов · {tripCount} командировок{archivedCount > 0 && <span> · {archivedCount} в архиве</span>}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div ref={filterRef} style={{ position: "relative" }}>
            <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} style={{ ...btnStyle, gap: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: selectedSpecialist ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.04)", border: selectedSpecialist ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(0,0,0,0.06)", color: selectedSpecialist ? "#2563eb" : "#5a5a72" }} onMouseEnter={(e) => { (e.currentTarget).style.background = selectedSpecialist ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = selectedSpecialist ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.04)"; }}>
              <Filter size={14} />Фильтр{selectedSpecialist && <span style={{ background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, minWidth: 14, textAlign: "center" }}>1</span>}<ChevronDown size={12} />
            </button>
            {filterMenuOpen && (
              // zIndex: 9999 — ГАРАНТИРОВАННО поверх всех sticky-элементов
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 8, minWidth: 220, maxHeight: 300, overflowY: "auto", zIndex: 9999 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 8px", marginBottom: 4 }}>Специалист</div>
                <button onClick={() => { onSelectSpecialist(null); setFilterMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: selectedSpecialist === null ? "rgba(37,99,235,0.1)" : "transparent", color: selectedSpecialist === null ? "#2563eb" : "#5a5a72", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { if (selectedSpecialist !== null) (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { if (selectedSpecialist !== null) (e.currentTarget).style.background = "transparent"; }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: selectedSpecialist === null ? "#2563eb" : "#ccc" }} />Все<span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>{tripCount}</span>
                </button>
                {specialists.map((s) => { const isSelected = selectedSpecialist === s.id; return (
                  <button key={s.id} onClick={() => { onSelectSpecialist(isSelected ? null : s.id); setFilterMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: isSelected ? `${s.color}15` : "transparent", color: isSelected ? s.color : "#5a5a72", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { if (!isSelected) (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { if (!isSelected) (e.currentTarget).style.background = "transparent"; }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />{s.name}<span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{tripCountBySpecialist[s.id] || 0}</span>
                  </button>
                ); })}
              </div>
            )}
          </div>
          <button onClick={onAddTrip} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "all 0.15s ease", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "#1d4ed8"; (e.currentTarget).style.transform = "scale(1.02)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "#2563eb"; (e.currentTarget).style.transform = "scale(1)"; }}><Plus size={16} />Добавить</button>
          <div ref={archiveRef} style={{ position: "relative" }}>
            <button onClick={() => setArchiveMenuOpen(!archiveMenuOpen)} style={{ ...btnStyle, gap: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: showArchived ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.04)", border: showArchived ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(0,0,0,0.06)", color: showArchived ? "#f59e0b" : "#5a5a72" }} onMouseEnter={(e) => { if (!showArchived) (e.currentTarget).style.background = "rgba(0,0,0,0.08)"; else (e.currentTarget).style.background = "rgba(245,158,11,0.2)"; }} onMouseLeave={(e) => { if (!showArchived) (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; else (e.currentTarget).style.background = "rgba(245,158,11,0.15)"; }}>
              {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}Архив{archivedCount > 0 && !showArchived && <span style={{ background: "rgba(245,158,11,0.2)", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 16, textAlign: "center" }}>{archivedCount}</span>}<ChevronDown size={12} />
            </button>
            {archiveMenuOpen && (
              // zIndex: 9999 — ГАРАНТИРОВАННО поверх всех sticky-элементов
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 6, minWidth: 200, zIndex: 9999 }}>
                <button onClick={() => { onToggleArchived(); setArchiveMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#5a5a72", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                  {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}<div><div style={{ fontWeight: 600 }}>{showArchived ? "Показать активные" : "Показать архив"}</div><div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>{showArchived ? "Вернуться к активным объектам" : `Просмотреть ${archivedCount} архивных`}</div></div>
                </button>
                <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                <button onClick={() => { onArchiveClick(); setArchiveMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#5a5a72", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                  <Archive size={16} /><div><div style={{ fontWeight: 600 }}>Управление архивом</div><div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Архивировать или восстановить объекты</div></div>
                </button>
              </div>
            )}
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
