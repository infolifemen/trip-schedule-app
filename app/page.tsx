"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/Header";
import { FilterChips } from "@/components/FilterChips";
import { Timeline } from "@/components/Timeline";
import { AddTripModal } from "@/components/AddTripModal";
import { TripDetailsModal } from "@/components/TripDetailsModal";
import { loadData, saveTrip, deleteTrip, saveSpecialist } from "@/lib/storage";
import { SEED_DATA } from "@/lib/data";
import type { AppData, Specialist, Trip } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<AppData>(SEED_DATA);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  // Загрузка из Supabase при монтировании
  useEffect(() => {
    loadData()
      .then((result) => {
        setData(result);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Ошибка загрузки:", err);
        setData(SEED_DATA);
        setLoaded(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Фильтрованные командировки
  const filteredTrips = useMemo(() => {
    if (!selectedSpecialist) return data.trips;
    return data.trips.filter((t) => t.specialistId === selectedSpecialist);
  }, [data.trips, selectedSpecialist]);

  // Видимые специалисты (те, у кого есть командировки при фильтре, или все)
  const visibleSpecialists = useMemo(() => {
    if (!selectedSpecialist) return data.specialists;
    return data.specialists.filter((s) => s.id === selectedSpecialist);
  }, [data.specialists, selectedSpecialist]);

  // Количество командировок по специалистам
  const tripCountBySpecialist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const trip of data.trips) {
      counts[trip.specialistId] = (counts[trip.specialistId] || 0) + 1;
    }
    return counts;
  }, [data.trips]);

  const handleSaveTrip = useCallback(async (trip: Trip, newSpecialist?: Omit<Specialist, "color">) => {
    let updatedSpecialists = data.specialists;

    // Если новый специалист — добавляем
    if (newSpecialist && !data.specialists.find((s) => s.id === newSpecialist.id)) {
      const colors = [
        "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
        "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316",
      ];
      const color = colors[data.specialists.length % colors.length];
      const specialist: Specialist = { ...newSpecialist, color };

      // Сохраняем в Supabase
      await saveSpecialist(specialist);

      updatedSpecialists = [...data.specialists, specialist];
    }

    // Сохраняем командировку в Supabase
    await saveTrip(trip);

    // Обновляем локальное состояние
    setData((prev) => {
      const existingIdx = prev.trips.findIndex((t) => t.id === trip.id);
      let trips: Trip[];
      if (existingIdx >= 0) {
        trips = [...prev.trips];
        trips[existingIdx] = trip;
      } else {
        trips = [...prev.trips, trip];
      }

      return { specialists: updatedSpecialists, trips };
    });
  }, [data.specialists]);

  const handleDeleteTrip = useCallback(async (tripId: string) => {
    // Удаляем из Supabase
    await deleteTrip(tripId);

    // Обновляем локальное состояние
    setData((prev) => ({
      ...prev,
      trips: prev.trips.filter((t) => t.id !== tripId),
    }));
  }, []);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-schedule-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    try {
      const raw = localStorage.getItem("trip-schedule-import");
      if (!raw) return;
      const imported = JSON.parse(raw) as AppData;
      if (!imported.specialists || !imported.trips) {
        alert("Неверный формат файла");
        return;
      }

      // TODO: массовый импорт через Supabase
      // Пока просто обновляем локальное состояние
      setData(imported);
      localStorage.removeItem("trip-schedule-import");
      alert("Импорт завершён. Примечание: массовый импорт в Supabase ещё не реализован.");
    } catch (e) {
      alert("Ошибка импорта");
    }
  };

  const handleReset = async () => {
    if (!confirm("Сбросить все данные к начальному состоянию? Это удалит все изменения в Supabase.")) {
      return;
    }

    // TODO: очистить таблицы Supabase и перезалить сид-данные
    setData(SEED_DATA);
    alert("Данные сброшены к начальному состоянию (только локально). Supabase не очищен.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onAddTrip={() => {
          setEditingTrip(null);
          setShowAddModal(true);
        }}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        tripCount={data.trips.length}
        specialistCount={data.specialists.length}
      />

      <FilterChips
        specialists={data.specialists}
        selected={selectedSpecialist}
        onSelect={setSelectedSpecialist}
        tripCountBySpecialist={tripCountBySpecialist}
      />

      <Timeline
        specialists={visibleSpecialists}
        trips={filteredTrips}
        onSelectTrip={setViewingTrip}
      />

      {showAddModal && (
        <AddTripModal
          specialists={data.specialists}
          initialTrip={editingTrip}
          onSave={handleSaveTrip}
          onClose={() => {
            setShowAddModal(false);
            setEditingTrip(null);
          }}
        />
      )}

      {viewingTrip && (
        <TripDetailsModal
          trip={viewingTrip}
          specialist={data.specialists.find((s) => s.id === viewingTrip.specialistId)}
          onClose={() => setViewingTrip(null)}
          onEdit={() => {
            setEditingTrip(viewingTrip);
            setShowAddModal(true);
          }}
          onDelete={() => handleDeleteTrip(viewingTrip.id)}
        />
      )}
    </div>
  );
}
