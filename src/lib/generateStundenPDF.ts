import jsPDF from "jspdf";
import { MitarbeiterData, Vertragstyp } from "@/store/useStore";
import { StundenEintrag, calcHours, getMonthSollStunden } from "@/lib/stundenUtils";

const VERTRAGSTYP_LABELS: Record<Vertragstyp, string> = {
  minijob: "Minijob",
  teilzeit: "Teilzeit",
  vollzeit: "Vollzeit",
};

const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function generateStundenPDF(
  ma: MitarbeiterData,
  entries: StundenEintrag[],
  month: number,
  year: number,
) {
  if (entries.length === 0) return false;

  const sorted = [...entries].sort((a, b) => a.datum.localeCompare(b.datum));
  const totalHours = sorted.reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
  const sollHours = getMonthSollStunden(ma);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const m = 15;
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Arbeitszeitnachweis", m, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${ma.vorname} ${ma.nachname}`, m, y);
  doc.text(`${MONTHS[month]} ${year}`, w - m, y, { align: "right" });
  y += 6;
  doc.text(`Vertragstyp: ${VERTRAGSTYP_LABELS[ma.vertragstyp]}`, m, y);
  y += 10;

  // Table header
  const cols = [m, m + 32, m + 52, m + 72, m + 92, m + 112];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Datum", cols[0], y);
  doc.text("Von", cols[1], y);
  doc.text("Bis", cols[2], y);
  doc.text("Pause", cols[3], y);
  doc.text("Stunden", cols[4], y);
  doc.text("Notiz", cols[5], y);
  y += 2;
  doc.line(m, y, w - m, y);
  y += 5;

  // Rows
  doc.setFont("helvetica", "normal");
  for (const e of sorted) {
    checkPage(8);
    const hours = calcHours(e.startzeit, e.endzeit, e.pause);
    const dayName = DAY_NAMES[new Date(e.datum).getDay()];
    doc.text(`${e.datum.split("-")[2]}.${e.datum.split("-")[1]}. ${dayName}`, cols[0], y);
    doc.text(e.startzeit, cols[1], y);
    doc.text(e.endzeit, cols[2], y);
    doc.text(`${e.pause} Min`, cols[3], y);
    doc.text(`${hours.toFixed(1)}h`, cols[4], y);
    if (e.notiz) {
      const notizLines = doc.splitTextToSize(e.notiz, w - m - cols[5]);
      doc.text(notizLines, cols[5], y);
    }
    y += 6;
  }

  // Summary
  y += 4;
  doc.line(m, y, w - m, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Gesamt: ${totalHours.toFixed(1)} Stunden`, m, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Soll: ${sollHours} Stunden`, m, y);
  y += 6;
  const diff = totalHours - sollHours;
  doc.text(`Differenz: ${diff >= 0 ? "+" : ""}${diff.toFixed(1)} Stunden`, m, y);

  // Signatures
  y += 20;
  checkPage(25);
  doc.line(m, y, m + 65, y);
  doc.line(w - m - 65, y, w - m, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Unterschrift Arbeitnehmer", m, y);
  doc.text("Unterschrift Arbeitgeber", w - m - 65, y);

  doc.save(`Stunden_${ma.nachname}_${ma.vorname}_${MONTHS[month]}_${year}.pdf`);
  return true;
}
