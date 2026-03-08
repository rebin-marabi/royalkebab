import { useState, useMemo } from "react";
import { useStore, VERTRAGSTYP_LABELS, MitarbeiterData } from "@/store/useStore";
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
import {
  StundenEintrag, calcHours, generateMonthEntries, getMonthSollStunden,
} from "@/lib/stundenUtils";
import jsPDF from "jspdf";

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

  // Dialog states
  const [dailyOpen, setDailyOpen] = useState(false);
  const [monthlySelectOpen, setMonthlySelectOpen] = useState(false);
  const [monthlyEditOpen, setMonthlyEditOpen] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);

  // Daily form
  const [dailyForm, setDailyForm] = useState({
    mitarbeiterId: "", datum: now.toISOString().split("T")[0],
    startzeit: "10:00", endzeit: "18:00", pause: "30", notiz: "",
  });
  const [dailyWarnings, setDailyWarnings] = useState<string[]>([]);

  // Monthly
  const [monthlyMA, setMonthlyMA] = useState("");
  const [autoFillMA, setAutoFillMA] = useState("");
  const [monthlyRows, setMonthlyRows] = useState<Array<{
    datum: string; startzeit: string; endzeit: string; pause: string; active: boolean;
  }>>([]);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const filtered = useMemo(() => {
    let result = stunden.filter((s) => s.datum.startsWith(monthPrefix));
    if (selectedMA !== "alle") result = result.filter((s) => s.mitarbeiterId === Number(selectedMA));
    return result.sort((a, b) => a.datum.localeCompare(b.datum));
  }, [stunden, monthPrefix, selectedMA]);

  const getName = (maId: number) => {
    const m = mitarbeiter.find((x) => x.id === maId);
    return m ? `${m.vorname} ${m.nachname}` : "Unbekannt";
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
  };

  const summary = useMemo(() => {
    return mitarbeiter.filter((m) => m.status === "aktiv").map((m) => {
      const entries = stunden.filter((s) => s.mitarbeiterId === m.id && s.datum.startsWith(monthPrefix));
      const totalHours = entries.reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
      const soll = getMonthSollStunden(m);
      return { ...m, totalHours, entries: entries.length, soll, diff: totalHours - soll };
    });
  }, [mitarbeiter, stunden, monthPrefix]);

  // === Daily ===
  const handleDailyAdd = () => {
    if (!dailyForm.mitarbeiterId) return;
    setStunden((prev) => [...prev, {
      id: Date.now(), mitarbeiterId: Number(dailyForm.mitarbeiterId),
      datum: dailyForm.datum, startzeit: dailyForm.startzeit,
      endzeit: dailyForm.endzeit, pause: Number(dailyForm.pause), notiz: dailyForm.notiz,
    }]);
    setDailyOpen(false);
    setDailyWarnings([]);
    toast({ title: "Eintrag hinzugefuegt" });
  };

  // === Monthly Manual ===
  const openMonthlyEdit = () => {
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
      const exists = existingDates.has(dateStr);
      rows.push({
        datum: dateStr,
        startzeit: isSunday || exists ? "" : "10:00",
        endzeit: isSunday || exists ? "" : "14:00",
        pause: isSunday || exists ? "0" : "0",
        active: !isSunday && !exists,
      });
    }
    setMonthlyRows(rows);
    setMonthlySelectOpen(false);
    setMonthlyEditOpen(true);
  };

  const handleMonthlySave = () => {
    const newEntries: StundenEintrag[] = [];
    for (const row of monthlyRows) {
      if (!row.active || !row.startzeit || !row.endzeit) continue;
      newEntries.push({
        id: Date.now() + newEntries.length + Math.floor(Math.random() * 99999),
        mitarbeiterId: Number(monthlyMA),
        datum: row.datum, startzeit: row.startzeit, endzeit: row.endzeit,
        pause: Number(row.pause), notiz: "",
      });
    }
    setStunden((prev) => [...prev, ...newEntries]);
    setMonthlyEditOpen(false);
    const totalH = newEntries.reduce((s, e) => s + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    toast({ title: `${newEntries.length} Eintraege gespeichert (${totalH.toFixed(1)}h)` });
  };

  // === Auto Fill ===
  const handleAutoFill = () => {
    if (!autoFillMA) return;
    const ma = mitarbeiter.find((m) => m.id === Number(autoFillMA));
    if (!ma) return;
    const entries = generateMonthEntries(ma, viewYear, viewMonth, stunden);
    if (entries.length === 0) {
      toast({ title: "Keine Eintraege", description: "Soll-Stunden bereits erreicht.", variant: "destructive" });
      return;
    }
    setStunden((prev) => [...prev, ...entries]);
    setAutoFillOpen(false);
    const totalH = entries.reduce((s, e) => s + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    toast({ title: `${entries.length} Tage generiert (${totalH.toFixed(1)}h)` });
  };

  const handleDelete = (id: number) => {
    setStunden((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteMonthForMA = (maId: number) => {
    setStunden((prev) => prev.filter((s) => !(s.mitarbeiterId === maId && s.datum.startsWith(monthPrefix))));
    toast({ title: "Monat geloescht" });
  };

  // === PDF Export ===
  const exportPDF = (ma: MitarbeiterData) => {
    const entries = stunden.filter((s) => s.mitarbeiterId === ma.id && s.datum.startsWith(monthPrefix));
    if (entries.length === 0) {
      toast({ title: "Keine Eintraege", description: "Keine Stunden fuer diesen Monat vorhanden.", variant: "destructive" });
      return;
    }
    entries.sort((a, b) => a.datum.localeCompare(b.datum));
    const totalHours = entries.reduce((sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause), 0);
    const sollHours = getMonthSollStunden(ma);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Arbeitszeitnachweis", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${ma.vorname} ${ma.nachname}`, margin, y);
    y += 6;
    doc.text(`${MONTHS[viewMonth]} ${viewYear}`, margin, y);
    y += 6;
    doc.text(`Vertragstyp: ${VERTRAGSTYP_LABELS[ma.vertragstyp]}`, margin, y);
    y += 10;

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Datum", margin, y);
    doc.text("Von", margin + 30, y);
    doc.text("Bis", margin + 50, y);
    doc.text("Pause", margin + 70, y);
    doc.text("Stunden", margin + 95, y);
    doc.text("Notiz", margin + 120, y);
    y += 2;
    doc.line(margin, y, 195, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    for (const e of entries) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const hours = calcHours(e.startzeit, e.endzeit, e.pause);
      const dayName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(e.datum).getDay()];
      doc.text(`${e.datum.split("-")[2]}.${e.datum.split("-")[1]}. ${dayName}`, margin, y);
      doc.text(e.startzeit, margin + 30, y);
      doc.text(e.endzeit, margin + 50, y);
      doc.text(`${e.pause} Min`, margin + 70, y);
      doc.text(`${hours.toFixed(1)}h`, margin + 95, y);
      doc.text(e.notiz || "", margin + 120, y);
      y += 6;
    }

    y += 5;
    doc.line(margin, y, 195, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Gesamt: ${totalHours.toFixed(1)} Stunden`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Soll: ${sollHours} Stunden`, margin, y);
    y += 6;
    const diff = totalHours - sollHours;
    doc.text(`Differenz: ${diff >= 0 ? "+" : ""}${diff.toFixed(1)} Stunden`, margin, y);

    y += 20;
    doc.text("Unterschrift Arbeitnehmer: _________________________", margin, y);
    y += 10;
    doc.text("Unterschrift Arbeitgeber: _________________________", margin, y);

    doc.save(`Stunden_${ma.nachname}_${ma.vorname}_${MONTHS[viewMonth]}_${viewYear}.pdf`);
    toast({ title: "PDF heruntergeladen" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Mitarbeiter-Stunden</h1>
          <p className="text-muted-foreground mt-1">Arbeitszeiten erfassen und verwalten</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setDailyOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Taeglich
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonthlySelectOpen(true)}>
            <Calendar className="h-4 w-4 mr-1" /> Monatlich
          </Button>
          <Button size="sm" onClick={() => setAutoFillOpen(true)}>
            <Wand2 className="h-4 w-4 mr-1" /> Auto-Ausfuellen
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
        }}>&larr;</Button>
        <span className="font-display font-bold text-lg text-foreground min-w-[160px] text-center">{MONTHS[viewMonth]} {viewYear}</span>
        <Button variant="outline" size="sm" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
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
              {m.entries > 0 && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMonthForMA(m.id)} title="Alle Eintraege dieses Monats loeschen">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-2xl font-bold font-display text-primary">{m.totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground mb-0.5">/ {m.soll}h</p>
            </div>
            <div className="mt-1 w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${m.totalHours > m.soll ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (m.totalHours / Math.max(1, m.soll)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {m.entries} Eintraege &middot; {m.diff >= 0 ? `+${m.diff.toFixed(1)}` : m.diff.toFixed(1)}h
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
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Keine Eintraege fuer diesen Monat.</td></tr>
            )}
            {filtered.map((s) => {
              const hours = calcHours(s.startzeit, s.endzeit, s.pause);
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{s.datum.split("-")[2]}.{s.datum.split("-")[1]}.</td>
                  <td className="p-3 text-muted-foreground">{getDayName(s.datum)}</td>
                  <td className="p-3 text-muted-foreground">{getName(s.mitarbeiterId)}</td>
                  <td className="p-3 text-muted-foreground">{s.startzeit}</td>
                  <td className="p-3 text-muted-foreground">{s.endzeit}</td>
                  <td className="p-3 text-muted-foreground">{s.pause}m</td>
                  <td className="p-3 font-medium text-foreground">{hours.toFixed(1)}h</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* === DIALOGS === */}

      {/* Daily Entry */}
      <Dialog open={dailyOpen} onOpenChange={setDailyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Taeglich eintragen</DialogTitle></DialogHeader>
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
              <div><Label>Von</Label><Input type="time" value={dailyForm.startzeit} onChange={(e) => setDailyForm({ ...dailyForm, startzeit: e.target.value })} /></div>
              <div><Label>Bis</Label><Input type="time" value={dailyForm.endzeit} onChange={(e) => setDailyForm({ ...dailyForm, endzeit: e.target.value })} /></div>
              <div><Label>Pause</Label><Input type="number" value={dailyForm.pause} onChange={(e) => setDailyForm({ ...dailyForm, pause: e.target.value })} /></div>
            </div>
            <div><Label>Notiz</Label><Input value={dailyForm.notiz} onChange={(e) => setDailyForm({ ...dailyForm, notiz: e.target.value })} /></div>
            {dailyWarnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                {dailyWarnings.map((w, i) => (
                  <p key={i} className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {w}</p>
                ))}
              </div>
            )}
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
          <p className="text-sm text-muted-foreground">Waehle einen Mitarbeiter fuer {MONTHS[viewMonth]} {viewYear}:</p>
          <div className="mt-2">
            <Select value={monthlyMA} onValueChange={setMonthlyMA}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter waehlen..." /></SelectTrigger>
              <SelectContent>
                {mitarbeiter.filter((m) => m.status === "aktiv").map((m) => (
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
            <DialogTitle className="font-display">{MONTHS[viewMonth]} {viewYear} - {monthlyMA && getName(Number(monthlyMA))}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Haken setzen/entfernen um Tage zu aktivieren. Sonntage und bereits vorhandene Tage sind deaktiviert.</p>
          <div className="space-y-1 mt-2">
            {monthlyRows.map((row, i) => {
              const dayName = getDayName(row.datum);
              const isSunday = dayName === "So";
              return (
                <div key={row.datum} className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${isSunday ? "bg-muted/50 opacity-50" : ""}`}>
                  <input
                    type="checkbox" checked={row.active} className="accent-primary"
                    onChange={(e) => {
                      const u = [...monthlyRows]; u[i] = { ...u[i], active: e.target.checked }; setMonthlyRows(u);
                    }}
                  />
                  <span className="w-14 font-medium text-foreground">{row.datum.split("-")[2]}. {dayName}</span>
                  <Input type="time" value={row.startzeit} disabled={!row.active} className="w-24 h-8 text-xs"
                    onChange={(e) => { const u = [...monthlyRows]; u[i] = { ...u[i], startzeit: e.target.value }; setMonthlyRows(u); }}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input type="time" value={row.endzeit} disabled={!row.active} className="w-24 h-8 text-xs"
                    onChange={(e) => { const u = [...monthlyRows]; u[i] = { ...u[i], endzeit: e.target.value }; setMonthlyRows(u); }}
                  />
                  <Input type="number" value={row.pause} disabled={!row.active} className="w-14 h-8 text-xs" placeholder="P"
                    onChange={(e) => { const u = [...monthlyRows]; u[i] = { ...u[i], pause: e.target.value }; setMonthlyRows(u); }}
                  />
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
              Gesamt: {monthlyRows.filter((r) => r.active && r.startzeit && r.endzeit)
                .reduce((s, r) => s + calcHours(r.startzeit, r.endzeit, Number(r.pause)), 0).toFixed(1)}h
              {monthlyMA && (() => {
                const ma = mitarbeiter.find((m) => m.id === Number(monthlyMA));
                return ma ? ` / ${ma.monatlicheStunden}h Soll` : "";
              })()}
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
            Beachtet: Max. 10h/Tag, Pflichtpausen, keine Sonntage, bereits vorhandene Eintraege.
          </p>
          <div>
            <Label>Mitarbeiter</Label>
            <Select value={autoFillMA} onValueChange={setAutoFillMA}>
              <SelectTrigger><SelectValue placeholder="Waehlen..." /></SelectTrigger>
              <SelectContent>
                {mitarbeiter.filter((m) => m.status === "aktiv").map((m) => (
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
