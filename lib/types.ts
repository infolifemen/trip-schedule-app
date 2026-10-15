export interface Specialist {
  id: string;
  name: string;
  color: string;
}

export interface Trip {
  id: string;
  specialistId: string;
  city: string;        // объект
  purpose: string;     // вид работ (КДО, ТИ, ЧР, ВД, ОБТК...)
  start: string;       // YYYY-MM-DD
  end: string;         // YYYY-MM-DD
  note?: string;
}

// Маркер начала/окончания оказания услуг
export interface ServiceMarker {
  id: string;
  objectId: string;     // идентификатор объекта (city + purpose)
  type: "start" | "end";
  date: string;         // YYYY-MM-DD
  label?: string;       // опциональная подпись
}

export interface AppData {
  specialists: Specialist[];
  trips: Trip[];
  serviceMarkers?: ServiceMarker[];
}

// Сгруппированный объект для Timeline
export interface TimelineObject {
  id: string;           // city + "|" + purpose
  city: string;
  purpose: string;
  trips: Trip[];        // командировки по этому объекту
  startMarkers: ServiceMarker[];  // до 4
  endMarkers: ServiceMarker[];    // до 4
  completed?: boolean;  // объект выполнен (скрыт по умолчанию)
}

// Специальные строки таймлайна
export type TimelineRowType = "object" | "training" | "vacation1" | "vacation2" | "completed-section";

// Группировка пересекающихся командировок (для отображения всех участников)
export interface TripGroup {
  trips: Trip[];
  start: Date;
  end: Date;
  left: number;
  width: number;
  specialistNames: string[];
}
