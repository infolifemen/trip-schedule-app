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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* Аватары специалистов */}
            <div style={{ display: "flex", gap: -4 }}>
              {tripSpecialists.slice(0, 3).map((spec, i) => (
                <div
                  key={spec.id}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    backgroundColor: spec.color,
                    border: "2px solid #0f172a",
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 10 - i,
                  }}
                >
                  {spec.name.substring(0, 2)}
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {tripSpecialists.map(s => s.name).join(", ") || trip.specialistIds.join(", ")}
              </h2>
              <p className="text-sm text-slate-400">Командировка</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Объект */}
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Объект</div>
              <div className="text-white font-medium">{trip.city}</div>
            </div>
          </div>

          {/* Вид работ */}
          <div className="flex items-start gap-3">
            <Briefcase size={18} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Вид работ</div>
              <div className="text-white font-medium">{trip.purpose || "—"}</div>
            </div>
          </div>

          {/* Вид оборудования */}
          {trip.equipment && (
            <div className="flex items-start gap-3">
              <Cpu size={18} className="text-purple-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Оборудование</div>
                <div className="text-white font-medium">{trip.equipment}</div>
              </div>
            </div>
          )}

          {/* Специалисты */}
          <div className="flex items-start gap-3">
            <Users size={18} className="text-green-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Специалисты</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {tripSpecialists.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${s.color}20`,
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Период */}
          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Период</div>
              <div className="text-white font-medium">
                {formatDateRange(trip.start, trip.end)}
              </div>
            </div>
          </div>

          {/* Примечание */}
          {trip.note && (
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Примечание</div>
                <div className="text-white font-medium">{trip.note}</div>
              </div>
            </div>
          )}

          {/* Периоды оказания услуг */}
          {objPeriods.length > 0 && (
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12 }}>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                Периоды оказания услуг ({objPeriods.length})
              </div>
              <div className="space-y-1.5">
                {objPeriods.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)" }}
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(37,99,235,0.2)", color: "#60a5fa" }}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-white">
                      {formatDateRu(p.start)} → {formatDateRu(p.end)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
