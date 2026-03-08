import { useState, useMemo, useCallback } from "react";
import { useStore, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Wand2, Calendar, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StundenEintrag, calcHours, generateMonthEntries, getMonthSollStunden } from "@/lib/stundenUtils";
import { generateStundenPDF } from "@/lib/generateStundenPDF";

const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const now = new Date();

export default function Stunden() {
  const { mitarbeiter, stunden, addStunden, deleteStunde, deleteStundenForMonth } = useStore();
  const aktiveMitarbeiter = useMemo(() => mitarbeiter.filter((m) => m.status === "aktiv"), [mitarbeiter]);

  const [selectedMA, setSelectedMA] = useState("alle");
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Dialog states
  const [dailyOpen, setDailyOpen] = useState(false);
  const [monthlySelectOpen, setMonthlySelectOpen] = useState(false);
  const [monthlyEditOpen, setMonthlyEditOpen] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);

  // Forms
  const [dailyForm, setDailyForm] = useState({
    mitarbeiterId: "", datum: now.toISOString().split("T")[0],
    startzeit: "10:00", endzeit: "18:00", pause: "30", notiz: "",
  });
  const [monthlyMA, setMonthlyMA] = useState("");
  const [autoFillMA, setAutoFillMA] = useState("");
  const [monthlyRows, setMonthlyRows] = useState<Array<{
    datum: string; startzeit: string; endzeit: string; pause: string; active: boolean;
  }>>([]);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  // Memoized name lookup map
  const nameMap = useMemo(() => {
    const map = new Map<number, string>();
    mitarbeiter.forEach((m) => map.set(m.id, `${m.vorname} ${m.nachname}`));
    return map;
  }, [mitarbeiter]);

  // Filtered entries for current month + selected MA
  const filtered = useMemo(() => {
    let result = stunden.filter((s) => s.datum.startsWith(monthPrefix));
    if (selectedMA !== "alle") result = result.filter((s) => s.mitarbeiterId === Number(selectedMA));
    return result.sort((a, b) => a.datum.localeCompare(b.datum));
  }, [stunden, monthPrefix, selectedMA]);

  // Summary per active MA
  const summary = useMemo(() => {
    // Pre-compute hours for current month in one pass
    const hoursMap = new Map<number, { total: number; count: number }>();
    for (const s of stunden) {
      if (!s.datum.startsWith(monthPrefix)) continue;
      const cur = hoursMap.get(s.mitarbeiterId) || { total: 0, count: 0 };
      cur.total += calcHours(s.startzeit, s.endzeit, s.pause);
      cur.count++;
      hoursMap.set(s.mitarbeiterId, cur);
    }
    return aktiveMitarbeiter.map((m) => {
      const data = hoursMap.get(m.id) || { total: 0, count: 0 };
      const soll = getMonthSollStunden(m);
      return { ...m, totalHours: data.total, entries: data.count, soll, diff: data.total - soll };
    });
  }, [aktiveMitarbeiter, stunden, monthPrefix]);

  // Month total for filtered view
  const filteredTotal = useMemo(
    () => filtered.reduce((sum, s) => sum + calcHours(s.startzeit, s.endzeit, s.pause), 0),
    [filtered]
  );

  // === Handlers ===
  const prevMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11; } return m - 1; });
  }, []);
  const nextMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0; } return m + 1; });
  }, []);

  const handleDailyAdd = useCallback(() => {
    if (!dailyForm.mitarbeiterId) return;
    addStunden([{
      id: Date.now(),
      mitarbeiterId: Number(dailyForm.mitarbeiterId),
      datum: dailyForm.datum,
      startzeit: dailyForm.startzeit,
      endzeit: dailyForm.endzeit,
      pause: Number(dailyForm.pause),
      notiz: dailyForm.notiz,
    }]);
    setDailyOpen(false);
    toast({ title: "Eintrag hinzugefuegt" });
  }, [dailyForm, addStunden]);

  const openMonthlyEdit = useCallback(() => {
    if (!monthlyMA) return;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const existingDates = new Set(
      stunden.filter((s) => s.mitarbeiterId === Number(monthlyMA) && s.datum.startsWith(monthPrefix)).map((s) => s.datum)
    );
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const blocked = dow === 0 || existingDates.has(dateStr);
      rows.push({
        datum: dateStr,
        startzeit: blocked ? "" : "10:00",
        endzeit: blocked ? "" : "14:00",
        pause: blocked ? "0" : "0",
        active: !blocked,
      });
    }
    setMonthlyRows(rows);
    setMonthlySelectOpen(false);
    setMonthlyEditOpen(true);
  }, [monthlyMA, viewYear, viewMonth, stunden, monthPrefix]);

  const handleMonthlySave = useCallback(() => {
    const newEntries: StundenEintrag[] = monthlyRows
      .filter((r) => r.active && r.startzeit && r.endzeit)
      .map((r, i) => ({
        id: Date.now() + i + Math.floor(Math.random() * 99999),
        mitarbeiterId: Number(monthlyMA),
        datum: r.datum,
        startzeit: r.startzeit,
        endzeit: r.endzeit,
        pause: Number(r.pause),
        notiz: "",
      }));
    addStunden(newEntries);
    setMonthlyEditOpen(false);
    const totalH = newEntries.reduce((s, e) => s + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    toast({ title: `${newEntries.length} Eintraege (${totalH.toFixed(1)}h) gespeichert` });
  }, [monthlyRows, monthlyMA, addStunden]);

  const handleAutoFill = useCallback(() => {
    if (!autoFillMA) return;
    const ma = mitarbeiter.find((m) => m.id === Number(autoFillMA));
    if (!ma) return;
    const entries = generateMonthEntries(ma, viewYear, viewMonth, stunden);
    if (entries.length === 0) {
      toast({ title: "Keine Eintraege", description: "Soll-Stunden bereits erreicht.", variant: "destructive" });
      return;
    }
    addStunden(entries);
    setAutoFillOpen(false);
    const totalH = entries.reduce((s, e) => s + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    toast({ title: `${entries.length} Tage generiert (${totalH.toFixed(1)}h)` });
  }, [autoFillMA, mitarbeiter, viewYear, viewMonth, stunden, addStunden]);

  const handleExportPDF = useCallback((maId: number) => {
    const ma = mitarbeiter.find((m) => m.id === maId);
    if (!ma) return;
    const entries = stunden.filter((s) => s.mitarbeiterId === maId && s.datum.startsWith(monthPrefix));
    if (generateStundenPDF(ma, entries, viewMonth, viewYear)) {
      toast({ title: "PDF heruntergeladen" });
    } else {
      toast({ title: "Keine Eintraege vorhanden", variant: "destructive" });
    }
  }, [mitarbeiter, stunden, monthPrefix, viewMonth, viewYear]);

  const handleDeleteMonth = useCallback((maId: number) => {
    deleteStundenForMonth(maId, monthPrefix);
    toast({ title: "Monat geloescht" });
  }, [deleteStundenForMonth, monthPrefix]);

  const updateMonthlyRow = useCallback((i: number, field: string, value: string | boolean) => {
    setMonthlyRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }, []);

  // Monthly edit total (computed inline in render for simplicity)
  const monthlyEditTotal = useMemo(
    () => monthlyRows.filter((r) => r.active && r.startzeit && r.endzeit)
      .reduce((s, r) => s + calcHours(r.startzeit, r.endzeit, Number(r.pause)), 0),
    [monthlyRows]
  );

  const monthlyEditSoll = useMemo(() => {
    if (!monthlyMA) return 0;
    const ma = mitarbeiter.find((m) => m.id === Number(monthlyMA));
    return ma ? ma.monatlicheStunden : 0;
  }, [monthlyMA, mitarbeiter]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Arbeitszeiterfassung</h1>
          <p className="text-muted-foreground mt-1">Stunden erfassen, verwalten & exportieren</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setDailyOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Einzeltag
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonthlySelectOpen(true)}>
            <Calendar className="h-4 w-4 mr-1" /> Monat manuell
          </Button>
          <Button size="sm" onClick={() => setAutoFillOpen(true)}>
            <Wand2 className="h-4 w-4 mr-1" /> Auto-Ausfuellen
          </Button>
        </div>
      </div>

      {/* Month Nav + Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={prevMonth}>&larr;</Button>
        <span className="font-display font-bold text-lg text-foreground min-w-[160px] text-center">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <Button variant="outline" size="sm" onClick={nextMonth}>&rarr;</Button>
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
        {summary.map((m) => {
          const pct = Math.min(100, (m.totalHours / Math.max(1, m.soll)) * 100);
          return (
            <div key={m.id} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{m.vorname} {m.nachname}</p>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {VERTRAGSTYP_LABELS[m.vertragstyp]}
                  </span>
                </div>
                <div className="flex gap-1">
                  {m.entries > 0 && (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleExportPDF(m.id)} title="PDF herunterladen">
                        <FileDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => handleDeleteMonth(m.id)} title="Monat loeschen">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-2xl font-bold font-display text-primary">{m.totalHours.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground mb-0.5">/ {m.soll}h</p>
              </div>
              <div className="mt-1 w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${pct > 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {m.entries} Tage &middot; {m.diff >= 0 ? `+${m.diff.toFixed(1)}` : m.diff.toFixed(1)}h
              </p>
            </div>
          );
        })}
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
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Keine Eintraege fuer diesen Monat.</td></tr>
            ) : (
              <>
                {filtered.map((s) => {
                  const hours = calcHours(s.startzeit, s.endzeit, s.pause);
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{s.datum.split("-")[2]}.{s.datum.split("-")[1]}.</td>
                      <td className="p-3 text-muted-foreground">{DAY_NAMES[new Date(s.datum).getDay()]}</td>
                      <td className="p-3 text-muted-foreground">{nameMap.get(s.mitarbeiterId) || "Unbekannt"}</td>
                      <td className="p-3 text-muted-foreground">{s.startzeit}</td>
                      <td className="p-3 text-muted-foreground">{s.endzeit}</td>
                      <td className="p-3 text-muted-foreground">{s.pause}m</td>
                      <td className="p-3 font-medium text-foreground">{hours.toFixed(1)}h</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteStunde(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/30">
                  <td colSpan={6} className="p-3 text-sm font-semibold text-foreground text-right">Summe</td>
                  <td className="p-3 font-bold text-foreground">{filteredTotal.toFixed(1)}h</td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* === DIALOGS === */}

      {/* Daily Entry */}
      <Dialog open={dailyOpen} onOpenChange={setDailyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Einzeltag eintragen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Mitarbeiter</Label>
              <Select value={dailyForm.mitarbeiterId} onValueChange={(v) => setDailyForm((f) => ({ ...f, mitarbeiterId: v }))}>
                <SelectTrigger><SelectValue placeholder="Waehlen..." /></SelectTrigger>
                <SelectContent>
                  {aktiveMitarbeiter.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Datum</Label><Input type="date" value={dailyForm.datum} onChange={(e) => setDailyForm((f) => ({ ...f, datum: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Von</Label><Input type="time" value={dailyForm.startzeit} onChange={(e) => setDailyForm((f) => ({ ...f, startzeit: e.target.value }))} /></div>
              <div><Label>Bis</Label><Input type="time" value={dailyForm.endzeit} onChange={(e) => setDailyForm((f) => ({ ...f, endzeit: e.target.value }))} /></div>
              <div><Label>Pause (Min)</Label><Input type="number" value={dailyForm.pause} onChange={(e) => setDailyForm((f) => ({ ...f, pause: e.target.value }))} /></div>
            </div>
            <div><Label>Notiz</Label><Input value={dailyForm.notiz} onChange={(e) => setDailyForm((f) => ({ ...f, notiz: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDailyOpen(false)}>Abbrechen</Button>
              <Button onClick={handleDailyAdd}>Eintragen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly MA Select */}
      <Dialog open={monthlySelectOpen} onOpenChange={setMonthlySelectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Monat manuell eintragen</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Mitarbeiter fuer {MONTHS[viewMonth]} {viewYear} waehlen:</p>
          <div className="mt-2">
            <Select value={monthlyMA} onValueChange={setMonthlyMA}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter waehlen..." /></SelectTrigger>
              <SelectContent>
                {aktiveMitarbeiter.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.vorname} {m.nachname} ({VERTRAGSTYP_LABELS[m.vertragstyp]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMonthlySelectOpen(false)}>Abbrechen</Button>
            <Button onClick={openMonthlyEdit} disabled={!monthlyMA}>Weiter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Edit */}
      <Dialog open={monthlyEditOpen} onOpenChange={setMonthlyEditOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {MONTHS[viewMonth]} {viewYear} – {monthlyMA ? nameMap.get(Number(monthlyMA)) : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Sonntage und bereits vorhandene Tage sind deaktiviert.</p>
          <div className="space-y-1 mt-2">
            {monthlyRows.map((row, i) => {
              const dayName = DAY_NAMES[new Date(row.datum).getDay()];
              const isSunday = dayName === "So";
              return (
                <div key={row.datum} className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${isSunday ? "bg-muted/50 opacity-50" : ""}`}>
                  <input type="checkbox" checked={row.active} className="accent-primary"
                    onChange={(e) => updateMonthlyRow(i, "active", e.target.checked)} />
                  <span className="w-14 font-medium text-foreground">{row.datum.split("-")[2]}. {dayName}</span>
                  <Input type="time" value={row.startzeit} disabled={!row.active} className="w-24 h-8 text-xs"
                    onChange={(e) => updateMonthlyRow(i, "startzeit", e.target.value)} />
                  <span className="text-muted-foreground">–</span>
                  <Input type="time" value={row.endzeit} disabled={!row.active} className="w-24 h-8 text-xs"
                    onChange={(e) => updateMonthlyRow(i, "endzeit", e.target.value)} />
                  <Input type="number" value={row.pause} disabled={!row.active} className="w-14 h-8 text-xs" placeholder="P"
                    onChange={(e) => updateMonthlyRow(i, "pause", e.target.value)} />
                  <span className="text-xs text-muted-foreground">Min</span>
                  <span className="text-xs font-medium text-foreground w-10 text-right">
                    {row.active && row.startzeit && row.endzeit ? `${calcHours(row.startzeit, row.endzeit, Number(row.pause)).toFixed(1)}h` : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <p className="text-sm font-medium text-foreground">
              Gesamt: {monthlyEditTotal.toFixed(1)}h / {monthlyEditSoll}h Soll
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMonthlyEditOpen(false)}>Abbrechen</Button>
              <Button onClick={handleMonthlySave}>Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Fill */}
      <Dialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Monat automatisch ausfuellen</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Generiert Eintraege fuer <strong>{MONTHS[viewMonth]} {viewYear}</strong> basierend auf Vertragsstunden.
          </p>
          <div>
            <Label>Mitarbeiter</Label>
            <Select value={autoFillMA} onValueChange={setAutoFillMA}>
              <SelectTrigger><SelectValue placeholder="Waehlen..." /></SelectTrigger>
              <SelectContent>
                {aktiveMitarbeiter.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.vorname} {m.nachname} ({VERTRAGSTYP_LABELS[m.vertragstyp]}, {m.monatlicheStunden}h/Monat)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAutoFillOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAutoFill} disabled={!autoFillMA}><Wand2 className="h-4 w-4 mr-1" /> Generieren</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
