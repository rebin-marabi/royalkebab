import { createContext, useContext, useState, ReactNode } from "react";

export interface MitarbeiterData {
  id: number;
  // Persönliche Daten
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  anschrift: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  // Steuer & Sozialversicherung
  steuerID: string;
  sozialversicherungsnr: string;
  krankenkasse: string;
  iban: string;
  // Vertragsdaten
  eintrittsdatum: string;
  position: string;
  arbeitsort: string;
  monatlicheStunden: number;
  stundenlohn: number;
  probezeitMonate: number;
  zusatzurlaub: number;
  vertragsart: "unbefristet" | "befristet";
  befristetBis?: string;
  // Status
  vertragStatus: "aktiv" | "gekuendigt" | "ausgelaufen";
  kuendigungsdatum?: string;
  status: "aktiv" | "inaktiv";
}

const initialData: MitarbeiterData[] = [
  {
    id: 1, vorname: "Ali", nachname: "Yilmaz", geburtsdatum: "1990-05-12",
    anschrift: "Berliner Str. 15", plz: "01309", ort: "Dresden",
    telefon: "0151 1234567", email: "ali@example.de",
    steuerID: "12345678901", sozialversicherungsnr: "12 120590 Y 123",
    krankenkasse: "AOK", iban: "DE89 3704 0044 0532 0130 00",
    eintrittsdatum: "2023-01-15", position: "Mitarbeiter im Imbissbetrieb",
    arbeitsort: "Augsburger Str. 3, 01309 Dresden",
    monatlicheStunden: 40, stundenlohn: 13, probezeitMonate: 6, zusatzurlaub: 0,
    vertragsart: "unbefristet", vertragStatus: "aktiv", status: "aktiv",
  },
  {
    id: 2, vorname: "Murat", nachname: "Demir", geburtsdatum: "1995-08-22",
    anschrift: "Hauptstr. 42", plz: "01307", ort: "Dresden",
    telefon: "0152 7654321", email: "murat@example.de",
    steuerID: "98765432109", sozialversicherungsnr: "12 220895 D 456",
    krankenkasse: "TK", iban: "DE27 1005 0000 0190 0881 50",
    eintrittsdatum: "2024-06-01", position: "Mitarbeiter im Imbissbetrieb",
    arbeitsort: "Augsburger Str. 3, 01309 Dresden",
    monatlicheStunden: 9, stundenlohn: 13, probezeitMonate: 6, zusatzurlaub: 0,
    vertragsart: "unbefristet", vertragStatus: "aktiv", status: "aktiv",
  },
  {
    id: 3, vorname: "Leyla", nachname: "Kaya", geburtsdatum: "1998-03-10",
    anschrift: "Kastanienallee 8", plz: "01307", ort: "Dresden",
    telefon: "0170 9876543", email: "leyla@example.de",
    steuerID: "45678901234", sozialversicherungsnr: "12 100398 K 789",
    krankenkasse: "Barmer", iban: "DE60 1001 0010 0987 6543 21",
    eintrittsdatum: "2025-02-01", position: "Mitarbeiter im Imbissbetrieb",
    arbeitsort: "Augsburger Str. 3, 01309 Dresden",
    monatlicheStunden: 25, stundenlohn: 13, probezeitMonate: 6, zusatzurlaub: 0,
    vertragsart: "unbefristet", vertragStatus: "aktiv", status: "aktiv",
  },
];

interface StoreContextType {
  mitarbeiter: MitarbeiterData[];
  addMitarbeiter: (ma: Omit<MitarbeiterData, "id">) => void;
  updateMitarbeiter: (id: number, data: Partial<MitarbeiterData>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mitarbeiter, setMitarbeiter] = useState<MitarbeiterData[]>(initialData);

  const addMitarbeiter = (ma: Omit<MitarbeiterData, "id">) => {
    setMitarbeiter((prev) => [...prev, { ...ma, id: Date.now() }]);
  };

  const updateMitarbeiter = (id: number, data: Partial<MitarbeiterData>) => {
    setMitarbeiter((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  return (
    <StoreContext.Provider value={{ mitarbeiter, addMitarbeiter, updateMitarbeiter }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
