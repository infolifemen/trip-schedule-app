"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/Header";
import { FilterChips } from "@/components/FilterChips";
import { Timeline } from "@/components/Timeline";
import { AddTripModal } from "@/components/AddTripModal";
import { AddVacationModal } from "@/components/AddVacationModal";
import { ArchiveModal } from "@/components/ArchiveModal";
import { TripDetailsModal } from "@/components/TripDetailsModal";
import {
  loadData, saveTrip, deleteTrip, saveSpecialist,
  saveServicePeriods, saveVacation, deleteVacation,
  saveArchivedIds, saveTrainings,
} from "@/lib/storage";
import { SEED_DATA } from "@/lib/data";
import type { AppData, Specialist, Trip, ServicePeriod, Vacation, Training, ExistingObject, TimelineObject } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<AppData>(SEED_DATA);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  // Загрузка из Supabase
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

  // Фильтрованные командировки (по специалисту)
  const filteredTrips = useMemo(() => {
    if (!selectedSpecialist) return data.trips;
    return data.trips.filter((t) => t.specialistIds.includes(selectedSpecialist));
  }, [data.trips, selectedSpecialist]);

  // Видимые специалисты
  const visibleSpecialists = useMemo(() => {
    if (!selectedSpecialist) return data.specialists;
    return data.specialists.filter((s) => s.id === selectedSpecialist);
  }, [data.specialists, selectedSpecialist]);

  // Количество командировок по специалистам
  const tripCountBySpecialist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const trip of data.trips) {
      for (const sid of trip.specialistIds) {
        counts[sid] = (counts[sid] || 0) + 1;
      }
    }
    return counts;
  }, [data.trips]);

  // Существующие объекты (для dropdown)
  const existingObjects: ExistingObject[] = useMemo(() => {
    const map = new Map<string, ExistingObject>();
    for (const trip of data.trips) {
      const key = `${trip.city}|${trip.purpose}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          city: trip.city,
          purpose: trip.purpose,
          equipment: trip.equipment,
        });
      }
    }
    return Array.from(map.values());
  }, [data.trips]);

  // Периоды для редактируемой командировки
  const editingServicePeriods = useMemo(() => {
    if (!editingTrip) return [];
    const objectId = `${editingTrip.city}|${editingTrip.purpose}`;
    return (data.servicePeriods || []).filter(p => p.objectId === objectId);
  }, [editingTrip, data.servicePeriods]);

  // Фильтрованные отпуска
  const filteredVacations = useMemo(() => {
    if (!selectedSpecialist) return data.vacations || [];
    return (data.vacations || []).filter(v => v.specialistId === selectedSpecialist);
  }, [data.vacations, selectedSpecialist]);

  // Фильтрованные обучения
  const filteredTrainings = useMemo(() => {
    if (!selectedSpecialist) return data.trainings || [];
    return (data.trainings || []).filter(t => t.specialistId === selectedSpecialist);
  }, [data.trainings, selectedSpecialist]);

  // Архивированные ID
  const archivedIds = data.archivedIds || [];

  // Подсчёт архивных объектов
  const archivedCount = useMemo(() => {
    const objIds = new Set(data.trips.map(t => `${t.city}|${t.purpose}`));
    return archivedIds.filter(id => objIds.has(id)).length;
  }, [data.trips, archivedIds]);

  // Все объекты для ArchiveModal
  const allObjects = useMemo((): TimelineObject[] => {
    const map = new Map<string, TimelineObject>();
    for (const trip of data.trips) {
      const id = `${trip.city}|${trip.purpose}`;
      if (!map.has(id)) {
        map.set(id, {
          id,
          city: trip.city,
          purpose: trip.purpose,
          equipment: trip.equipment,
          trips: [],
          servicePeriods: [],
        });
      }
      map.get(id)!.trips.push(trip);
      if (trip.equipment) map.get(id)!.equipment = trip.equipment;
    }
    return Array.from(map.values());
  }, [data.trips]);

  // === Сохранение командировки ===
  const handleSaveTrip = useCallback(async (
    trip: Trip,
    newSpecialists?: Omit<Specialist, "color">[],
    servicePeriods?: ServicePeriod[]
  ) => {
    let updatedSpecialists = data.specialists;

    if (newSpecialists && newSpecialists.length > 0) {
      const colors = [
        "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
        "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316",
      ];
      const newSpecs: Specialist[] = [];

      for (const ns of newSpecialists) {
        if (!data.specialists.find((s) => s.id === ns.id)) {
          const color = colors[(data.specialists.length + newSpecs.length) % colors.length];
          const spec: Specialist = { ...ns, color };
          await saveSpecialist(spec);
          newSpecs.push(spec);
        }
      }

      if (newSpecs.length > 0) {
        updatedSpecialists = [...data.specialists, ...newSpecs];
      }
    }

    await saveTrip(trip);

    if (servicePeriods !== undefined) {
      const objectId = `${trip.city}|${trip.purpose}`;
      await saveServicePeriods(objectId, servicePeriods);
    }

    setData((prev) => {
      const existingIdx = prev.trips.findIndex((t) => t.id === trip.id);
      let trips: Trip[];
      if (existingIdx >= 0) {
        trips = [...prev.trips];
        trips[existingIdx] = trip;
      } else {
        trips = [...prev.trips, trip];
      }

      let updatedPeriods = prev.servicePeriods || [];
      if (servicePeriods !== undefined) {
        const objectId = `${trip.city}|${trip.purpose}`;
        updatedPeriods = [
          ...updatedPeriods.filter(p => p.objectId !== objectId),
          ...servicePeriods,
        ];
      }

      return {
        specialists: updatedSpecialists,
        trips,
        servicePeriods: updatedPeriods,
        vacations: prev.vacations,
        trainings: prev.trainings,
        archivedIds: prev.archivedIds,
      };
    });
  }, [data.specialists, data.servicePeriods, data.vacations]);

  // === Удаление командировки ===
  const handleDeleteTrip = useCallback(async (tripId: string) => {
    await deleteTrip(tripId);
    setData((prev) => ({
      ...prev,
      trips: prev.trips.filter((t) => t.id !== tripId),
    }));
  }, []);

  // === Сохранение отпуска ===
  const handleSaveVacation = useCallback(async (vacation: Vacation) => {
    await saveVacation(vacation);
    setData((prev) => ({
      ...prev,
      vacations: [...(prev.vacations || []), vacation],
    }));
  }, []);

  // === Удаление отпуска ===
  const handleDeleteVacation = useCallback(async (vacationId: string) => {
    await deleteVacation(vacationId);
    setData((prev) => ({
      ...prev,
      vacations: (prev.vacations || []).filter(v => v.id !== vacationId),
    }));
  }, []);

  // === Архивирование ===
  const handleArchive = useCallback((ids: string[]) => {
    const newArchivedIds = [...new Set([...archivedIds, ...ids])];
    saveArchivedIds(newArchivedIds);
    setData(prev => ({ ...prev, archivedIds: newArchivedIds }));
  }, [archivedIds]);

  const handleUnarchive = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const newArchivedIds = archivedIds.filter(id => !idSet.has(id));
    saveArchivedIds(newArchivedIds);
    setData(prev => ({ ...prev, archivedIds: newArchivedIds }));
  }, [archivedIds]);

  // === Экспорт / Импорт ===
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
      if (imported.trips.some((t: any) => t.specialistId && !t.specialistIds)) {
        imported.trips = imported.trips.map((t: any) => ({
          ...t,
          specialistIds: t.specialistIds || [t.specialistId],
        }));
      }
      if (!imported.trainings) imported.trainings = [];
      if (!imported.archivedIds) imported.archivedIds = [];
      setData(imported);
      localStorage.removeItem("trip-schedule-import");
      alert("Импорт завершён.");
    } catch (e) {
      alert("Ошибка импорта");
    }
  };

  const handleReset = async () => {
    if (!confirm("Сбросить все данные к начальному состоянию?")) return;
    setData(SEED_DATA);
    alert("Данные сброшены.");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0eeeb" }}>
        <div style={{ color: "#5a5a72", fontFamily: "'Inter', sans-serif" }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f0eeeb" }}>
      <Header
        onAddTrip={() => {
          setEditingTrip(null);
          setShowAddModal(true);
        }}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onArchiveClick={() => setShowArchiveModal(true)}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        tripCount={data.trips.length}
        specialistCount={data.specialists.length}
        archivedCount={archivedCount}
      />

      {!showArchived && (
        <FilterChips
          specialists={data.specialists}
          selected={selectedSpecialist}
          onSelect={setSelectedSpecialist}
          tripCountBySpecialist={tripCountBySpecialist}
        />
      )}

      <Timeline
        specialists={visibleSpecialists}
        trips={filteredTrips}
        servicePeriods={data.servicePeriods || []}
        vacations={filteredVacations}
        trainings={filteredTrainings}
        archivedIds={archivedIds}
        showArchived={showArchived}
        onSelectTrip={setViewingTrip}
        onAddVacation={() => setShowVacationModal(true)}
        onDeleteVacation={handleDeleteVacation}
      />

      {showAddModal && (
        <AddTripModal
          specialists={data.specialists}
          existingObjects={existingObjects}
          initialTrip={editingTrip}
          initialServicePeriods={editingServicePeriods}
          onSave={handleSaveTrip}
          onClose={() => {
            setShowAddModal(false);
            setEditingTrip(null);
          }}
        />
      )}

      {showVacationModal && (
        <AddVacationModal
          specialists={data.specialists}
          onSave={handleSaveVacation}
          onClose={() => setShowVacationModal(false)}
        />
      )}

      {showArchiveModal && (
        <ArchiveModal
          objects={allObjects}
          archivedIds={archivedIds}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onClose={() => setShowArchiveModal(false)}
        />
      )}

      {viewingTrip && (
        <TripDetailsModal
          trip={viewingTrip}
          specialists={data.specialists}
          servicePeriods={data.servicePeriods}
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
