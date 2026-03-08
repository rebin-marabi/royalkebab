import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, MitarbeiterData, Vertragstyp, VERTRAGSTYP_LABELS } from "@/store/useStore";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type FormData = Omit<MitarbeiterData, "id">;

const emptyForm: FormData = {
  vorname: "", nachname: "", geburtsdatum: "",
  anschrift: "", plz: "", ort: "Dresden",
  telefon: "", email: "",
  steuerID: "", sozialversicherungsnr: "", krankenkasse: "", iban: "",
  eintrittsdatum: "", position: "Mitarbeiter im Imbissbetrieb",
  arbeitsort: "Augsburger Str. 3, 01309 Dresden",
  vertragstyp: "minijob", monatlicheStunden: 9, stundenlohn: 13,
  probezeitMonate: 6, zusatzurlaub: 0,
  vertragsart: "unbefristet",
  vertragStatus: "aktiv", status: "aktiv",
};

export default function Mitarbeiter() {
  const { mitarbeiter, addMitarbeiter } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const filtered = mitarbeiter.filter(
    (m) =>
      `${m.vorname} ${m.nachname}`.toLowerCase().includes(search.toLowerCase()) ||
      m.position.toLowerCase().includes(search.toLowerCase())
  );

  const u = (field: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.vorname || !form.nachname) return;
    addMitarbeiter(form);
    setForm(emptyForm);
    setStep(0);
    setDialogOpen(false);
  };

  const steps = [
    {
      title: "Persoenliche Daten",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Vorname *</Label><Input value={form.vorname} onChange={(e) => u("vorname", e.target.value)} placeholder="Vorname" /></div>
            <div><Label>Nachname *</Label><Input value={form.nachname} onChange={(e) => u("nachname", e.target.value)} placeholder="Nachname" /></div>
          </div>
          <div><Label>Geburtsdatum</Label><Input type="date" value={form.geburtsdatum} onChange={(e) => u("geburtsdatum", e.target.value)} /></div>
          <div><Label>Anschrift (Strasse, Hausnr.)</Label><Input value={form.anschrift} onChange={(e) => u("anschrift", e.target.value)} placeholder="z.B. Blasewitzer Str. 36 F" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>PLZ</Label><Input value={form.plz} onChange={(e) => u("plz", e.target.value)} placeholder="01307" /></div>
            <div><Label>Ort</Label><Input value={form.ort} onChange={(e) => u("ort", e.target.value)} placeholder="Dresden" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Telefon</Label><Input value={form.telefon} onChange={(e) => u("telefon", e.target.value)} placeholder="Handynummer" /></div>
            <div><Label>E-Mail</Label><Input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} placeholder="E-Mail" /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Steuer, SV & Bank",
      content: (
        <div className="space-y-4">
          <div><Label>Steuer-ID</Label><Input value={form.steuerID} onChange={(e) => u("steuerID", e.target.value)} placeholder="11-stellige Steuer-ID" /></div>
          <div><Label>Sozialversicherungsnummer</Label><Input value={form.sozialversicherungsnr} onChange={(e) => u("sozialversicherungsnr", e.target.value)} placeholder="SV-Nummer" /></div>
          <div><Label>Krankenkasse</Label><Input value={form.krankenkasse} onChange={(e) => u("krankenkasse", e.target.value)} placeholder="z.B. AOK, TK, Barmer" /></div>
          <div><Label>IBAN</Label><Input value={form.iban} onChange={(e) => u("iban", e.target.value)} placeholder="DE..." /></div>
        </div>
      ),
    },
    {
      title: "Vertragsdaten",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Vertragstyp *</Label>
            <Select value={form.vertragstyp} onValueChange={(v) => u("vertragstyp", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minijob">Minijob</SelectItem>
                <SelectItem value="teilzeit">Teilzeit</SelectItem>
                <SelectItem value="vollzeit">Vollzeit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Eintrittsdatum *</Label><Input type="date" value={form.eintrittsdatum} onChange={(e) => u("eintrittsdatum", e.target.value)} /></div>
          <div><Label>Position / Taetigkeit</Label><Input value={form.position} onChange={(e) => u("position", e.target.value)} placeholder="Mitarbeiter im Imbissbetrieb" /></div>
          <div><Label>Arbeitsort</Label><Input value={form.arbeitsort} onChange={(e) => u("arbeitsort", e.target.value)} /></div>
          <div>
            <Label>Vertragsart</Label>
            <Select value={form.vertragsart} onValueChange={(v) => u("vertragsart", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unbefristet">Unbefristet</SelectItem>
                <SelectItem value="befristet">Befristet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.vertragsart === "befristet" && (
            <div><Label>Befristet bis</Label><Input type="date" value={form.befristetBis || ""} onChange={(e) => setForm({ ...form, befristetBis: e.target.value })} /></div>
          )}

          {form.vertragstyp === "minijob" && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monatliche Stunden</Label><Input type="number" step="0.5" value={form.monatlicheStunden || ""} onChange={(e) => u("monatlicheStunden", Number(e.target.value))} /></div>
              <div><Label>Stundenlohn (EUR)</Label><Input type="number" step="0.5" value={form.stundenlohn || ""} onChange={(e) => u("stundenlohn", Number(e.target.value))} /></div>
            </div>
          )}

          {form.vertragstyp === "teilzeit" && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Wochenstunden</Label><Input type="number" step="0.5" value={form.wochenStunden || ""} onChange={(e) => u("wochenStunden" as keyof FormData, Number(e.target.value))} /></div>
              <div><Label>Stundenlohn (EUR)</Label><Input type="number" step="0.5" value={form.stundenlohn || ""} onChange={(e) => u("stundenlohn", Number(e.target.value))} /></div>
            </div>
          )}

          {form.vertragstyp === "vollzeit" && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Wochenstunden</Label><Input type="number" value={form.wochenStunden || 40} onChange={(e) => u("wochenStunden" as keyof FormData, Number(e.target.value))} /></div>
              <div><Label>Monatsgehalt (EUR brutto)</Label><Input type="number" step="50" value={form.monatsgehalt || ""} onChange={(e) => u("monatsgehalt" as keyof FormData, Number(e.target.value))} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Probezeit (Monate)</Label><Input type="number" value={form.probezeitMonate || ""} onChange={(e) => u("probezeitMonate", Number(e.target.value))} /></div>
            <div><Label>Zusatzurlaub (Tage)</Label><Input type="number" value={form.zusatzurlaub} onChange={(e) => u("zusatzurlaub", Number(e.target.value))} /></div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Mitarbeiter</h1>
          <p className="text-muted-foreground mt-1">{mitarbeiter.length} Mitarbeiter insgesamt</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setStep(0); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Neuer Mitarbeiter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Personalfragebogen</DialogTitle>
              <p className="text-sm text-muted-foreground">Schritt {step + 1} von {steps.length}: {steps[step].title}</p>
            </DialogHeader>
            <div className="flex gap-2 my-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <div className="mt-4">{steps[step].content}</div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Zurueck</Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>Weiter</Button>
              ) : (
                <Button onClick={handleSubmit}>Mitarbeiter anlegen</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Mitarbeiter suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Name</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Position</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Vertragstyp</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Eintritt</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{m.vorname} {m.nachname}</td>
                <td className="p-4 text-muted-foreground">{m.position}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {VERTRAGSTYP_LABELS[m.vertragstyp]}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{m.eintrittsdatum}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    m.vertragStatus === "aktiv" ? "bg-primary/10 text-primary"
                      : m.vertragStatus === "gekuendigt" ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>{m.vertragStatus}</span>
                </td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/mitarbeiter/${m.id}`)}>
                    <Eye className="h-4 w-4 mr-1" /> Details
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
