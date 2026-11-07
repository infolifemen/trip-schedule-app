"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Plus, Archive, ArchiveRestore, Filter, ChevronDown } from "lucide-react";
import LogoutButton from "./LogoutButton";
import type { Specialist } from "@/lib/types";

interface HeaderProps {
  onAddTrip: () => void;
  onAddServicePeriod: () => void;
  onAddVacation: () => void;
  onAddTraining: () => void;
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

// === DropdownPortal: открывает dropdown через React Portal в document.body ===
// Это решает проблему z-index: dropdown ВСЕГДА поверх строки дат (z-30) и хедера (z-20).
// Без портала dropdown внутри header wrapper (z-20) заходил бы ПОД строку дат (z-30).
function DropdownPortal({ anchorRef, children, minWidth = 220 }: { anchorRef: React.RefObject<HTMLElement | null>; children: ReactNode; minWidth?: number }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // Right-align dropdown к правому краю кнопки
    const left = rect.right - minWidth;
    // Не выходить за левый край viewport
    const clampedLeft = Math.max(8, left);
    setPos({ top: rect.bottom + 6, left: clampedLeft });
  }, [anchorRef, minWidth]);

  useEffect(() => {
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [updatePos]);

  if (typeof document === "undefined" || !pos) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        minWidth,
        animation: "dropdownFadeIn 0.15s ease",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function Header({ onAddTrip, onAddServicePeriod, onAddVacation, onAddTraining, onArchiveClick, showArchived, onToggleArchived, tripCount, specialistCount, archivedCount, specialists, selectedSpecialist, onSelectSpecialist, tripCountBySpecialist }: HeaderProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const archiveRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // === CSS для анимации dropdown ===
  useEffect(() => {
    const id = "dropdown-portal-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `@keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Проверяем клик вне кнопки И вне портала (портал рендерится в body, не внутри ref)
      if (addMenuRef.current && !addMenuRef.current.contains(target)) {
        // Дополнительно проверяем, не кликнули ли внутри portal dropdown
        const addPortal = document.querySelector('[data-portal="add-menu"]');
        if (!addPortal || !addPortal.contains(target)) setAddMenuOpen(false);
      }
      if (archiveRef.current && !archiveRef.current.contains(target)) {
        const archivePortal = document.querySelector('[data-portal="archive-menu"]');
        if (!archivePortal || !archivePortal.contains(target)) setArchiveMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        const filterPortal = document.querySelector('[data-portal="filter-menu"]');
        if (!filterPortal || !filterPortal.contains(target)) setFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const btnStyle: React.CSSProperties = { padding: 8, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, color: "#5a5a72", cursor: "pointer", transition: "all 0.15s ease", display: "inline-flex", alignItems: "center", justifyContent: "center" };

  return (
    // НЕ sticky и НЕ fixed — toolbar обёрнут в fixed wrapper в page.tsx (zIndex: 20).
    // Строка дат в Timeline (sticky top:0, zIndex: 30) наезжает на header при скролле, т.к. 30 > 20.
    // position: relative + zIndex: 1000 создаёт stacking context для кнопок внутри header.
    // Dropdown меню открываются через DropdownPortal (zIndex: 9999) — всегда поверх всего.
    <header style={{ position: "relative", zIndex: 1000, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: 0, letterSpacing: "-0.3px" }}>📊 График командировок</h1>
          <p style={{ fontSize: 12, color: "#5a5a72", marginTop: 4, margin: 0 }}>{specialistCount} специалистов · {tripCount} командировок{archivedCount > 0 && <span> · {archivedCount} в архиве</span>}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* === ФИЛЬТР === */}
          <div ref={filterRef} style={{ position: "relative" }}>
            <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} style={{ ...btnStyle, gap: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: selectedSpecialist ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.04)", border: selectedSpecialist ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(0,0,0,0.06)", color: selectedSpecialist ? "#2563eb" : "#5a5a72" }} onMouseEnter={(e) => { (e.currentTarget).style.background = selectedSpecialist ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = selectedSpecialist ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.04)"; }}>
              <Filter size={14} />Фильтр{selectedSpecialist && <span style={{ background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, minWidth: 14, textAlign: "center" }}>1</span>}<ChevronDown size={12} />
            </button>
            {filterMenuOpen && (
              <DropdownPortal anchorRef={filterRef} minWidth={220}>
                <div data-portal="filter-menu" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 8, minWidth: 220, maxHeight: 300, overflowY: "auto" }}>
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
              </DropdownPortal>
            )}
          </div>

          {/* === ДОБАВИТЬ (dropdown) === */}
          <div ref={addMenuRef} style={{ position: "relative" }}>
            <button onClick={() => setAddMenuOpen(!addMenuOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "all 0.15s ease", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "#1d4ed8"; (e.currentTarget).style.transform = "scale(1.02)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "#2563eb"; (e.currentTarget).style.transform = "scale(1)"; }}><Plus size={16} />Добавить<ChevronDown size={12} /></button>
            {addMenuOpen && (
              <DropdownPortal anchorRef={addMenuRef} minWidth={240}>
                <div data-portal="add-menu" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 6, minWidth: 240 }}>
                  <button onClick={() => { onAddTrip(); setAddMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#1a1a2e", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(37,99,235,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    <span style={{ fontSize: 18 }}>✈️</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Командировка</div>
                      <div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Выбор специалистов, объект и даты</div>
                    </div>
                  </button>
                  <button onClick={() => { onAddServicePeriod(); setAddMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#1a1a2e", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(16,185,129,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    <span style={{ fontSize: 18 }}>📅</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Период оказания услуг</div>
                      <div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Только существующие сделки и даты</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                  <button onClick={() => { onAddVacation(); setAddMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#1a1a2e", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(245,158,11,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    <span style={{ fontSize: 18 }}>🌴</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Отпуск</div>
                      <div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Отпуск специалиста</div>
                    </div>
                  </button>
                  <button onClick={() => { onAddTraining(); setAddMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#1a1a2e", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(139,92,246,0.08)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    <span style={{ fontSize: 18 }}>📚</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Обучение</div>
                      <div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Курсы, семинары, тренинги</div>
                    </div>
                  </button>
                </div>
              </DropdownPortal>
            )}
          </div>

          {/* === АРХИВ (dropdown) === */}
          <div ref={archiveRef} style={{ position: "relative" }}>
            <button onClick={() => setArchiveMenuOpen(!archiveMenuOpen)} style={{ ...btnStyle, gap: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: showArchived ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.04)", border: showArchived ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(0,0,0,0.06)", color: showArchived ? "#f59e0b" : "#5a5a72" }} onMouseEnter={(e) => { if (!showArchived) (e.currentTarget).style.background = "rgba(0,0,0,0.08)"; else (e.currentTarget).style.background = "rgba(245,158,11,0.2)"; }} onMouseLeave={(e) => { if (!showArchived) (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; else (e.currentTarget).style.background = "rgba(245,158,11,0.15)"; }}>
              {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}Архив{archivedCount > 0 && !showArchived && <span style={{ background: "rgba(245,158,11,0.2)", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 16, textAlign: "center" }}>{archivedCount}</span>}<ChevronDown size={12} />
            </button>
            {archiveMenuOpen && (
              <DropdownPortal anchorRef={archiveRef} minWidth={200}>
                <div data-portal="archive-menu" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 6, minWidth: 200 }}>
                  <button onClick={() => { onToggleArchived(); setArchiveMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#5a5a72", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}<div><div style={{ fontWeight: 600 }}>{showArchived ? "Показать активные" : "Показать архив"}</div><div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>{showArchived ? "Вернуться к активным объектам" : `Просмотреть ${archivedCount} архивных`}</div></div>
                  </button>
                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                  <button onClick={() => { onArchiveClick(); setArchiveMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#5a5a72", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }} onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}>
                    <Archive size={16} /><div><div style={{ fontWeight: 600 }}>Управление архивом</div><div style={{ fontSize: 10, color: "#8e8ea0", marginTop: 2 }}>Архивировать или восстановить объекты</div></div>
                  </button>
                </div>
              </DropdownPortal>
            )}
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
