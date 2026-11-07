"use client";

import { useState } from "react";
import type { ServicePeriod, ExistingObject } from "@/lib/types";
import { X, Plus, Trash2 } from "lucide-react";
import { toISODate, today } from "@/lib/data";

interface AddServicePeriodModalProps {
  existingObjects: ExistingObject[];
  onSave: (objectId: string, periods: ServicePeriod[]) => void;
  onClose: () => void;
  initialObjectId?: string;
  initialPeriods?: ServicePeriod[];
}

export function AddServicePeriodModal({
  existingObjects,
  onSave,
  onClose,
  initialObjectId,
  initialPeriods,
}: AddServicePeriodModalProps) {
  const [selectedObjectId, setSelectedObjectId] = useState(initialObjectId || "");
  const [periods, setPeriods] = useState<ServicePeriod[]>(
    initialPeriods && initialPeriods.length > 0
      ? initialPeriods.map((p, i) => ({ ...p, id: p.id || `sp-${Date.now()}-${i}` }))
      : [{
          id: `sp-${Date.now()}-0`,
          objectId: initialObjectId || "",
          start: toISODate(today()),
          end: toISODate(new Date(today().getTime() + 30 * 86400000)),
        }]
  );
  const [error, setError] = useState("");

  const addPeriod = () => {
    if (periods.length >= 6) return;
    setPeriods(prev => [
      ...prev,
      {
        id: `sp-${Date.now()}-${prev.length}`,
        objectId: "",
        start: toISODate(today()),
        end: toISODate(new Date(today().getTime() + 30 * 86400000)),
      },
    ]);
  };

  const removePeriod = (idx: number) => {
    setPeriods(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePeriod = (idx: number, field: "start" | "end", value: string) => {
    setPeriods(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedObjectId) {
      setError("Выберите объект (сделку)");
      return;
    }

    const validPeriods = periods.filter(p => p.start && p.end);
    if (validPeriods.length === 0) {
      setError("Добавьте хотя бы один период");
      return;
    }

    for (const p of validPeriods) {
      if (new Date(p.end) < new Date(p.start)) {
        setError("Дата окончания раньше даты начала");
        return;
      }
    }

    // Привязываем objectId к каждому периоду
    const finalPeriods = validPeriods.map(p => ({ ...p, objectId: selectedObjectId }));
    onSave(selectedObjectId, finalPeriods);
    onClose();
  };

  // Светлая тема - стили
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
        className="w-full max-w-lg max-h-[92vh] overflow-auto animate-fade-in"
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            Период оказания услуг
          </h2>
          <button
            onClick={onClose}
            style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(0,0,0,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
          >
            <X size={18} style={{ color: "#5a5a72" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Выбор объекта */}
            <div>
              <label style={labelStyle}>Объект (сделка)</label>
              {existingObjects.length > 0 ? (
                <select
                  value={selectedObjectId}
                  onChange={(e) => setSelectedObjectId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Выберите существующий объект —</option>
                  {existingObjects.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.city} — {obj.purpose}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: "12px 16px", background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
                  ⚠️ Нет существующих сделок. Сначала создайте командировку.
                </div>
              )}
            </div>

            {/* Периоды */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Периоды ({periods.length}/6)
                </label>
                {periods.length < 6 && (
                  <button
                    type="button"
                    onClick={addPeriod}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "none", background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Plus size={12} /> Добавить
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {periods.map((period, idx) => (
                  <div
                    key={period.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.04)",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#5a5a72", width: 20, flexShrink: 0, fontWeight: 600 }}>{idx + 1}</span>
                    <input
                      type="date"
                      value={period.start}
                      onChange={(e) => updatePeriod(idx, "start", e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12 }}
                    />
                    <span style={{ fontSize: 12, color: "#8e8ea0" }}>→</span>
                    <input
                      type="date"
                      value={period.end}
                      onChange={(e) => updatePeriod(idx, "end", e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12 }}
                    />
                    <button
                      type="button"
                      onClick={() => removePeriod(idx)}
                      style={{ padding: "6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(239,68,68,0.1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                    >
                      <Trash2 size={14} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                {error}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", color: "#5a5a72", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#f1f5f9"; }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: "12px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#059669"; (e.currentTarget).style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#10b981"; (e.currentTarget).style.transform = "scale(1)"; }}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
