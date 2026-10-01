"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { FilterChips } from "@/components/FilterChips";
import { Timeline } from "@/components/Timeline";
import { AddTripModal } from "@/components/AddTripModal";
import { TripDetailsModal } from "@/components/TripDetailsModal";
import { loadData, saveData } from "@/lib/storage";
import { SEED_DATA } from "@/lib/data";
import type { AppData, Specialist, Trip } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<AppData>(SEED_DATA);
  const [loaded, setLoaded] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  // Сохранение при изменении
  useEffect(() => {
    if (loaded) {
      saveData(data);
    }
  }, [data, loaded]);

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

  const handleSaveTrip = (trip: Trip, newSpecialist?: Omit<Specialist, "color">) => {
    setData((prev) => {
      let specialists = prev.specialists;
      if (newSpecialist && !specialists.find((s) => s.id === newSpecialist.id)) {
        const colors = [
          "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
          "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316",
        ];
        const color = colors[specialists.length % colors.length];
        specialists = [...specialists, { ...newSpecialist, color }];
      }

      const existingIdx = prev.trips.findIndex((t) => t.id === trip.id);
      let trips: Trip[];
      if (existingIdx >= 0) {
        trips = [...prev.trips];
        trips[existingIdx] = trip;
      } else {
        trips = [...prev.trips, trip];
      }

      return { specialists, trips };
    });
  };

  const handleDeleteTrip = (tripId: string) => {
    setData((prev) => ({
      ...prev,
      trips: prev.trips.filter((t) => t.id !== tripId),
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-schedule-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const raw = localStorage.getItem("trip-schedule-import");
      if (!raw) return;
      const imported = JSON.parse(raw) as AppData;
      if (!imported.specialists || !imported.trips) {
        alert("Неверный формат файла");
        return;
      }
      setData(imported);
      localStorage.removeItem("trip-schedule-import");
    } catch (e) {
      alert("Ошибка импорта");
    }
  };

  const handleReset = () => {
    setData(SEED_DATA);
  };

  if (!loaded) {
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
