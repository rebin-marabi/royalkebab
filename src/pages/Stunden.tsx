import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface StundenEintrag {
  id: number;
  mitarbeiterId: number;
  datum: string;
  startzeit: string;
  endzeit: string;
  pause: number; // in Minuten
  notiz: string;
}

const initialStunden: StundenEintrag[] = [
  { id: 1, mitarbeiterId: 1, datum: "2026-03-08", startzeit: "10:00", endzeit: "18:00", pause: 30, notiz: "" },
  { id: 2, mitarbeiterId: 2, datum: "2026-03-08", startzeit: "11:00", endzeit: "19:00", pause: 30, notiz: "" },
  { id: 3, mitarbeiterId: 1, datum: "2026-03-07", startzeit: "10:00", endzeit: "18:30", pause: 30, notiz: "Überstunde" },
  { id: 4, mitarbeiterId: 3, datum: "2026-03-07", startzeit: "12:00", endzeit: "20:00", pause: 45, notiz: "" },
  { id: 5, mitarbeiterId: 2, datum: "2026-03-06", startzeit: "10:00", endzeit: "16:00", pause: 30, notiz: "" },
];

function calcHours(start: string, end: string, pause: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm) - pause;
  return Math.max(0, totalMin / 60);
}

export default function Stunden() {
  const { mitarbeiter } = useStore();
  const [stunden, setStunden] = useState<StundenEintrag[]>(initialStunden);
  const [selectedMA, setSelectedMA] = useState<string>("alle");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mitarbeiterId: "", datum: new Date().toISOString().split("T")[0],
    startzeit: "10:00", endzeit: "18:00", pause: "30", notiz: "",
  });

  const filtered = selectedMA === "alle"
    ? stunden
    : stunden.filter((s) => s.mitarbeiterId === Number(selectedMA));

  const sortedStunden = [...filtered].sort((a, b) => b.datum.localeCompare(a.datum));

  const handleAdd = () => {
    if (!form.mitarbeiterId) return;
    setStunden([
      ...stunden,
      {
        id: Date.now(),
        mitarbeiterId: Number(form.mitarbeiterId),
        datum: form.datum,
        startzeit: form.startzeit,
        endzeit: form.endzeit,
        pause: Number(form.pause),
        notiz: form.notiz,
      },
    ]);
    setShowForm(false);
    setForm({ ...form, notiz: "" });
  };

  const getName = (maId: number) => {
    const m = mitarbeiter.find((x) => x.id === maId);
    return m ? `${m.vorname} ${m.nachname}` : "Unbekannt";
  };

  // Summary per MA
  const summary = mitarbeiter.map((m) => {
    const entries = stunden.filter((s) => s.mitarbeiterId === m.id);
    const totalHours = entries.reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    return { ...m, totalHours, entries: entries.length };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Mitarbeiter-Stunden</h1>
          <p className="text-muted-foreground mt-1">Arbeitszeiten erfassen und einsehen</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Stunden eintragen
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {summary.filter(m => m.status === "aktiv").map((m) => (
          <div key={m.id} className="stat-card">
            <p className="font-medium text-foreground">{m.vorname} {m.nachname}</p>
            <p className="text-2xl font-bold font-display text-primary mt-1">{m.totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">{m.entries} Einträge · Soll: {m.monatlicheStunden}h/Monat</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-4">Neue Stunden eintragen</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Mitarbeiter</Label>
              <Select value={form.mitarbeiterId} onValueChange={(v) => setForm({ ...form, mitarbeiterId: v })}>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {mitarbeiter.filter(m => m.status === "aktiv").map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Datum</Label><Input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} /></div>
            <div><Label>Startzeit</Label><Input type="time" value={form.startzeit} onChange={(e) => setForm({ ...form, startzeit: e.target.value })} /></div>
            <div><Label>Endzeit</Label><Input type="time" value={form.endzeit} onChange={(e) => setForm({ ...form, endzeit: e.target.value })} /></div>
            <div><Label>Pause (Min.)</Label><Input type="number" value={form.pause} onChange={(e) => setForm({ ...form, pause: e.target.value })} /></div>
            <div><Label>Notiz</Label><Input value={form.notiz} onChange={(e) => setForm({ ...form, notiz: e.target.value })} placeholder="Optional" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button onClick={handleAdd}>Eintragen</Button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <Select value={selectedMA} onValueChange={setSelectedMA}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Mitarbeiter</SelectItem>
            {mitarbeiter.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Datum</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Mitarbeiter</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Von</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Bis</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Pause</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Stunden</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Notiz</th>
            </tr>
          </thead>
          <tbody>
            {sortedStunden.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{s.datum}</td>
                <td className="p-4 text-muted-foreground">{getName(s.mitarbeiterId)}</td>
                <td className="p-4 text-muted-foreground">{s.startzeit}</td>
                <td className="p-4 text-muted-foreground">{s.endzeit}</td>
                <td className="p-4 text-muted-foreground">{s.pause} Min.</td>
                <td className="p-4 font-medium text-foreground">{calcHours(s.startzeit, s.endzeit, s.pause).toFixed(1)}h</td>
                <td className="p-4 text-muted-foreground">{s.notiz || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
