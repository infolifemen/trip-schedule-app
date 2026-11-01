"use client";

import type { Specialist, Trip, ServicePeriod } from "@/lib/types";
import { X, Edit3, Trash2, MapPin, Calendar, Briefcase, FileText, Cpu, Users } from "lucide-react";
import { formatDateRange, parseDate } from "@/lib/data";

interface TripDetailsModalProps {
  trip: Trip;
  specialists: Specialist[];
  servicePeriods?: ServicePeriod[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripDetailsModal({
  trip,
  specialists,
  servicePeriods = [],
  onClose,
  onEdit,
  onDelete,
}: TripDetailsModalProps) {
  const tripSpecialists = specialists.filter(s => trip.specialistIds.includes(s.id));
  const objectId = `${trip.city}|${trip.purpose}`;
  const objPeriods = servicePeriods.filter(p => p.objectId === objectId);

  const formatDateRu = (s: string) => {
    if (!s) return "—";
    const d = parseDate(s);
    if (isNaN(d.getTime())) return "—";
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Заголовок */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Аватары специалистов */}
            <div style={{ display: "flex" }}>
              {tripSpecialists.slice(0, 3).map((spec, i) => (
                <div
                  key={spec.id}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    backgroundColor: spec.color,
                    border: "2px solid #fff",
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 10 - i,
                  }}
                >
                  {spec.name.substring(0, 2)}
                </div>
              ))}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                {tripSpecialists.map(s => s.name).join(", ") || trip.specialistIds.join(", ")}
              </h2>
              <p style={{ fontSize: 12, color: "#8e8ea0", margin: 0 }}>Командировка</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
          >
            <X size={20} style={{ color: "#5a5a72" }} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Объект */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <MapPin size={18} style={{ color: "#2563eb", marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Объект</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>{trip.city}</div>
            </div>
          </div>

          {/* Вид работ */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Briefcase size={18} style={{ color: "#06b6d4", marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Вид работ</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>{trip.purpose || "—"}</div>
            </div>
          </div>

          {/* Вид оборудования */}
          {trip.equipment && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Cpu size={18} style={{ color: "#8b5cf6", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Оборудование</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>{trip.equipment}</div>
              </div>
            </div>
          )}

          {/* Специалисты */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Users size={18} style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Специалисты</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {tripSpecialists.map(s => (
                  <span
                    key={s.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${s.color}15`,
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Период */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Calendar size={18} style={{ color: "#8b5cf6", marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Период</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>
                {formatDateRange(trip.start, trip.end)}
              </div>
            </div>
          </div>

          {/* Примечание */}
          {trip.note && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <FileText size={18} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Примечание</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>{trip.note}</div>
              </div>
            </div>
          )}

          {/* Периоды оказания услуг */}
          {objPeriods.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 8 }}>
                Периоды оказания услуг ({objPeriods.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {objPeriods.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(37,99,235,0.04)",
                      border: "1px solid rgba(37,99,235,0.12)",
                    }}
                  >
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(37,99,235,0.12)",
                      color: "#2563eb",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: "#1a1a2e" }}>
                      {formatDateRu(p.start)} → {formatDateRu(p.end)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", background: "#f1f5f9", color: "#5a5a72", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "#f1f5f9"; }}
          >
            <Edit3 size={16} />
            Изменить
          </button>
          <button
            onClick={() => {
              if (confirm("Удалить эту командировку?")) {
                onDelete();
                onClose();
              }
            }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(239,68,68,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(239,68,68,0.08)"; }}
          >
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
