"use client";

import { Plus, Download, Upload, RotateCcw } from "lucide-react";
import LogoutButton from "./LogoutButton";

interface HeaderProps {
  onAddTrip: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  tripCount: number;
  specialistCount: number;
}

export function Header({
  onAddTrip,
  onExport,
  onImport,
  onReset,
  tripCount,
  specialistCount,
}: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1a1a2e",
            margin: 0,
            letterSpacing: "-0.3px",
          }}>
            📊 График командировок
          </h1>
          <p style={{ fontSize: 12, color: "#5a5a72", marginTop: 4, margin: 0 }}>
            {specialistCount} специалистов · {tripCount} командировок
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={onAddTrip}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#1d4ed8";
              (e.target as HTMLElement).style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#2563eb";
              (e.target as HTMLElement).style.transform = "scale(1)";
            }}
          >
            <Plus size={16} />
            Добавить
          </button>

          <button
            onClick={onExport}
            title="Экспорт JSON"
            style={{
              padding: 8,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 8,
              color: "#5a5a72",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,0,0,0.04)";
            }}
          >
            <Download size={16} />
          </button>

          <label
            title="Импорт JSON"
            style={{
              padding: 8,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 8,
              color: "#5a5a72",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
            }}
          >
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const data = JSON.parse(reader.result as string);
                      localStorage.setItem("trip-schedule-import", JSON.stringify(data));
                      onImport();
                    } catch {
                      alert("Ошибка чтения файла");
                    }
                  };
                  reader.readAsText(file);
                }
                e.target.value = "";
              }}
            />
          </label>

          <button
            onClick={() => {
              if (confirm("Сбросить все данные и вернуть демо-данные?")) {
                onReset();
              }
            }}
            title="Сброс к демо-данным"
            style={{
              padding: 8,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 8,
              color: "#5a5a72",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,0,0,0.04)";
            }}
          >
            <RotateCcw size={16} />
          </button>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
