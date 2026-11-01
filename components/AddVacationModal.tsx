"use client";

import { useState } from "react";
import type { Specialist, Vacation } from "@/lib/types";
import { X } from "lucide-react";
import { toISODate, today } from "@/lib/data";

interface AddVacationModalProps {
  specialists: Specialist[];
  onSave: (vacation: Vacation) => void;
  onClose: () => void;
  initialVacation?: Vacation | null;
}

export function AddVacationModal({
  specialists,
  onSave,
  onClose,
  initialVacation,
}: AddVacationModalProps) {
  const [specialistId, setSpecialistId] = useState(initialVacation?.specialistId || "");
  const [start, setStart] = useState(initialVacation?.start || toISODate(today()));
  const [end, setEnd] = useState(
    initialVacation?.end || toISODate(new Date(today().getTime() + 14 * 86400000))
  );
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!specialistId) {
      setError("Выберите специалиста");
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

    const vacation: Vacation = {
      id: initialVacation?.id || `vac-${Date.now()}`,
      specialistId,
      start,
      end,
    };

    onSave(vacation);
    onClose();
  };

  // Светлая тема
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#1a1a2e",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#5a5a72",
    marginBottom: 6,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
            {initialVacation ? "✏️ Редактировать" : "🌴 Добавить"} отпуск
          </h2>
          <button
            onClick={onClose}
            style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
          >
            <X size={18} style={{ color: "#5a5a72" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", color: "#5a5a72", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#f1f5f9"; }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: "12px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#d97706"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#f59e0b"; }}
            >
              {initialVacation ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
