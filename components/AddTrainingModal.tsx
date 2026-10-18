"use client";

import { useState } from "react";
import type { Specialist, Training } from "@/lib/types";
import { X } from "lucide-react";
import { toISODate, today } from "@/lib/data";

interface AddTrainingModalProps {
  specialists: Specialist[];
  onSave: (training: Training) => void;
  onClose: () => void;
  initialTraining?: Training | null;
}

export function AddTrainingModal({
  specialists,
  onSave,
  onClose,
  initialTraining,
}: AddTrainingModalProps) {
  const [specialistId, setSpecialistId] = useState(initialTraining?.specialistId || "");
  const [title, setTitle] = useState(initialTraining?.title || "");
  const [start, setStart] = useState(initialTraining?.start || toISODate(today()));
  const [end, setEnd] = useState(
    initialTraining?.end || toISODate(new Date(today().getTime() + 14 * 86400000))
  );
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!specialistId) {
      setError("Выберите специалиста");
      return;
    }
    if (!title.trim()) {
      setError("Введите название обучения");
      return;
    }
    if (!start || !end) {
      setError("Укажите даты");
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError("Дата окончания раньше даты начала");
      return;
    }

    const training: Training = {
      id: initialTraining?.id || `tr-${Date.now()}`,
      specialistId,
      title: title.trim(),
      start,
      end,
    };

    onSave(training);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: 6,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {initialTraining ? "✏️ Редактировать" : "📚 Добавить"} обучение
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label style={labelStyle}>Специалист</label>
            <select
              value={specialistId}
              onChange={(e) => setSpecialistId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— Выберите —</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Название обучения</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Повышение квалификации"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Начало</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Конец</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium rounded-lg shadow-lg transition-all"
            >
              {initialTraining ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
