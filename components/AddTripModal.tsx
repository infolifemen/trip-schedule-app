"use client";

import { useState, useEffect } from "react";
import type { Specialist, Trip, ServicePeriod, ExistingObject } from "@/lib/types";
import { X, Plus, Trash2 } from "lucide-react";
import { toISODate, today } from "@/lib/data";

interface AddTripModalProps {
  specialists: Specialist[];
  existingObjects: ExistingObject[];
  initialTrip?: Trip | null;
  initialServicePeriods?: ServicePeriod[];
  onSave: (trip: Trip, newSpecialists?: Omit<Specialist, "color">[], servicePeriods?: ServicePeriod[]) => void;
  onClose: () => void;
}

export function AddTripModal({
  specialists,
  existingObjects,
  initialTrip,
  initialServicePeriods,
  onSave,
  onClose,
}: AddTripModalProps) {
  // === Состояние формы ===
  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>(
    initialTrip?.specialistIds || []
  );
  const [isNewSpecialist, setIsNewSpecialist] = useState(false);
  const [newSpecialistNames, setNewSpecialistNames] = useState<string[]>([""]);

  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [city, setCity] = useState(initialTrip?.city || "");
  const [purpose, setPurpose] = useState(initialTrip?.purpose || "");
  const [equipment, setEquipment] = useState(initialTrip?.equipment || "");

  const [start, setStart] = useState(initialTrip?.start || toISODate(today()));
  const [end, setEnd] = useState(
    initialTrip?.end || toISODate(new Date(today().getTime() + 7 * 86400000))
  );
  const [note, setNote] = useState(initialTrip?.note || "");

  const [error, setError] = useState("");

  // === Инициализация для существующего объекта ===
  useEffect(() => {
    if (initialTrip) {
      const objId = `${initialTrip.city}|${initialTrip.purpose}`;
      setSelectedObjectId(objId);
    }
  }, [initialTrip]);

  // === Выбор существующего объекта ===
  const handleObjectSelect = (objId: string) => {
    setSelectedObjectId(objId);
    if (objId && objId !== "__new__") {
      const obj = existingObjects.find(o => o.id === objId);
      if (obj) {
        setCity(obj.city);
        setPurpose(obj.purpose);
        setEquipment(obj.equipment || "");
      }
    }
  };

  // === Мультиселект специалистов ===
  const toggleSpecialist = (id: string) => {
    setSelectedSpecIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // === Сабмит ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalSpecialistIds: string[] = [];
    if (isNewSpecialist) {
      const validNames = newSpecialistNames.filter(n => n.trim());
      if (validNames.length === 0) {
        setError("Введите хотя бы одного специалиста");
        return;
      }
      if (validNames.length > 3) {
        setError("Максимум 3 специалиста");
        return;
      }
      finalSpecialistIds.push(...validNames.map(n => n.trim()));
    } else {
      if (selectedSpecIds.length === 0) {
        setError("Выберите хотя бы одного специалиста");
        return;
      }
      finalSpecialistIds.push(...selectedSpecIds);
    }

    if (!city.trim()) {
      setError("Введите объект");
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

    const trip: Trip = {
      id: initialTrip?.id || `trip-${Date.now()}`,
      specialistIds: finalSpecialistIds,
      city: city.trim(),
      purpose: purpose.trim(),
      equipment: equipment.trim() || undefined,
      start,
      end,
      note: note.trim() || undefined,
    };

    let newSpecs: Omit<Specialist, "color">[] | undefined;
    if (isNewSpecialist) {
      newSpecs = newSpecialistNames
        .filter(n => n.trim())
        .map(n => ({ id: n.trim(), name: n.trim() }));
    }

    onSave(trip, newSpecs);
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
            <span style={{ fontSize: 20 }}>✈️</span>
            {initialTrip ? "Редактировать" : "Новая"} командировка
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
            {/* === СПЕЦИАЛИСТЫ === */}
            <div>
              <label style={labelStyle}>
                Специалисты (макс. 3)
              </label>
              {!isNewSpecialist ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {specialists.map((s) => {
                      const isSelected = selectedSpecIds.includes(s.id);
                      const isDisabled = !isSelected && selectedSpecIds.length >= 3;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSpecialist(s.id)}
                          disabled={isDisabled}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            border: isSelected ? `2px solid ${s.color}` : "1px solid #e2e8f0",
                            background: isSelected ? `${s.color}15` : "transparent",
                            color: isSelected ? s.color : isDisabled ? "#94a3b8" : "#5a5a72",
                            opacity: isDisabled ? 0.4 : 1,
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
                              opacity: isSelected ? 1 : 0.4,
                            }}
                          />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewSpecialist(true)}
                    style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    + Добавить нового специалиста
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {newSpecialistNames.map((name, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...newSpecialistNames];
                          updated[i] = e.target.value;
                          setNewSpecialistNames(updated);
                        }}
                        placeholder={`Специалист ${i + 1}`}
                        style={inputStyle}
                        autoFocus={i === 0}
                      />
                      {newSpecialistNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpecialistNames(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          style={{ padding: "8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
                        >
                          <Trash2 size={14} style={{ color: "#ef4444" }} />
                        </button>
                      )}
                    </div>
                  ))}
                  {newSpecialistNames.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setNewSpecialistNames(prev => [...prev, ""])}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                    >
                      <Plus size={12} /> Добавить ещё
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSpecialist(false);
                      setNewSpecialistNames([""]);
                    }}
                    style={{ fontSize: 12, color: "#8e8ea0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                  >
                    ← Выбрать из существующих
                  </button>
                </div>
              )}
            </div>

            {/* === ОБЪЕКТ === */}
            <div>
              <label style={labelStyle}>Объект</label>
              {existingObjects.length > 0 && (
                <select
                  value={selectedObjectId}
                  onChange={(e) => handleObjectSelect(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 8, cursor: "pointer" }}
                >
                  <option value="">— Выбрать существующий объект —</option>
                  {existingObjects.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.city} — {obj.purpose}
                    </option>
                  ))}
                  <option value="__new__">✏️ Ввести новый объект</option>
                </select>
              )}
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSelectedObjectId("");
                }}
                placeholder="Например: Краснодарская ТЭЦ"
                style={inputStyle}
              />
            </div>

            {/* === ВИД РАБОТ === */}
            <div>
              <label style={labelStyle}>Вид работ</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setSelectedObjectId("");
                }}
                placeholder="Например: КДО, ОБТК, ТИ, ЧР, ВД"
                style={inputStyle}
              />
            </div>

            {/* === ВИД ОБОРУДОВАНИЯ === */}
            <div>
              <label style={labelStyle}>Вид оборудования</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Например: ТГ-2, 5"
                style={inputStyle}
              />
            </div>

            {/* === ДАТЫ КОМАНДИРОВКИ === */}
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

            {/* === ПРИМЕЧАНИЕ === */}
            <div>
              <label style={labelStyle}>Примечание</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Дополнительная информация"
                style={inputStyle}
              />
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
              style={{ flex: 1, padding: "12px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#1d4ed8"; (e.currentTarget).style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#2563eb"; (e.currentTarget).style.transform = "scale(1)"; }}
            >
              {initialTrip ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
