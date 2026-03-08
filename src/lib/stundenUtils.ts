import { MitarbeiterData } from "@/store/useStore";

export interface StundenEintrag {
  id: number;
  mitarbeiterId: number;
  datum: string;
  startzeit: string;
  endzeit: string;
  pause: number; // Minuten
  notiz: string;
}

export function calcHours(start: string, end: string, pause: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm) - pause;
  return Math.max(0, totalMin / 60);
}

// Gesetzliche Regeln (ArbZG Deutschland):
// - Max 10h Arbeitszeit pro Tag
// - Ab 6h: 30 Min Pause, ab 9h: 45 Min Pause
// - Sonntag = kein regulaerer Arbeitstag (Gastronomie: erlaubt, aber beachten)
function getPflichtpause(arbeitszeitStunden: number): number {
  if (arbeitszeitStunden > 9) return 45;
  if (arbeitszeitStunden > 6) return 30;
  return 0;
}

function getWeekdaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    // Mo-Sa = 1-6 (Gastronomie arbeitet auch Samstag)
    if (dow >= 1 && dow <= 6) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(dateStr);
    }
  }
  return days;
}

/**
 * Generiert Stundeneintraege fuer einen ganzen Monat.
 * Respektiert: Vertragsstunden, max 10h/Tag, Pflichtpausen.
 */
export function generateMonthEntries(
  ma: MitarbeiterData,
  year: number,
  month: number,
  existingEntries: StundenEintrag[]
): StundenEintrag[] {
  const workdays = getWeekdaysInMonth(year, month);
  
  // Bereits eingetragene Tage dieses Monats fuer diesen MA
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const existingDates = new Set(
    existingEntries
      .filter((e) => e.mitarbeiterId === ma.id && e.datum.startsWith(monthPrefix))
      .map((e) => e.datum)
  );

  // Verfuegbare Tage (noch nicht eingetragen)
  const availableDays = workdays.filter((d) => !existingDates.has(d));
  if (availableDays.length === 0) return [];

  // Soll-Stunden berechnen
  let targetHours = ma.monatlicheStunden;
  
  // Bereits geleistete Stunden dieses Monats abziehen
  const alreadyWorked = existingEntries
    .filter((e) => e.mitarbeiterId === ma.id && e.datum.startsWith(monthPrefix))
    .reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
  
  targetHours = Math.max(0, targetHours - alreadyWorked);

  if (targetHours <= 0) return [];

  // Stunden gleichmaessig auf verfuegbare Tage verteilen
  const hoursPerDay = Math.min(10, targetHours / availableDays.length);
  let remainingHours = targetHours;
  const entries: StundenEintrag[] = [];

  for (const day of availableDays) {
    if (remainingHours <= 0) break;

    const dailyHours = Math.min(hoursPerDay + (Math.random() * 1 - 0.5), 10, remainingHours);
    const roundedHours = Math.round(dailyHours * 2) / 2; // auf 0.5h runden

    if (roundedHours <= 0) continue;

    const pause = getPflichtpause(roundedHours);
    const totalMinutes = roundedHours * 60 + pause;

    // Startzeit zwischen 9:00 und 11:00 variieren
    const startHour = 9 + Math.floor(Math.random() * 2);
    const startMin = Math.random() > 0.5 ? 30 : 0;
    const endTotalMin = startHour * 60 + startMin + totalMinutes;
    const endHour = Math.min(23, Math.floor(endTotalMin / 60));
    const endMin = Math.round(endTotalMin % 60);

    entries.push({
      id: Date.now() + entries.length + Math.floor(Math.random() * 10000),
      mitarbeiterId: ma.id,
      datum: day,
      startzeit: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
      endzeit: `${String(endHour).padStart(2, "0")}:${String(Math.min(59, endMin)).padStart(2, "0")}`,
      pause,
      notiz: "",
    });

    remainingHours -= roundedHours;
  }

  return entries;
}

/**
 * Validiert einen einzelnen Eintrag gegen gesetzliche Regeln.
 * Gibt Warnungen zurueck.
 */
export function validateEntry(
  startzeit: string,
  endzeit: string,
  pause: number
): string[] {
  const warnings: string[] = [];
  const hours = calcHours(startzeit, endzeit, pause);
  const bruttoHours = calcHours(startzeit, endzeit, 0);

  if (bruttoHours > 10) {
    warnings.push("Arbeitszeit darf max. 10 Stunden betragen (ArbZG)");
  }

  const pflichtpause = getPflichtpause(hours + pause / 60);
  if (pause < pflichtpause) {
    warnings.push(`Pflichtpause: mind. ${pflichtpause} Min. bei ${hours.toFixed(1)}h+ Arbeitszeit`);
  }

  return warnings;
}

export function getMonthSollStunden(ma: MitarbeiterData): number {
  return ma.monatlicheStunden;
}
