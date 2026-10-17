export interface Specialist {
  id: string;
  name: string;
  color: string;
}

export interface Trip {
  id: string;
  specialistIds: string[];   // 1-3 специалиста на командировку
  city: string;              // объект
  purpose: string;           // вид работ (КДО, ТИ, ЧР, ВД, ОБТК...)
  equipment?: string;        // вид оборудования
  start: string;             // YYYY-MM-DD
  end: string;               // YYYY-MM-DD
  note?: string;
}

// Период оказания услуг (до 6 на объект)
export interface ServicePeriod {
  id: string;
  objectId: string;          // city|purpose
  start: string;             // YYYY-MM-DD
  end: string;               // YYYY-MM-DD
}

// Отпуск специалиста
export interface Vacation {
  id: string;
  specialistId: string;
  start: string;             // YYYY-MM-DD
  end: string;               // YYYY-MM-DD
}

export interface AppData {
  specialists: Specialist[];
  trips: Trip[];
  servicePeriods?: ServicePeriod[];
  vacations?: Vacation[];
}

// Сгруппированный объект для Timeline
export interface TimelineObject {
  id: string;                // city + "|" + purpose
  city: string;
  purpose: string;
  equipment?: string;
  trips: Trip[];
  servicePeriods: ServicePeriod[];  // до 6
  completed?: boolean;
}

// Строки таймлайна
export type TimelineRowType = "object" | "vacation" | "completed-section";

// Группировка пересекающихся командировок
export interface TripGroup {
  trips: Trip[];
  start: Date;
  end: Date;
  left: number;
  width: number;
  specialistNames: string[];
}

// Существующий объект (для dropdown при добавлении)
export interface ExistingObject {
  id: string;                // city|purpose
  city: string;
  purpose: string;
  equipment?: string;
}
