import { useStore, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { FileText, AlertTriangle, CheckCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateVertragPDF } from "@/lib/generateVertragPDF";

export default function Vertraege() {
  const { mitarbeiter, vorlagen, arbeitgeber } = useStore();
  const navigate = useNavigate();

  const aktiv = mitarbeiter.filter((m) => m.vertragStatus === "aktiv");
  const gekuendigt = mitarbeiter.filter((m) => m.vertragStatus === "gekuendigt");

  const handlePDF = (m: typeof mitarbeiter[0]) => {
    const vorlage = vorlagen.find((v) => v.typ === m.vertragstyp);
    if (vorlage) generateVertragPDF(m, vorlage, arbeitgeber);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Vertraege</h1>
        <p className="text-muted-foreground mt-1">Vertraege verwalten und PDF erstellen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-foreground">{mitarbeiter.length}</p>
            <p className="text-sm text-muted-foreground">Gesamt</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-foreground">{aktiv.length}</p>
            <p className="text-sm text-muted-foreground">Aktiv</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-foreground">{gekuendigt.length}</p>
            <p className="text-sm text-muted-foreground">Gekuendigt</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Mitarbeiter</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Typ</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Position</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Eintritt</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {mitarbeiter.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{m.vorname} {m.nachname}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {VERTRAGSTYP_LABELS[m.vertragstyp]}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{m.position}</td>
                <td className="p-4 text-muted-foreground">{m.eintrittsdatum}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    m.vertragStatus === "aktiv" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}>
                    {m.vertragStatus}
                  </span>
                </td>
                <td className="p-4 flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handlePDF(m)} title="Vertrag als PDF">
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/mitarbeiter/${m.id}`)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
