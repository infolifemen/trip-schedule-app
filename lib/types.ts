export interface Specialist {
  id: string;
  name: string;
  color: string;
}

export interface Trip {
  id: string;
  specialistId: string;
  city: string;
  purpose: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  note?: string;
}

export interface AppData {
  specialists: Specialist[];
  trips: Trip[];
}
