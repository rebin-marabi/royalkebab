import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { StundenEintrag } from "@/lib/stundenUtils";
export type Vertragstyp = "minijob" | "teilzeit" | "vollzeit";

export interface MitarbeiterData {
  id: number;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  anschrift: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  steuerID: string;
  sozialversicherungsnr: string;
  krankenkasse: string;
  iban: string;
  eintrittsdatum: string;
  position: string;
  arbeitsort: string;
  vertragstyp: Vertragstyp;
  monatlicheStunden: number;
  stundenlohn: number;
  probezeitMonate: number;
  zusatzurlaub: number;
  vertragsart: "unbefristet" | "befristet";
  befristetBis?: string;
  wochenStunden?: number; // for Vollzeit/Teilzeit
  monatsgehalt?: number;  // for Vollzeit
  vertragStatus: "aktiv" | "gekuendigt" | "ausgelaufen";
  kuendigungsdatum?: string;
  status: "aktiv" | "inaktiv";
}

export interface RechnungData {
  id: number;
  monat: string; // "YYYY-MM"
  dateiName: string;
  dateiTyp: string;
  dateiData: string; // base64
  beschreibung: string;
  betrag?: number;
  hochgeladenAm: string;
}

export interface KontoauszugData {
  id: number;
  monat: string;
  dateiName: string;
  dateiTyp: string;
  dateiData: string;
  beschreibung: string;
  hochgeladenAm: string;
}

export interface ArbeitgeberDaten {
  name: string;
  adresse: string;
  vertreter: string;
  ort: string;
}

export interface VertragsParagraph {
  titel: string;
  inhalt: string; // supports placeholders like {name}, {adresse}, etc.
}

export interface VertragsVorlage {
  typ: Vertragstyp;
  label: string;
  ueberschrift: string;
  paragraphen: VertragsParagraph[];
}

const defaultArbeitgeber: ArbeitgeberDaten = {
  name: "Royal Kebab",
  adresse: "Augsburger Str. 3, 01309 Dresden",
  vertreter: "MOHAMMED AMIN Mohammed Fouad M. Amin",
  ort: "Dresden",
};

function createVorlagen(): VertragsVorlage[] {
  return [
    {
      typ: "minijob",
      label: "Minijob",
      ueberschrift: "Arbeitsvertrag fuer geringfuegig entlohnte Beschaeftigung (Minijob)",
      paragraphen: [
        { titel: "Beginn, Dauer", inhalt: "Das Arbeitsverhaeltnis beginnt am {eintrittsdatum}.\n{dauer_text}" },
        { titel: "Probezeit", inhalt: "Die ersten {probezeitMonate} Monate gelten als Probezeit. Waehrend der Probezeit kann das Arbeitsverhaeltnis von beiden Seiten mit einer Frist von zwei Wochen gekuendigt werden." },
        { titel: "Taetigkeit", inhalt: "Der Arbeitnehmer wird als {position} eingestellt.\n\nDer Arbeitgeber kann dem Arbeitnehmer andere zumutbare, gleichwertige Taetigkeiten uebertragen, soweit dies betrieblich erforderlich ist und keine Minderung der Verguetung zur Folge hat." },
        { titel: "Arbeitsort / Einsatzorte", inhalt: "Regelmaessiger Arbeitsort ist: {arbeitsort}.\n\nDer Arbeitnehmer erklaert sich bereit, im Rahmen des Zumutbaren auch an anderen Einsatzorten taetig zu werden, soweit dies betrieblich erforderlich ist." },
        { titel: "Arbeitszeit", inhalt: "Die regelmaessige monatliche Arbeitszeit betraegt derzeit {monatlicheStunden} Stunden.\n\nDie Lage der Arbeitszeit richtet sich nach der betrieblichen Einteilung/Absprache.\n\nPausen richten sich nach den gesetzlichen Bestimmungen und betrieblicher Organisation." },
        { titel: "Verguetung / Minijob-Grenze", inhalt: "Der Arbeitnehmer erhaelt einen Stundenlohn in Hoehe von {stundenlohn} EUR brutto.\n\nDie Verguetung wird spaetestens zum Monatsende auf ein vom Arbeitnehmer benanntes Konto ueberwiesen.\n\nDie Parteien sind sich einig, dass es sich um eine geringfuegig entlohnte Beschaeftigung handelt. Die monatliche Verguetung darf die gesetzliche Geringfuegigkeitsgrenze nicht ueberschreiten." },
        { titel: "Mehrarbeit / Ueberstunden", inhalt: "Mehrarbeit wird nur auf ausdrueckliche Anordnung oder Genehmigung des Arbeitgebers geleistet. Etwaige Mehrarbeit wird durch Freizeit ausgeglichen oder mit dem vereinbarten Stundenlohn verguetet, soweit dadurch die Minijob-Grenze nicht ueberschritten wird." },
        { titel: "Urlaub", inhalt: "Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub. Zusaetzlich gewaehrt der Arbeitgeber {zusatzurlaub} Arbeitstage vertraglichen Zusatzurlaub pro Kalenderjahr." },
        { titel: "Arbeitsverhinderung / Krankheit", inhalt: "Im Krankheitsfall ist der Arbeitnehmer verpflichtet, den Arbeitgeber unverzueglich ueber die Arbeitsunfaehigkeit und deren voraussichtliche Dauer zu informieren.\n\nDauert die Arbeitsunfaehigkeit laenger als drei Kalendertage, ist spaetestens am darauffolgenden Arbeitstag eine aerztliche Bescheinigung vorzulegen." },
        { titel: "Verschwiegenheit", inhalt: "Der Arbeitnehmer verpflichtet sich, ueber Betriebs- und Geschaeftsgeheimnisse sowie interne Vorgaenge waehrend des Arbeitsverhaeltnisses und nach dessen Beendigung Stillschweigen zu bewahren." },
        { titel: "Nebentaetigkeit", inhalt: "Eine Nebentaetigkeit ist zulaessig, sofern dadurch arbeitsvertragliche Pflichten nicht beeintraechtigt werden und keine Wettbewerbsinteressen verletzt werden." },
        { titel: "Arbeitsschutz / Hygiene", inhalt: "Der Arbeitnehmer ist verpflichtet, die geltenden Arbeitsschutz-, Hygiene- und Sicherheitsvorschriften einzuhalten." },
        { titel: "Kuendigung", inhalt: "Nach Ablauf der Probezeit gilt die gesetzliche Kuendigungsfrist. Die Kuendigung bedarf der Schriftform." },
        { titel: "Schlussbestimmungen", inhalt: "Aenderungen und Ergaenzungen dieses Vertrages beduerfen der Schriftform.\n\nSollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder werden, bleibt die Wirksamkeit der uebrigen Bestimmungen unberuehrt." },
      ],
    },
    {
      typ: "teilzeit",
      label: "Teilzeit",
      ueberschrift: "Arbeitsvertrag fuer Teilzeitbeschaeftigung",
      paragraphen: [
        { titel: "Beginn, Dauer", inhalt: "Das Arbeitsverhaeltnis beginnt am {eintrittsdatum}.\n{dauer_text}" },
        { titel: "Probezeit", inhalt: "Die ersten {probezeitMonate} Monate gelten als Probezeit. Waehrend der Probezeit kann das Arbeitsverhaeltnis von beiden Seiten mit einer Frist von zwei Wochen gekuendigt werden." },
        { titel: "Taetigkeit", inhalt: "Der Arbeitnehmer wird als {position} eingestellt.\n\nDer Arbeitgeber kann dem Arbeitnehmer andere zumutbare, gleichwertige Taetigkeiten uebertragen, soweit dies betrieblich erforderlich ist." },
        { titel: "Arbeitsort", inhalt: "Regelmaessiger Arbeitsort ist: {arbeitsort}." },
        { titel: "Arbeitszeit", inhalt: "Die regelmaessige woechentliche Arbeitszeit betraegt {wochenStunden} Stunden.\n\nDie Verteilung der Arbeitszeit richtet sich nach der betrieblichen Einteilung." },
        { titel: "Verguetung", inhalt: "Der Arbeitnehmer erhaelt einen Stundenlohn in Hoehe von {stundenlohn} EUR brutto.\n\nDie Verguetung wird spaetestens zum Monatsende auf ein vom Arbeitnehmer benanntes Konto ueberwiesen." },
        { titel: "Ueberstunden", inhalt: "Ueberstunden werden nur auf Anordnung des Arbeitgebers geleistet und durch Freizeit ausgeglichen oder verguetet." },
        { titel: "Urlaub", inhalt: "Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub anteilig zur Arbeitszeit. Zusaetzlich gewaehrt der Arbeitgeber {zusatzurlaub} Arbeitstage Zusatzurlaub." },
        { titel: "Krankheit", inhalt: "Im Krankheitsfall ist der Arbeitnehmer verpflichtet, den Arbeitgeber unverzueglich zu informieren. Ab dem dritten Kalendertag ist eine aerztliche Bescheinigung vorzulegen." },
        { titel: "Verschwiegenheit", inhalt: "Der Arbeitnehmer verpflichtet sich zur Verschwiegenheit ueber Betriebs- und Geschaeftsgeheimnisse." },
        { titel: "Kuendigung", inhalt: "Nach Ablauf der Probezeit gilt die gesetzliche Kuendigungsfrist. Die Kuendigung bedarf der Schriftform." },
        { titel: "Schlussbestimmungen", inhalt: "Aenderungen und Ergaenzungen dieses Vertrages beduerfen der Schriftform." },
      ],
    },
    {
      typ: "vollzeit",
      label: "Vollzeit",
      ueberschrift: "Arbeitsvertrag fuer Vollzeitbeschaeftigung",
      paragraphen: [
        { titel: "Beginn, Dauer", inhalt: "Das Arbeitsverhaeltnis beginnt am {eintrittsdatum}.\n{dauer_text}" },
        { titel: "Probezeit", inhalt: "Die ersten {probezeitMonate} Monate gelten als Probezeit. Waehrend der Probezeit kann das Arbeitsverhaeltnis von beiden Seiten mit einer Frist von zwei Wochen gekuendigt werden." },
        { titel: "Taetigkeit", inhalt: "Der Arbeitnehmer wird als {position} eingestellt.\n\nDer Arbeitgeber kann dem Arbeitnehmer andere zumutbare, gleichwertige Taetigkeiten uebertragen, soweit dies betrieblich erforderlich ist." },
        { titel: "Arbeitsort", inhalt: "Regelmaessiger Arbeitsort ist: {arbeitsort}." },
        { titel: "Arbeitszeit", inhalt: "Die regelmaessige woechentliche Arbeitszeit betraegt {wochenStunden} Stunden (Vollzeit).\n\nDie Verteilung der Arbeitszeit richtet sich nach der betrieblichen Einteilung." },
        { titel: "Verguetung", inhalt: "Der Arbeitnehmer erhaelt ein monatliches Bruttogehalt in Hoehe von {monatsgehalt} EUR.\n\nDie Verguetung wird spaetestens zum Monatsende auf ein vom Arbeitnehmer benanntes Konto ueberwiesen." },
        { titel: "Ueberstunden", inhalt: "Ueberstunden werden nur auf Anordnung des Arbeitgebers geleistet und durch Freizeit ausgeglichen oder verguetet." },
        { titel: "Urlaub", inhalt: "Der Arbeitnehmer hat Anspruch auf {zusatzurlaub_plus_gesetzlich} Arbeitstage Urlaub pro Kalenderjahr (gesetzlich + {zusatzurlaub} Tage Zusatzurlaub)." },
        { titel: "Krankheit", inhalt: "Im Krankheitsfall ist der Arbeitnehmer verpflichtet, den Arbeitgeber unverzueglich zu informieren. Ab dem dritten Kalendertag ist eine aerztliche Bescheinigung vorzulegen." },
        { titel: "Verschwiegenheit", inhalt: "Der Arbeitnehmer verpflichtet sich zur Verschwiegenheit ueber Betriebs- und Geschaeftsgeheimnisse." },
        { titel: "Nebentaetigkeit", inhalt: "Jede Nebentaetigkeit bedarf der vorherigen schriftlichen Zustimmung des Arbeitgebers." },
        { titel: "Kuendigung", inhalt: "Nach Ablauf der Probezeit gilt die gesetzliche Kuendigungsfrist. Die Kuendigung bedarf der Schriftform." },
        { titel: "Schlussbestimmungen", inhalt: "Aenderungen und Ergaenzungen dieses Vertrages beduerfen der Schriftform." },
      ],
    },
  ];
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
    vertragstyp: "vollzeit", monatlicheStunden: 160, stundenlohn: 13,
    wochenStunden: 40, monatsgehalt: 2080,
    probezeitMonate: 6, zusatzurlaub: 0,
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
    vertragstyp: "minijob", monatlicheStunden: 9, stundenlohn: 13,
    probezeitMonate: 6, zusatzurlaub: 0,
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
    vertragstyp: "teilzeit", monatlicheStunden: 100, stundenlohn: 13,
    wochenStunden: 25,
    probezeitMonate: 6, zusatzurlaub: 0,
    vertragsart: "unbefristet", vertragStatus: "aktiv", status: "aktiv",
  },
];

interface StoreContextType {
  mitarbeiter: MitarbeiterData[];
  addMitarbeiter: (ma: Omit<MitarbeiterData, "id">) => void;
  updateMitarbeiter: (id: number, data: Partial<MitarbeiterData>) => void;
  arbeitgeber: ArbeitgeberDaten;
  setArbeitgeber: (data: ArbeitgeberDaten) => void;
  vorlagen: VertragsVorlage[];
  updateVorlage: (typ: Vertragstyp, vorlage: VertragsVorlage) => void;
  stunden: StundenEintrag[];
  setStunden: React.Dispatch<React.SetStateAction<StundenEintrag[]>>;
  addStunden: (entries: StundenEintrag[]) => void;
  deleteStunde: (id: number) => void;
  deleteStundenForMonth: (maId: number, monthPrefix: string) => void;
  rechnungen: RechnungData[];
  addRechnung: (r: Omit<RechnungData, "id">) => void;
  deleteRechnung: (id: number) => void;
  kontoauszuege: KontoauszugData[];
  addKontoauszug: (k: Omit<KontoauszugData, "id">) => void;
  deleteKontoauszug: (id: number) => void;
}

const initialStunden: StundenEintrag[] = [
  { id: 1, mitarbeiterId: 1, datum: "2026-03-08", startzeit: "10:00", endzeit: "18:00", pause: 30, notiz: "" },
  { id: 2, mitarbeiterId: 2, datum: "2026-03-08", startzeit: "11:00", endzeit: "14:00", pause: 0, notiz: "" },
  { id: 3, mitarbeiterId: 1, datum: "2026-03-07", startzeit: "10:00", endzeit: "18:30", pause: 30, notiz: "" },
  { id: 4, mitarbeiterId: 3, datum: "2026-03-07", startzeit: "12:00", endzeit: "20:00", pause: 45, notiz: "" },
];

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mitarbeiter, setMitarbeiter] = useState<MitarbeiterData[]>(initialData);
  const [arbeitgeber, setArbeitgeber] = useState<ArbeitgeberDaten>(defaultArbeitgeber);
  const [vorlagen, setVorlagen] = useState<VertragsVorlage[]>(createVorlagen());
  const [stunden, setStunden] = useState<StundenEintrag[]>(initialStunden);
  const [rechnungen, setRechnungen] = useState<RechnungData[]>([]);

  const addMitarbeiter = useCallback((ma: Omit<MitarbeiterData, "id">) => {
    setMitarbeiter((prev) => [...prev, { ...ma, id: Date.now() }]);
  }, []);

  const updateMitarbeiter = useCallback((id: number, data: Partial<MitarbeiterData>) => {
    setMitarbeiter((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  }, []);

  const updateVorlage = useCallback((typ: Vertragstyp, vorlage: VertragsVorlage) => {
    setVorlagen((prev) => prev.map((v) => (v.typ === typ ? vorlage : v)));
  }, []);

  const addStunden = useCallback((entries: StundenEintrag[]) => {
    setStunden((prev) => [...prev, ...entries]);
  }, []);

  const deleteStunde = useCallback((id: number) => {
    setStunden((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const deleteStundenForMonth = useCallback((maId: number, monthPrefix: string) => {
    setStunden((prev) => prev.filter((s) => !(s.mitarbeiterId === maId && s.datum.startsWith(monthPrefix))));
  }, []);

  const addRechnung = useCallback((r: Omit<RechnungData, "id">) => {
    setRechnungen((prev) => [...prev, { ...r, id: Date.now() }]);
  }, []);

  const deleteRechnung = useCallback((id: number) => {
    setRechnungen((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <StoreContext.Provider value={{
      mitarbeiter, addMitarbeiter, updateMitarbeiter,
      arbeitgeber, setArbeitgeber,
      vorlagen, updateVorlage,
      stunden, setStunden, addStunden, deleteStunde, deleteStundenForMonth,
      rechnungen, addRechnung, deleteRechnung,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export const VERTRAGSTYP_LABELS: Record<Vertragstyp, string> = {
  minijob: "Minijob",
  teilzeit: "Teilzeit",
  vollzeit: "Vollzeit",
};
