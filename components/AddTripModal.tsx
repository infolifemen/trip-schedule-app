"use client";

import { useState, useEffect, useMemo } from "react";
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

  // Периоды оказания услуг (до 6)
  const [servicePeriods, setServicePeriods] = useState<ServicePeriod[]>(
    initialServicePeriods || []
  );

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
      if (prev.length >= 3) return prev; // максимум 3
      return [...prev, id];
    });
  };

  // === Периоды оказания услуг ===
  const addServicePeriod = () => {
    if (servicePeriods.length >= 6) return;
    setServicePeriods(prev => [
      ...prev,
      {
        id: `sp-${Date.now()}-${prev.length}`,
        objectId: "",
        start: toISODate(today()),
        end: toISODate(new Date(today().getTime() + 30 * 86400000)),
      },
    ]);
  };

  const removeServicePeriod = (idx: number) => {
    setServicePeriods(prev => prev.filter((_, i) => i !== idx));
  };

  const updateServicePeriod = (idx: number, field: "start" | "end", value: string) => {
    setServicePeriods(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // === Сабмит ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Проверка специалистов
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

    // Новые специалисты
    let newSpecs: Omit<Specialist, "color">[] | undefined;
    if (isNewSpecialist) {
      newSpecs = newSpecialistNames
        .filter(n => n.trim())
        .map(n => ({ id: n.trim(), name: n.trim() }));
    }

    // Периоды оказания услуг — привязываем к объекту
    const objectId = `${trip.city}|${trip.purpose}`;
    const finalPeriods = servicePeriods
      .filter(p => p.start && p.end)
      .map(p => ({ ...p, objectId }));

    onSave(trip, newSpecs, finalPeriods.length > 0 ? finalPeriods : undefined);
    onClose();
  };

  // Стили
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
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg max-h-[92vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {initialTrip ? "Редактировать" : "Новая"} командировка
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* === СПЕЦИАЛИСТЫ === */}
          <div>
            <label style={labelStyle}>
              Специалисты (макс. 3)
            </label>
            {!isNewSpecialist ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
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
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          border: isSelected ? `2px solid ${s.color}` : "1px solid #334155",
                          background: isSelected ? `${s.color}20` : "transparent",
                          color: isSelected ? s.color : isDisabled ? "#475569" : "#94a3b8",
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
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Добавить нового специалиста
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {newSpecialistNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
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
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                {newSpecialistNames.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setNewSpecialistNames(prev => [...prev, ""])}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
                  className="text-xs text-slate-500 hover:text-slate-400"
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
                style={{
                  ...inputStyle,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
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

          {/* === ПЕРИОДЫ ОКАЗАНИЯ УСЛУГ === */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Периоды оказания услуг ({servicePeriods.length}/6)
              </label>
              {servicePeriods.length < 6 && (
                <button
                  type="button"
                  onClick={addServicePeriod}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={12} /> Добавить
                </button>
              )}
            </div>
            <div className="space-y-2">
              {servicePeriods.map((period, idx) => (
                <div
                  key={period.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.12)" }}
                >
                  <span className="text-xs text-slate-500 w-5 shrink-0">{idx + 1}</span>
                  <input
                    type="date"
                    value={period.start}
                    onChange={(e) => updateServicePeriod(idx, "start", e.target.value)}
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px", fontSize: 12 }}
                  />
                  <span className="text-xs text-slate-500">→</span>
                  <input
                    type="date"
                    value={period.end}
                    onChange={(e) => updateServicePeriod(idx, "end", e.target.value)}
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px", fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeServicePeriod(idx)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors shrink-0"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
              {servicePeriods.length === 0 && (
                <div className="text-xs text-slate-600 text-center py-2">
                  Нет периодов. Нажмите «Добавить» для создания.
                </div>
              )}
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
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Кнопки */}
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
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-lg transition-all"
            >
              {initialTrip ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
