import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { generateVertragPDF } from "@/lib/generateVertragPDF";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function MitarbeiterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mitarbeiter, updateMitarbeiter, vorlagen, arbeitgeber } = useStore();
  const ma = mitarbeiter.find((m) => m.id === Number(id));
  const [kuendigungsdatum, setKuendigungsdatum] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!ma) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Mitarbeiter nicht gefunden.</p>
        <Button variant="outline" onClick={() => navigate("/mitarbeiter")} className="mt-4">Zurueck</Button>
      </div>
    );
  }

  const handleKuendigung = () => {
    updateMitarbeiter(ma.id, {
      vertragStatus: "gekuendigt",
      kuendigungsdatum: kuendigungsdatum || new Date().toISOString().split("T")[0],
    });
    setDialogOpen(false);
  };

  const handleReaktivieren = () => {
    updateMitarbeiter(ma.id, { vertragStatus: "aktiv", kuendigungsdatum: undefined });
  };

  const handlePDF = () => {
    const vorlage = vorlagen.find((v) => v.typ === ma.vertragstyp);
    if (vorlage) generateVertragPDF(ma, vorlage, arbeitgeber);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-card rounded-lg border p-6 mb-4">
      <h2 className="text-lg font-bold font-display text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium text-foreground">{value || "–"}</p>
    </div>
  );

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/mitarbeiter")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Zurueck
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{ma.vorname} {ma.nachname}</h1>
          <p className="text-muted-foreground mt-1">{ma.position} · {VERTRAGSTYP_LABELS[ma.vertragstyp]} · seit {ma.eintrittsdatum}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePDF}>
            <FileDown className="h-4 w-4 mr-2" /> Vertrag als PDF
          </Button>
          {ma.vertragStatus === "aktiv" ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Kuendigung</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Kuendigung einleiten</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Vertrag von {ma.vorname} {ma.nachname} kuendigen?
                </p>
                <div>
                  <Label>Kuendigungsdatum</Label>
                  <Input type="date" value={kuendigungsdatum} onChange={(e) => setKuendigungsdatum(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                  <Button variant="destructive" onClick={handleKuendigung}>Kuendigung bestaetigen</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleReaktivieren}>Vertrag reaktivieren</Button>
          )}
        </div>
      </div>

      <Section title="Persoenliche Daten">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Geburtsdatum" value={ma.geburtsdatum} />
          <Field label="Telefon" value={ma.telefon} />
          <Field label="E-Mail" value={ma.email} />
          <Field label="Anschrift" value={`${ma.anschrift}, ${ma.plz} ${ma.ort}`} />
        </div>
      </Section>

      <Section title="Steuer & Sozialversicherung">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Steuer-ID" value={ma.steuerID} />
          <Field label="SV-Nummer" value={ma.sozialversicherungsnr} />
          <Field label="Krankenkasse" value={ma.krankenkasse} />
          <Field label="IBAN" value={ma.iban} />
        </div>
      </Section>

      <Section title="Vertrag">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Vertragstyp" value={VERTRAGSTYP_LABELS[ma.vertragstyp]} />
          <Field label="Eintrittsdatum" value={ma.eintrittsdatum} />
          <Field label="Position" value={ma.position} />
          <Field label="Arbeitsort" value={ma.arbeitsort} />
          {ma.vertragstyp === "minijob" && <Field label="Monatliche Stunden" value={`${ma.monatlicheStunden}h`} />}
          {(ma.vertragstyp === "teilzeit" || ma.vertragstyp === "vollzeit") && <Field label="Wochenstunden" value={`${ma.wochenStunden || 0}h`} />}
          {ma.vertragstyp === "vollzeit" && <Field label="Monatsgehalt" value={`EUR ${(ma.monatsgehalt || 0).toFixed(2)}`} />}
          {ma.vertragstyp !== "vollzeit" && <Field label="Stundenlohn" value={`EUR ${ma.stundenlohn.toFixed(2)}`} />}
          <Field label="Vertragsart" value={ma.vertragsart} />
          <Field label="Probezeit" value={`${ma.probezeitMonate} Monate`} />
          <Field label="Zusatzurlaub" value={`${ma.zusatzurlaub} Tage`} />
          <Field label="Vertragsstatus" value={ma.vertragStatus} />
          {ma.kuendigungsdatum && <Field label="Kuendigungsdatum" value={ma.kuendigungsdatum} />}
        </div>
      </Section>
    </div>
  );
}
