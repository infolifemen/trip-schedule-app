"use client";

import { Plus, Download, Upload, RotateCcw } from "lucide-react";
import type { AppData } from "@/lib/types";

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
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📊 График командировок
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {specialistCount} специалистов · {tripCount} командировок
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddTrip}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
          >
            <Plus size={18} />
            Добавить
          </button>

          <button
            onClick={onExport}
            title="Экспорт JSON"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <Download size={18} />
          </button>

          <label
            title="Импорт JSON"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Upload size={18} />
            <input
              type="file"
              accept=".json"
              className="hidden"
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
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
