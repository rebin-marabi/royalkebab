import { useState, useMemo } from "react";
import { useStore, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, AlertTriangle, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  StundenEintrag, calcHours, generateMonthEntries, validateEntry, getMonthSollStunden,
} from "@/lib/stundenUtils";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

const initialStunden: StundenEintrag[] = [
  { id: 1, mitarbeiterId: 1, datum: "2026-03-08", startzeit: "10:00", endzeit: "18:00", pause: 30, notiz: "" },
  { id: 2, mitarbeiterId: 2, datum: "2026-03-08", startzeit: "11:00", endzeit: "14:00", pause: 0, notiz: "" },
  { id: 3, mitarbeiterId: 1, datum: "2026-03-07", startzeit: "10:00", endzeit: "18:30", pause: 30, notiz: "" },
  { id: 4, mitarbeiterId: 3, datum: "2026-03-07", startzeit: "12:00", endzeit: "20:00", pause: 45, notiz: "" },
];

const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function Stunden() {
  const { mitarbeiter } = useStore();
  const [stunden, setStunden] = useState<StundenEintrag[]>(initialStunden);
  const [selectedMA, setSelectedMA] = useState<string>("alle");
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);

  // Modals
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [autoFillDialog, setAutoFillDialog] = useState(false);
  const [autoFillMA, setAutoFillMA] = useState("");

  // Daily form
  const [dailyForm, setDailyForm] = useState({
    mitarbeiterId: "", datum: now.toISOString().split("T")[0],
    startzeit: "10:00", endzeit: "18:00", pause: "30", notiz: "",
  });
  const [dailyWarnings, setDailyWarnings] = useState<string[]>([]);

  // Monthly form
  const [monthlyMA, setMonthlyMA] = useState("");
  const [monthlyRows, setMonthlyRows] = useState<Array<{
    datum: string; startzeit: string; endzeit: string; pause: string; active: boolean;
  }>>([]);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const filtered = useMemo(() => {
    let result = stunden.filter((s) => s.datum.startsWith(monthPrefix));
    if (selectedMA !== "alle") {
      result = result.filter((s) => s.mitarbeiterId === Number(selectedMA));
    }
    return result.sort((a, b) => a.datum.localeCompare(b.datum));
  }, [stunden, monthPrefix, selectedMA]);

  const getName = (maId: number) => {
    const m = mitarbeiter.find((x) => x.id === maId);
    return m ? `${m.vorname} ${m.nachname}` : "Unbekannt";
  };

  // Summary per MA for selected month
  const summary = useMemo(() => {
    return mitarbeiter.filter((m) => m.status === "aktiv").map((m) => {
      const entries = stunden.filter((s) => s.mitarbeiterId === m.id && s.datum.startsWith(monthPrefix));
      const totalHours = entries.reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
      const soll = getMonthSollStunden(m);
      return { ...m, totalHours, entries: entries.length, soll, diff: totalHours - soll };
    });
  }, [mitarbeiter, stunden, monthPrefix]);

  // === Daily Entry ===
  const handleDailyValidate = () => {
    const w = validateEntry(dailyForm.startzeit, dailyForm.endzeit, Number(dailyForm.pause));
    setDailyWarnings(w);
  };

  const handleDailyAdd = () => {
    if (!dailyForm.mitarbeiterId) return;
    const w = validateEntry(dailyForm.startzeit, dailyForm.endzeit, Number(dailyForm.pause));
    if (w.length > 0) {
      setDailyWarnings(w);
      return;
    }
    setStunden((prev) => [
      ...prev,
      {
        id: Date.now(),
        mitarbeiterId: Number(dailyForm.mitarbeiterId),
        datum: dailyForm.datum,
        startzeit: dailyForm.startzeit,
        endzeit: dailyForm.endzeit,
        pause: Number(dailyForm.pause),
        notiz: dailyForm.notiz,
      },
    ]);
    setShowDailyForm(false);
    setDailyWarnings([]);
    toast({ title: "Eintrag hinzugefuegt" });
  };

  // === Delete ===
  const handleDelete = (id: number) => {
    setStunden((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Eintrag geloescht" });
  };

  // === Monthly Manual ===
  const initMonthlyForm = () => {
    if (!monthlyMA) return;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const existingDates = new Set(
      stunden.filter((s) => s.mitarbeiterId === Number(monthlyMA) && s.datum.startsWith(monthPrefix)).map((s) => s.datum)
    );
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dow = date.getDay();
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSunday = dow === 0;
      const alreadyExists = existingDates.has(dateStr);
      rows.push({
        datum: dateStr,
        startzeit: isSunday || alreadyExists ? "" : "10:00",
        endzeit: isSunday || alreadyExists ? "" : "14:00",
        pause: isSunday || alreadyExists ? "0" : "0",
        active: !isSunday && !alreadyExists,
      });
    }
    setMonthlyRows(rows);
    setShowMonthlyForm(true);
  };

  const handleMonthlySave = () => {
    const newEntries: StundenEintrag[] = [];
    let totalWarnings = 0;
    for (const row of monthlyRows) {
      if (!row.active || !row.startzeit || !row.endzeit) continue;
      const w = validateEntry(row.startzeit, row.endzeit, Number(row.pause));
      if (w.length > 0) totalWarnings++;
      newEntries.push({
        id: Date.now() + newEntries.length + Math.floor(Math.random() * 99999),
        mitarbeiterId: Number(monthlyMA),
        datum: row.datum,
        startzeit: row.startzeit,
        endzeit: row.endzeit,
        pause: Number(row.pause),
        notiz: "",
      });
    }
    if (totalWarnings > 0) {
      toast({ title: "Achtung", description: `${totalWarnings} Eintraege haben gesetzliche Warnungen. Bitte pruefen.`, variant: "destructive" });
    }
    setStunden((prev) => [...prev, ...newEntries]);
    setShowMonthlyForm(false);
    toast({ title: `${newEntries.length} Eintraege hinzugefuegt` });
  };

  // === Auto Fill ===
  const handleAutoFill = () => {
    if (!autoFillMA) return;
    const ma = mitarbeiter.find((m) => m.id === Number(autoFillMA));
    if (!ma) return;
    const entries = generateMonthEntries(ma, viewYear, viewMonth, stunden);
    if (entries.length === 0) {
      toast({ title: "Keine Eintraege generiert", description: "Soll-Stunden bereits erreicht oder keine verfuegbaren Tage.", variant: "destructive" });
      return;
    }
    setStunden((prev) => [...prev, ...entries]);
    setAutoFillDialog(false);
    const totalH = entries.reduce((s, e) => s + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    toast({ title: `${entries.length} Tage generiert`, description: `${totalH.toFixed(1)}h fuer ${ma.vorname} ${ma.nachname}` });
  };

  const deleteMonth = (maId: number) => {
    setStunden((prev) => prev.filter((s) => !(s.mitarbeiterId === maId && s.datum.startsWith(monthPrefix))));
    toast({ title: "Monat geloescht" });
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Mitarbeiter-Stunden</h1>
          <p className="text-muted-foreground mt-1">Arbeitszeiten erfassen und verwalten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDailyForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Taeglich
          </Button>
          <Button variant="outline" onClick={() => { setShowMonthlyForm(false); setMonthlyMA(""); initMonthlyForm(); }}>
            <Calendar className="h-4 w-4 mr-2" /> Monatlich
          </Button>
          <Dialog open={autoFillDialog} onOpenChange={setAutoFillDialog}>
            <DialogTrigger asChild>
              <Button><Wand2 className="h-4 w-4 mr-2" /> Monat ausfuellen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Monat automatisch ausfuellen</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Generiert Eintraege fuer {MONTHS[viewMonth]} {viewYear} basierend auf Vertragsstunden. 
                Respektiert: Max. 10h/Tag, Pflichtpausen, keine Sonntage, bereits vorhandene Eintraege.
              </p>
              <div>
                <Label>Mitarbeiter</Label>
                <Select value={autoFillMA} onValueChange={setAutoFillMA}>
                  <SelectTrigger><SelectValue placeholder="Waehlen..." /></SelectTrigger>
                  <SelectContent>
                    {mitarbeiter.filter((m) => m.status === "aktiv").map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.vorname} {m.nachname} ({VERTRAGSTYP_LABELS[m.vertragstyp]}, Soll: {m.monatlicheStunden}h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setAutoFillDialog(false)}>Abbrechen</Button>
                <Button onClick={handleAutoFill}>Generieren</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
          else setViewMonth(viewMonth - 1);
        }}>&larr;</Button>
        <span className="font-display font-bold text-lg text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
        <Button variant="outline" size="sm" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
          else setViewMonth(viewMonth + 1);
        }}>&rarr;</Button>
        <div className="ml-auto">
          <Select value={selectedMA} onValueChange={setSelectedMA}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Mitarbeiter</SelectItem>
              {mitarbeiter.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summary.map((m) => (
          <div key={m.id} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{m.vorname} {m.nachname}</p>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {VERTRAGSTYP_LABELS[m.vertragstyp]}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMonth(m.id)} title="Monat loeschen">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-2xl font-bold font-display text-primary">{m.totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground mb-0.5">/ {m.soll}h Soll</p>
            </div>
            <div className="mt-1 w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${m.totalHours > m.soll ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (m.totalHours / Math.max(1, m.soll)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {m.entries} Eintraege · {m.diff >= 0 ? `+${m.diff.toFixed(1)}h` : `${m.diff.toFixed(1)}h`}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Datum</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Tag</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Mitarbeiter</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Von</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Bis</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Pause</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Stunden</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Notiz</th>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Keine Eintraege fuer diesen Monat.</td></tr>
            )}
            {filtered.map((s) => {
              const hours = calcHours(s.startzeit, s.endzeit, s.pause);
              const warnings = validateEntry(s.startzeit, s.endzeit, s.pause);
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{s.datum.split("-")[2]}.{s.datum.split("-")[1]}.</td>
                  <td className="p-3 text-muted-foreground">{getDayName(s.datum)}</td>
                  <td className="p-3 text-muted-foreground">{getName(s.mitarbeiterId)}</td>
                  <td className="p-3 text-muted-foreground">{s.startzeit}</td>
                  <td className="p-3 text-muted-foreground">{s.endzeit}</td>
                  <td className="p-3 text-muted-foreground">{s.pause}m</td>
                  <td className="p-3 font-medium text-foreground">
                    {hours.toFixed(1)}h
                    {warnings.length > 0 && <AlertTriangle className="inline h-3 w-3 text-destructive ml-1" />}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{s.notiz || ""}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Daily Entry Dialog */}
      <Dialog open={showDailyForm} onOpenChange={setShowDailyForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Taeglich eintragen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Mitarbeiter</Label>
              <Select value={dailyForm.mitarbeiterId} onValueChange={(v) => setDailyForm({ ...dailyForm, mitarbeiterId: v })}>
                <SelectTrigger><SelectValue placeholder="Waehlen..." /></SelectTrigger>
                <SelectContent>
                  {mitarbeiter.filter((m) => m.status === "aktiv").map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Datum</Label><Input type="date" value={dailyForm.datum} onChange={(e) => setDailyForm({ ...dailyForm, datum: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Von</Label><Input type="time" value={dailyForm.startzeit} onChange={(e) => { setDailyForm({ ...dailyForm, startzeit: e.target.value }); }} /></div>
              <div><Label>Bis</Label><Input type="time" value={dailyForm.endzeit} onChange={(e) => { setDailyForm({ ...dailyForm, endzeit: e.target.value }); }} /></div>
              <div><Label>Pause (Min)</Label><Input type="number" value={dailyForm.pause} onChange={(e) => { setDailyForm({ ...dailyForm, pause: e.target.value }); }} /></div>
            </div>
            <div><Label>Notiz</Label><Input value={dailyForm.notiz} onChange={(e) => setDailyForm({ ...dailyForm, notiz: e.target.value })} placeholder="Optional" /></div>

            {dailyWarnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {dailyWarnings.map((w, i) => (
                  <p key={i} className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {w}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleDailyValidate}>Pruefen</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDailyForm(false)}>Abbrechen</Button>
                <Button onClick={handleDailyAdd}>Eintragen</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Manual Dialog */}
      <Dialog open={showMonthlyForm && monthlyRows.length > 0} onOpenChange={setShowMonthlyForm}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Monat manuell eintragen - {MONTHS[viewMonth]} {viewYear}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {monthlyRows.map((row, i) => (
              <div key={row.datum} className={`flex items-center gap-2 p-2 rounded ${!row.active ? "opacity-40" : ""} ${getDayName(row.datum) === "So" ? "bg-muted/50" : ""}`}>
                <span className="w-20 text-sm font-medium text-foreground">
                  {row.datum.split("-")[2]}. {getDayName(row.datum)}
                </span>
                <Input
                  type="time" value={row.startzeit} disabled={!row.active} className="w-24"
                  onChange={(e) => {
                    const updated = [...monthlyRows];
                    updated[i] = { ...updated[i], startzeit: e.target.value };
                    setMonthlyRows(updated);
                  }}
                />
                <span className="text-muted-foreground text-xs">bis</span>
                <Input
                  type="time" value={row.endzeit} disabled={!row.active} className="w-24"
                  onChange={(e) => {
                    const updated = [...monthlyRows];
                    updated[i] = { ...updated[i], endzeit: e.target.value };
                    setMonthlyRows(updated);
                  }}
                />
                <Input
                  type="number" value={row.pause} disabled={!row.active} className="w-16" placeholder="Pause"
                  onChange={(e) => {
                    const updated = [...monthlyRows];
                    updated[i] = { ...updated[i], pause: e.target.value };
                    setMonthlyRows(updated);
                  }}
                />
                <span className="text-xs text-muted-foreground w-8">Min</span>
                <input
                  type="checkbox" checked={row.active}
                  onChange={(e) => {
                    const updated = [...monthlyRows];
                    updated[i] = { ...updated[i], active: e.target.checked };
                    setMonthlyRows(updated);
                  }}
                  className="accent-primary"
                />
                {row.active && row.startzeit && row.endzeit && (
                  <span className="text-xs font-medium text-foreground w-12">
                    {calcHours(row.startzeit, row.endzeit, Number(row.pause)).toFixed(1)}h
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Gesamt: {monthlyRows.filter((r) => r.active && r.startzeit && r.endzeit)
                .reduce((s, r) => s + calcHours(r.startzeit, r.endzeit, Number(r.pause)), 0).toFixed(1)}h
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMonthlyForm(false)}>Abbrechen</Button>
              <Button onClick={handleMonthlySave}>Alle speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly MA selector (when clicking "Monatlich" button) */}
      <Dialog open={!showMonthlyForm && monthlyRows.length === 0 && showDailyForm === false && autoFillDialog === false && monthlyMA === ""} onOpenChange={() => {}}>
        {/* This is handled inline */}
      </Dialog>

      {/* Separate dialog for MA selection for monthly form */}
      {!showMonthlyForm && (
        <Dialog open={monthlyMA === "" && showMonthlyForm === false && showDailyForm === false && autoFillDialog === false ? false : false}>
          <DialogContent />
        </Dialog>
      )}
    </div>
  );
}
