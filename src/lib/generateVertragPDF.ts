import jsPDF from "jspdf";
import { MitarbeiterData } from "@/store/useStore";

function formatDate(dateStr: string): string {
  if (!dateStr) return "___________";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function generateVertragPDF(ma: MitarbeiterData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = w - margin * 2;
  let y = 20;

  const arbeitgeber = {
    name: "Royal Kebab",
    adresse: "Augsburger Str. 3, 01309 Dresden",
    vertreter: "MOHAMMED AMIN Mohammed Fouad M. Amin",
  };

  function heading(text: string) {
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
    if (y + lines.length * 4.5 > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2;
  }

  function gap(h = 3) { y += h; }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Arbeitsvertrag für geringfügig entlohnte", w / 2, y, { align: "center" });
  y += 6;
  doc.text("Beschäftigung (Minijob)", w / 2, y, { align: "center" });
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  para("Zwischen");
  gap(1);
  doc.setFont("helvetica", "bold");
  para(arbeitgeber.name);
  doc.setFont("helvetica", "normal");
  para(arbeitgeber.adresse);
  para(`Vertreten durch: ${arbeitgeber.vertreter}`);
  para("– nachfolgend „Arbeitgeber" –");
  gap(3);
  para("und");
  gap(1);
  doc.setFont("helvetica", "bold");
  para(`${ma.vorname} ${ma.nachname}`);
  doc.setFont("helvetica", "normal");
  para(`Anschrift: ${ma.anschrift}, ${ma.plz} ${ma.ort}`);
  para(`Geburtsdatum: ${formatDate(ma.geburtsdatum)}`);
  para("– nachfolgend „Arbeitnehmer" –");
  gap(3);
  para("Es wird folgender Arbeitsvertrag geschlossen:");

  // § 1
  heading("§ 1 Beginn, Dauer");
  para(`Das Arbeitsverhältnis beginnt am ${formatDate(ma.eintrittsdatum)}.`);
  if (ma.vertragsart === "unbefristet") {
    para("Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.");
  } else {
    para(`Das Arbeitsverhältnis ist befristet bis zum ${formatDate(ma.befristetBis || "")}.`);
  }

  // § 2
  heading("§ 2 Probezeit");
  para(`Die ersten ${ma.probezeitMonate} Monate gelten als Probezeit. Während der Probezeit kann das Arbeitsverhältnis von beiden Seiten mit einer Frist von zwei Wochen gekündigt werden.`);

  // § 3
  heading("§ 3 Tätigkeit");
  para(`Der Arbeitnehmer wird als ${ma.position} eingestellt.`);
  para("Der Arbeitgeber kann dem Arbeitnehmer andere zumutbare, gleichwertige Tätigkeiten übertragen, soweit dies betrieblich erforderlich ist und keine Minderung der Vergütung zur Folge hat.");

  // § 4
  heading("§ 4 Arbeitsort / Einsatzorte");
  para(`Regelmäßiger Arbeitsort ist: ${ma.arbeitsort}.`);
  para("Der Arbeitnehmer erklärt sich bereit, im Rahmen des Zumutbaren auch an anderen Einsatzorten tätig zu werden (z. B. Filialen/Objekte/Kundenstandorte), soweit dies betrieblich erforderlich ist.");

  // § 5
  heading("§ 5 Arbeitszeit");
  para(`Die regelmäßige monatliche Arbeitszeit beträgt derzeit ${ma.monatlicheStunden.toFixed(2)} Stunden.`);
  para("Die Lage der Arbeitszeit richtet sich nach der betrieblichen Einteilung/Absprache. Änderungen sind aus betrieblichen Gründen möglich, wobei berechtigte Interessen des Arbeitnehmers berücksichtigt werden.");
  para("Pausen richten sich nach den gesetzlichen Bestimmungen und betrieblicher Organisation.");

  // § 6
  heading("§ 6 Vergütung / Minijob-Grenze");
  para(`Der Arbeitnehmer erhält einen Stundenlohn in Höhe von ${ma.stundenlohn.toFixed(2)} EUR brutto.`);
  para("Die Vergütung wird spätestens zum Monatsende auf ein vom Arbeitnehmer benanntes Konto überwiesen.");
  para("Die Parteien sind sich einig, dass es sich um eine geringfügig entlohnte Beschäftigung handelt. Die monatliche Vergütung darf die gesetzliche Geringfügigkeitsgrenze nicht überschreiten. Der Arbeitnehmer informiert den Arbeitgeber unverzüglich über weitere Beschäftigungen, die die Einhaltung der Geringfügigkeitsgrenze beeinflussen können.");

  // § 7
  heading("§ 7 Mehrarbeit / Überstunden");
  para("Mehrarbeit wird nur auf ausdrückliche Anordnung oder Genehmigung des Arbeitgebers geleistet. Etwaige Mehrarbeit wird durch Freizeit ausgeglichen oder mit dem vereinbarten Stundenlohn vergütet, soweit gesetzlich zulässig und soweit dadurch die Minijob-Grenze nicht überschritten wird.");

  // § 8
  heading("§ 8 Urlaub");
  para(`Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub nach den gesetzlichen Bestimmungen. Zusätzlich gewährt der Arbeitgeber ${ma.zusatzurlaub} Arbeitstage vertraglichen Zusatzurlaub pro Kalenderjahr.`);
  para("Urlaub ist rechtzeitig zu beantragen. Bei Beendigung des Arbeitsverhältnisses sind offene Urlaubsansprüche – soweit möglich – während der Kündigungsfrist zu nehmen.");

  // § 9
  heading("§ 9 Arbeitsverhinderung / Krankheit");
  para("Im Krankheitsfall ist der Arbeitnehmer verpflichtet, den Arbeitgeber unverzüglich über die Arbeitsunfähigkeit und deren voraussichtliche Dauer zu informieren.");
  para("Dauert die Arbeitsunfähigkeit länger als drei Kalendertage, ist spätestens am darauffolgenden Arbeitstag eine ärztliche Bescheinigung vorzulegen, sofern der Arbeitgeber nicht eine frühere Vorlage verlangt. Im Übrigen gelten die gesetzlichen Vorschriften zur Entgeltfortzahlung.");

  // § 10
  heading("§ 10 Verschwiegenheit");
  para("Der Arbeitnehmer verpflichtet sich, über Betriebs- und Geschäftsgeheimnisse sowie interne Vorgänge während des Arbeitsverhältnisses und nach dessen Beendigung Stillschweigen zu bewahren.");

  // § 11
  heading("§ 11 Nebentätigkeit");
  para("Eine Nebentätigkeit ist zulässig, sofern dadurch arbeitsvertragliche Pflichten nicht beeinträchtigt werden und keine Wettbewerbsinteressen verletzt werden. Der Arbeitnehmer informiert den Arbeitgeber über weitere Beschäftigungen, soweit dies für die sozialversicherungsrechtliche Beurteilung (Minijob-Grenze) erforderlich ist.");

  // § 12
  heading("§ 12 Arbeitsschutz / Hygiene");
  para("Der Arbeitnehmer ist verpflichtet, die geltenden Arbeitsschutz-, Hygiene- und Sicherheitsvorschriften einzuhalten. Arbeitsanweisungen und Unterweisungen sind zu beachten.");
  para("Erforderliche Arbeitsmittel werden – soweit betrieblich vorgesehen – vom Arbeitgeber gestellt.");

  // § 13
  heading("§ 13 Kündigung");
  para("Nach Ablauf der Probezeit gilt die gesetzliche Kündigungsfrist. Die Kündigung bedarf der Schriftform.");
  para("Der Arbeitgeber kann den Arbeitnehmer unter Fortzahlung der Vergütung bis zum Ende des Arbeitsverhältnisses freistellen; dabei werden vorhandene Urlaubsansprüche angerechnet.");

  // § 14
  heading("§ 14 Schlussbestimmungen");
  para("Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform; dies gilt auch für die Aufhebung dieser Schriftformklausel.");
  para("Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.");
  para("Der Arbeitnehmer verpflichtet sich, Änderungen seiner Anschrift und anderer für das Arbeitsverhältnis relevanter persönlicher Daten unverzüglich mitzuteilen.");

  gap(10);
  para(`Ort, Datum: Dresden, ${formatDate(ma.eintrittsdatum)}`);
  gap(15);

  // Signature lines
  doc.line(margin, y, margin + 65, y);
  doc.line(w - margin - 65, y, w - margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Unterschrift Arbeitgeber", margin, y);
  doc.text("Unterschrift Arbeitnehmer", w - margin - 65, y);

  doc.save(`Arbeitsvertrag_${ma.nachname}_${ma.vorname}.pdf`);
}
