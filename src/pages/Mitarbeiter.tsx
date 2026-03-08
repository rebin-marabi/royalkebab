import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyForm = {
  vorname: "", nachname: "", geburtsdatum: "", geburtsort: "", nationalitaet: "Deutsch",
  familienstand: "Ledig", adresse: "", plz: "", ort: "", telefon: "", email: "",
  steuerID: "", sozialversicherungsnr: "", krankenkasse: "", iban: "",
  eintrittsdatum: "", position: "", stundenProWoche: 0, stundenlohn: 12.5,
  vertragStatus: "aktiv" as const, status: "aktiv" as const,
};

export default function Mitarbeiter() {
  const { mitarbeiter, addMitarbeiter } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const filtered = mitarbeiter.filter(
    (m) =>
      `${m.vorname} ${m.nachname}`.toLowerCase().includes(search.toLowerCase()) ||
      m.position.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (field: string, value: string | number) => setForm({ ...form, [field]: value });

  const handleSubmit = () => {
    if (!form.vorname || !form.nachname) return;
    addMitarbeiter(form);
    setForm(emptyForm);
    setStep(0);
    setDialogOpen(false);
  };

  const steps = [
    {
      title: "Persönliche Daten",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Vorname *</Label><Input value={form.vorname} onChange={(e) => updateForm("vorname", e.target.value)} placeholder="Vorname" /></div>
            <div><Label>Nachname *</Label><Input value={form.nachname} onChange={(e) => updateForm("nachname", e.target.value)} placeholder="Nachname" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Geburtsdatum</Label><Input type="date" value={form.geburtsdatum} onChange={(e) => updateForm("geburtsdatum", e.target.value)} /></div>
            <div><Label>Geburtsort</Label><Input value={form.geburtsort} onChange={(e) => updateForm("geburtsort", e.target.value)} placeholder="Geburtsort" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nationalität</Label><Input value={form.nationalitaet} onChange={(e) => updateForm("nationalitaet", e.target.value)} /></div>
            <div>
              <Label>Familienstand</Label>
              <Select value={form.familienstand} onValueChange={(v) => updateForm("familienstand", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ledig">Ledig</SelectItem>
                  <SelectItem value="Verheiratet">Verheiratet</SelectItem>
                  <SelectItem value="Geschieden">Geschieden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => updateForm("adresse", e.target.value)} placeholder="Straße und Hausnummer" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>PLZ</Label><Input value={form.plz} onChange={(e) => updateForm("plz", e.target.value)} placeholder="PLZ" /></div>
            <div><Label>Ort</Label><Input value={form.ort} onChange={(e) => updateForm("ort", e.target.value)} placeholder="Stadt" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Telefon</Label><Input value={form.telefon} onChange={(e) => updateForm("telefon", e.target.value)} placeholder="Handynummer" /></div>
            <div><Label>E-Mail</Label><Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="E-Mail" /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Steuer & Sozialversicherung",
      content: (
        <div className="space-y-4">
          <div><Label>Steuer-ID</Label><Input value={form.steuerID} onChange={(e) => updateForm("steuerID", e.target.value)} placeholder="11-stellige Steuer-ID" /></div>
          <div><Label>Sozialversicherungsnummer</Label><Input value={form.sozialversicherungsnr} onChange={(e) => updateForm("sozialversicherungsnr", e.target.value)} placeholder="SV-Nummer" /></div>
          <div><Label>Krankenkasse</Label><Input value={form.krankenkasse} onChange={(e) => updateForm("krankenkasse", e.target.value)} placeholder="Name der Krankenkasse" /></div>
          <div><Label>IBAN</Label><Input value={form.iban} onChange={(e) => updateForm("iban", e.target.value)} placeholder="DE..." /></div>
        </div>
      ),
    },
    {
      title: "Vertrag & Anstellung",
      content: (
        <div className="space-y-4">
          <div><Label>Eintrittsdatum</Label><Input type="date" value={form.eintrittsdatum} onChange={(e) => updateForm("eintrittsdatum", e.target.value)} /></div>
          <div><Label>Position</Label><Input value={form.position} onChange={(e) => updateForm("position", e.target.value)} placeholder="z.B. Dönermacher, Kassierer" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Stunden/Woche</Label><Input type="number" value={form.stundenProWoche || ""} onChange={(e) => updateForm("stundenProWoche", Number(e.target.value))} /></div>
            <div><Label>Stundenlohn (€)</Label><Input type="number" step="0.5" value={form.stundenlohn || ""} onChange={(e) => updateForm("stundenlohn", Number(e.target.value))} /></div>
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setStep(0); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Neuer Mitarbeiter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Personalfragebogen</DialogTitle>
              <p className="text-sm text-muted-foreground">Schritt {step + 1} von {steps.length}: {steps[step].title}</p>
            </DialogHeader>

            {/* Progress */}
            <div className="flex gap-2 my-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>

            <div className="mt-4">{steps[step].content}</div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                Zurück
              </Button>
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
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Std./Woche</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Eintritt</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Vertrag</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{m.vorname} {m.nachname}</td>
                <td className="p-4 text-muted-foreground">{m.position}</td>
                <td className="p-4 text-muted-foreground">{m.stundenProWoche}h</td>
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
