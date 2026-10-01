"use client";

import type { Specialist, Trip } from "@/lib/types";
import { X, Edit3, Trash2, MapPin, Calendar, Briefcase, FileText } from "lucide-react";
import { formatDateRange } from "@/lib/data";

interface TripDetailsModalProps {
  trip: Trip;
  specialist: Specialist | undefined;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripDetailsModal({
  trip,
  specialist,
  onClose,
  onEdit,
  onDelete,
}: TripDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {specialist && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: specialist.color }}
              >
                {specialist.name.substring(0, 2)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">
                {specialist?.name || trip.specialistId}
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
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Объект
              </div>
              <div className="text-white font-medium">{trip.city}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase size={18} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Вид работ
              </div>
              <div className="text-white font-medium">{trip.purpose || "—"}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Период
              </div>
              <div className="text-white font-medium">
                {formatDateRange(trip.start, trip.end)}
              </div>
            </div>
          </div>

          {trip.note && (
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Примечание
                </div>
                <div className="text-white font-medium">{trip.note}</div>
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
