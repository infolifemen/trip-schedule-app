"use client";

import { useState, useEffect } from "react";
import type { Specialist, Trip } from "@/lib/types";
import { X } from "lucide-react";
import { toISODate, today } from "@/lib/data";

interface AddTripModalProps {
  specialists: Specialist[];
  initialTrip?: Trip | null;
  onSave: (trip: Trip, newSpecialist?: Omit<Specialist, "color">) => void;
  onClose: () => void;
}

export function AddTripModal({
  specialists,
  initialTrip,
  onSave,
  onClose,
}: AddTripModalProps) {
  const [specialistId, setSpecialistId] = useState(
    initialTrip?.specialistId || ""
  );
  const [isNewSpecialist, setIsNewSpecialist] = useState(false);
  const [newSpecialistName, setNewSpecialistName] = useState("");
  const [city, setCity] = useState(initialTrip?.city || "");
  const [purpose, setPurpose] = useState(initialTrip?.purpose || "");
  const [start, setStart] = useState(initialTrip?.start || toISODate(today()));
  const [end, setEnd] = useState(
    initialTrip?.end || toISODate(new Date(today().getTime() + 7 * 86400000))
  );
  const [note, setNote] = useState(initialTrip?.note || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTrip && !specialists.find((s) => s.id === initialTrip.specialistId)) {
      setIsNewSpecialist(true);
      setNewSpecialistName(initialTrip.specialistId);
    }
  }, [initialTrip, specialists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isNewSpecialist) {
      if (!newSpecialistName.trim()) {
        setError("Введите имя специалиста");
        return;
      }
    } else {
      if (!specialistId) {
        setError("Выберите специалиста");
        return;
      }
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
      specialistId: isNewSpecialist ? newSpecialistName.trim() : specialistId,
      city: city.trim(),
      purpose: purpose.trim(),
      start,
      end,
      note: note.trim() || undefined,
    };

    const newSpec = isNewSpecialist
      ? { id: newSpecialistName.trim(), name: newSpecialistName.trim() }
      : undefined;

    onSave(trip, newSpec);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {initialTrip ? "Редактировать" : "Новая"} командировка
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Специалист */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Специалист
            </label>
            {!isNewSpecialist ? (
              <div className="flex gap-2">
                <select
                  value={specialistId}
                  onChange={(e) => setSpecialistId(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Выберите —</option>
                  {specialists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsNewSpecialist(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap"
                >
                  + Новый
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialistName}
                  onChange={(e) => setNewSpecialistName(e.target.value)}
                  placeholder="Имя (например, ИИП)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSpecialist(false);
                    setNewSpecialistName("");
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          {/* Объект */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Объект / Место
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Например: Сахалинская Энергия"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Цель */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Вид работ
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Например: КДО, ОБТК, ТИ"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Даты */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Начало
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Конец
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Примечание */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Примечание
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: ТГ-2, 5"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
