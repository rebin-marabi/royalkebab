import jsPDF from "jspdf";
import { MitarbeiterData, ArbeitgeberDaten, VertragsVorlage } from "@/store/useStore";

function formatDate(dateStr: string): string {
  if (!dateStr) return "___________";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function replacePlaceholders(text: string, ma: MitarbeiterData): string {
  const dauerText = ma.vertragsart === "unbefristet"
    ? "Das Arbeitsverhaeltnis wird auf unbestimmte Zeit geschlossen."
    : `Das Arbeitsverhaeltnis ist befristet bis zum ${formatDate(ma.befristetBis || "")}.`;

  const replacements: Record<string, string> = {
    "{eintrittsdatum}": formatDate(ma.eintrittsdatum),
    "{dauer_text}": dauerText,
    "{probezeitMonate}": String(ma.probezeitMonate),
    "{position}": ma.position,
    "{arbeitsort}": ma.arbeitsort,
    "{monatlicheStunden}": ma.monatlicheStunden.toFixed(2),
    "{stundenlohn}": ma.stundenlohn.toFixed(2),
    "{wochenStunden}": String(ma.wochenStunden || 40),
    "{monatsgehalt}": (ma.monatsgehalt || 0).toFixed(2),
    "{zusatzurlaub}": String(ma.zusatzurlaub),
    "{zusatzurlaub_plus_gesetzlich}": String(20 + ma.zusatzurlaub),
    "{vorname}": ma.vorname,
    "{nachname}": ma.nachname,
    "{name}": `${ma.vorname} ${ma.nachname}`,
    "{anschrift}": `${ma.anschrift}, ${ma.plz} ${ma.ort}`,
    "{geburtsdatum}": formatDate(ma.geburtsdatum),
  };

  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

export function generateVertragPDF(
  ma: MitarbeiterData,
  vorlage: VertragsVorlage,
  arbeitgeber: ArbeitgeberDaten
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = w - margin * 2;
  let y = 20;

  function checkPage(needed: number) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  }

  function heading(text: string) {
    checkPage(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    y += 6;
    doc.text(text, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  function para(text: string) {
    const lines = doc.splitTextToSize(text, textWidth);
    checkPage(lines.length * 4.5);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2;
  }

  function gap(h = 3) { y += h; }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(vorlage.ueberschrift, textWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, w / 2, y, { align: "center" });
    y += 6;
  });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Parties
  para("Zwischen");
  gap(1);
  doc.setFont("helvetica", "bold");
  para(arbeitgeber.name);
  doc.setFont("helvetica", "normal");
  para(arbeitgeber.adresse);
  para(`Vertreten durch: ${arbeitgeber.vertreter}`);
  para('-- nachfolgend "Arbeitgeber" --');
  gap(3);
  para("und");
  gap(1);
  doc.setFont("helvetica", "bold");
  para(`${ma.vorname} ${ma.nachname}`);
  doc.setFont("helvetica", "normal");
  para(`Anschrift: ${ma.anschrift}, ${ma.plz} ${ma.ort}`);
  para(`Geburtsdatum: ${formatDate(ma.geburtsdatum)}`);
  para('-- nachfolgend "Arbeitnehmer" --');
  gap(3);
  para("Es wird folgender Arbeitsvertrag geschlossen:");

  // Paragraphs from template
  vorlage.paragraphen.forEach((p, i) => {
    heading(`\u00A7 ${i + 1} ${p.titel}`);
    const processed = replacePlaceholders(p.inhalt, ma);
    // Split by newlines for separate paragraphs
    processed.split("\n").filter(Boolean).forEach((block) => {
      para(block);
    });
  });

  // Signature
  gap(10);
  para(`Ort, Datum: ${arbeitgeber.ort}, ${formatDate(ma.eintrittsdatum)}`);
  gap(15);
  checkPage(10);
  doc.line(margin, y, margin + 65, y);
  doc.line(w - margin - 65, y, w - margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Unterschrift Arbeitgeber", margin, y);
  doc.text("Unterschrift Arbeitnehmer", w - margin - 65, y);

  doc.save(`Arbeitsvertrag_${vorlage.label}_${ma.nachname}_${ma.vorname}.pdf`);
}
