"use client";

import { useState } from "react";
import type { TimelineObject } from "@/lib/types";
import { X, Archive } from "lucide-react";

interface ArchiveModalProps {
  objects: TimelineObject[];
  archivedIds: string[];
  onArchive: (ids: string[]) => void;
  onUnarchive: (ids: string[]) => void;
  onClose: () => void;
}

export function ArchiveModal({
  objects,
  archivedIds,
  onArchive,
  onUnarchive,
  onClose,
}: ArchiveModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeObjects = objects.filter(o => !archivedIds.includes(o.id));
  const archivedObjects = objects.filter(o => archivedIds.includes(o.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchive = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    onArchive(ids);
    setSelectedIds(new Set());
    onClose();
  };

  const handleUnarchive = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    onUnarchive(ids);
    setSelectedIds(new Set());
    onClose();
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Archive size={20} style={{ color: "#f59e0b" }} />
            Архивирование объектов
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

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Активные объекты — для архивирования */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                📋 Активные объекты ({activeObjects.length})
              </label>
              {activeObjects.length > 0 && (
                <button
                  onClick={() => selectAll(activeObjects.map(o => o.id))}
                  style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Выбрать все
                </button>
              )}
            </div>
            {activeObjects.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8e8ea0", textAlign: "center", padding: "16px 0", background: "#f8fafc", borderRadius: 10 }}>
                Нет активных объектов
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 192, overflow: "auto" }}>
                {activeObjects.map((obj) => (
                  <label
                    key={obj.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: selectedIds.has(obj.id) ? "rgba(245,158,11,0.08)" : "#f8fafc",
                      border: selectedIds.has(obj.id) ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(obj.id)}
                      onChange={() => toggleSelect(obj.id)}
                      style={{ width: 16, height: 16, borderRadius: 4, accentColor: "#f59e0b" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {obj.city} — {obj.purpose}
                      </div>
                      {obj.equipment && (
                        <div style={{ fontSize: 11, color: "#8e8ea0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {obj.equipment}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#8e8ea0", flexShrink: 0 }}>
                      {obj.trips.length} ком.
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Архивные объекты — для восстановления */}
          {archivedObjects.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                  📦 В архиве ({archivedObjects.length})
                </label>
                <button
                  onClick={() => selectAll(archivedObjects.map(o => o.id))}
                  style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Выбрать все
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 144, overflow: "auto" }}>
                {archivedObjects.map((obj) => (
                  <label
                    key={obj.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: selectedIds.has(obj.id) ? "rgba(34,197,94,0.08)" : "#f8fafc",
                      border: selectedIds.has(obj.id) ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
                      opacity: 0.7,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(obj.id)}
                      onChange={() => toggleSelect(obj.id)}
                      style={{ width: 16, height: 16, borderRadius: 4, accentColor: "#22c55e" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#5a5a72", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {obj.city} — {obj.purpose}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", color: "#5a5a72", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "#f1f5f9"; }}
          >
            Отмена
          </button>
          {archivedObjects.some(o => selectedIds.has(o.id)) && (
            <button
              onClick={handleUnarchive}
              style={{ padding: "12px 16px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#16a34a"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#22c55e"; }}
            >
              ↩ Восстановить ({Array.from(selectedIds).filter(id => archivedIds.includes(id)).length})
            </button>
          )}
          {activeObjects.some(o => selectedIds.has(o.id)) && (
            <button
              onClick={handleArchive}
              style={{ padding: "12px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#d97706"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "#f59e0b"; }}
            >
              📦 В архив ({Array.from(selectedIds).filter(id => !archivedIds.includes(id)).length})
            </button>
          )}
          {selectedIds.size === 0 && (
            <button
              disabled
              style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", color: "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "not-allowed", fontFamily: "inherit" }}
            >
              Выберите объекты
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
