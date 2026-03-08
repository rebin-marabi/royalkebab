import { createContext, useContext, useState, ReactNode } from "react";

export interface MitarbeiterData {
  id: number;
  // Persönliche Daten
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  geburtsort: string;
  nationalitaet: string;
  familienstand: string;
  adresse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  // Steuer & Sozialversicherung
  steuerID: string;
  sozialversicherungsnr: string;
  krankenkasse: string;
  // Bank
  iban: string;
  // Vertrag
  eintrittsdatum: string;
  position: string;
  stundenProWoche: number;
  stundenlohn: number;
  vertragStatus: "aktiv" | "gekuendigt" | "ausgelaufen";
  kuendigungsdatum?: string;
  // Status
  status: "aktiv" | "inaktiv";
}

const initialData: MitarbeiterData[] = [
  {
    id: 1, vorname: "Ali", nachname: "Yilmaz", geburtsdatum: "1990-05-12", geburtsort: "Istanbul",
    nationalitaet: "Deutsch", familienstand: "Verheiratet", adresse: "Berliner Str. 15", plz: "12345",
    ort: "Berlin", telefon: "0151 1234567", email: "ali@example.de", steuerID: "12345678901",
    sozialversicherungsnr: "12 120590 Y 123", krankenkasse: "AOK", iban: "DE89 3704 0044 0532 0130 00",
    eintrittsdatum: "2023-01-15", position: "Dönermacher", stundenProWoche: 38, stundenlohn: 14,
    vertragStatus: "aktiv", status: "aktiv",
  },
  {
    id: 2, vorname: "Murat", nachname: "Demir", geburtsdatum: "1995-08-22", geburtsort: "Ankara",
    nationalitaet: "Türkisch", familienstand: "Ledig", adresse: "Hauptstr. 42", plz: "12345",
    ort: "Berlin", telefon: "0152 7654321", email: "murat@example.de", steuerID: "98765432109",
    sozialversicherungsnr: "12 220895 D 456", krankenkasse: "TK", iban: "DE27 1005 0000 0190 0881 50",
    eintrittsdatum: "2024-06-01", position: "Kassierer", stundenProWoche: 20, stundenlohn: 12.5,
    vertragStatus: "aktiv", status: "aktiv",
  },
  {
    id: 3, vorname: "Leyla", nachname: "Kaya", geburtsdatum: "1998-03-10", geburtsort: "Berlin",
    nationalitaet: "Deutsch", familienstand: "Ledig", adresse: "Kastanienallee 8", plz: "10435",
    ort: "Berlin", telefon: "0170 9876543", email: "leyla@example.de", steuerID: "45678901234",
    sozialversicherungsnr: "12 100398 K 789", krankenkasse: "Barmer", iban: "DE60 1001 0010 0987 6543 21",
    eintrittsdatum: "2025-02-01", position: "Service", stundenProWoche: 25, stundenlohn: 12.5,
    vertragStatus: "aktiv", status: "aktiv",
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
