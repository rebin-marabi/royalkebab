import { useState, useMemo } from "react";
import { useStore, SchuldenData, SchuldenKategorie } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CreditCard, CheckCircle2, XCircle, Home, ShieldCheck, Banknote, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, isBefore, startOfMonth } from "date-fns";
import { de } from "date-fns/locale";

const KATEGORIE_CONFIG: Record<SchuldenKategorie, { label: string; icon: typeof Home; color: string }> = {
  miete: { label: "Miete", icon: Home, color: "text-blue-500" },
  rate: { label: "Rate", icon: CreditCard, color: "text-orange-500" },
  kredit: { label: "Kredit", icon: Banknote, color: "text-red-500" },
  versicherung: { label: "Versicherung", icon: ShieldCheck, color: "text-green-500" },
  sonstiges: { label: "Sonstiges", icon: HelpCircle, color: "text-muted-foreground" },
};

function getMonateListe(startDatum: string): string[] {
  const monate: string[] = [];
  const start = startOfMonth(new Date(startDatum));
  const jetzt = startOfMonth(new Date());
  // Show up to 2 months in the future
  const ende = addMonths(jetzt, 2);
  let current = start;
  while (isBefore(current, ende) || format(current, "yyyy-MM") === format(ende, "yyyy-MM")) {
    monate.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
  }
  return monate;
}

export default function Schulden() {
  const { schulden, addSchulden, deleteSchulden, toggleMonatStatus } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    bezeichnung: "",
    beschreibung: "",
    kategorie: "rate" as SchuldenKategorie,
    gesamtbetrag: "",
    ratenBetrag: "",
    startDatum: format(new Date(), "yyyy-MM-dd"),
    faelligkeitTag: "1",
    intervall: "monatlich" as SchuldenData["intervall"],
  });

  const handleAdd = () => {
    if (!form.bezeichnung || !form.ratenBetrag) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }
    addSchulden({
      bezeichnung: form.bezeichnung,
      beschreibung: form.beschreibung,
      kategorie: form.kategorie,
      gesamtbetrag: form.gesamtbetrag ? parseFloat(form.gesamtbetrag) : 0,
      ratenBetrag: parseFloat(form.ratenBetrag),
      startDatum: form.startDatum,
      faelligkeitTag: parseInt(form.faelligkeitTag),
      intervall: form.intervall,
      zahlungen: [],
      monatsStatus: [],
      status: "aktiv",
    });
    setForm({ bezeichnung: "", beschreibung: "", kategorie: "rate", gesamtbetrag: "", ratenBetrag: "", startDatum: format(new Date(), "yyyy-MM-dd"), faelligkeitTag: "1", intervall: "monatlich" });
    setOpen(false);
    toast({ title: "Neue Zahlung hinzugefügt" });
  };

  const getMonatBezahlt = (s: SchuldenData, monat: string) => {
    return s.monatsStatus.find(m => m.monat === monat)?.bezahlt ?? false;
  };

  const getBezahlteAnzahl = (s: SchuldenData) => s.monatsStatus.filter(m => m.bezahlt).length;
  const getBezahltSumme = (s: SchuldenData) => getBezahlteAnzahl(s) * s.ratenBetrag;

  const aktiveSchulden = schulden.filter(s => s.status === "aktiv");
  const totalMonatlich = aktiveSchulden.reduce((sum, s) => sum + s.ratenBetrag, 0);

  const aktuellerMonat = format(new Date(), "yyyy-MM");
  const diesenMonatOffen = aktiveSchulden.filter(s => !getMonatBezahlt(s, aktuellerMonat)).length;
  const diesenMonatBezahlt = aktiveSchulden.filter(s => getMonatBezahlt(s, aktuellerMonat)).length;

  const intervallLabels: Record<string, string> = {
    monatlich: "Monatlich",
    vierteljaehrlich: "Vierteljährlich",
    jaehrlich: "Jährlich",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Schulden & Raten</h1>
          <p className="text-muted-foreground mt-1">Feste Zahlungen verwalten – pro Monat als bezahlt markieren</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Zahlung</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue feste Zahlung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bezeichnung *</Label>
                <Input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} placeholder="z.B. Miete, Ratenzahlung Kühlschrank..." />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={form.kategorie} onValueChange={v => setForm(f => ({ ...f, kategorie: v as SchuldenKategorie }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(KATEGORIE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Input value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} placeholder="Optionale Details" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Betrag pro Rate (€) *</Label>
                  <Input type="number" step="0.01" value={form.ratenBetrag} onChange={e => setForm(f => ({ ...f, ratenBetrag: e.target.value }))} />
                </div>
                <div>
                  <Label>Gesamtbetrag (€)</Label>
                  <Input type="number" step="0.01" value={form.gesamtbetrag} onChange={e => setForm(f => ({ ...f, gesamtbetrag: e.target.value }))} placeholder="Leer = unbegrenzt" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Startdatum</Label>
                  <Input type="date" value={form.startDatum} onChange={e => setForm(f => ({ ...f, startDatum: e.target.value }))} />
                </div>
                <div>
                  <Label>Fällig am (Tag)</Label>
                  <Input type="number" min="1" max="28" value={form.faelligkeitTag} onChange={e => setForm(f => ({ ...f, faelligkeitTag: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Zahlungsintervall</Label>
                <Select value={form.intervall} onValueChange={v => setForm(f => ({ ...f, intervall: v as SchuldenData["intervall"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monatlich">Monatlich</SelectItem>
                    <SelectItem value="vierteljaehrlich">Vierteljährlich</SelectItem>
                    <SelectItem value="jaehrlich">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd}>Hinzufügen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Monatliche Kosten</div>
            <div className="text-2xl font-bold">{totalMonatlich.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Aktive Zahlungen</div>
            <div className="text-2xl font-bold">{aktiveSchulden.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Diesen Monat bezahlt</div>
            <div className="text-2xl font-bold text-primary">{diesenMonatBezahlt}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Diesen Monat offen</div>
            <div className="text-2xl font-bold text-destructive">{diesenMonatOffen}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schulden List */}
      {schulden.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Noch keine festen Zahlungen eingetragen.</p>
            <p className="text-sm mt-1">Füge z.B. Miete, Raten oder Versicherungen hinzu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schulden.map(s => {
            const katCfg = KATEGORIE_CONFIG[s.kategorie];
            const KatIcon = katCfg.icon;
            const monate = getMonateListe(s.startDatum);
            const isExpanded = expandedId === s.id;
            const bezahltCount = getBezahlteAnzahl(s);
            const hatGesamtbetrag = s.gesamtbetrag > 0;
            const progress = hatGesamtbetrag ? Math.min(100, (getBezahltSumme(s) / s.gesamtbetrag) * 100) : 0;

            return (
              <Card key={s.id} className={s.status === "abgeschlossen" ? "opacity-60" : ""}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <KatIcon className={`h-5 w-5 ${katCfg.color}`} />
                      <CardTitle className="text-lg">{s.bezeichnung}</CardTitle>
                      <Badge variant="outline">{katCfg.label}</Badge>
                      <Badge variant="outline">{intervallLabels[s.intervall]}</Badge>
                      {getMonatBezahlt(s, aktuellerMonat) ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Diesen Monat bezahlt
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                          <XCircle className="h-3 w-3 mr-1" />Offen
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{s.ratenBetrag.toFixed(2)} €</span>
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); deleteSchulden(s.id); toast({ title: "Gelöscht" }); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {s.beschreibung && <p className="text-sm text-muted-foreground mt-1">{s.beschreibung}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Fällig am {s.faelligkeitTag}. des Monats</span>
                    <span>Start: {format(new Date(s.startDatum), "dd.MM.yyyy", { locale: de })}</span>
                    <span>{bezahltCount} Monate bezahlt</span>
                    {hatGesamtbetrag && <span>Gesamt: {s.gesamtbetrag.toFixed(2)} €</span>}
                  </div>
                  {hatGesamtbetrag && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Bezahlt: {getBezahltSumme(s).toFixed(2)} € von {s.gesamtbetrag.toFixed(2)} €</span>
                        <span>Rest: {Math.max(0, s.gesamtbetrag - getBezahltSumme(s)).toFixed(2)} €</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <p className="text-sm font-medium mb-3">Monatsübersicht – klicke um zu markieren</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {monate.map(monat => {
                        const bezahlt = getMonatBezahlt(s, monat);
                        const istAktuell = monat === aktuellerMonat;
                        return (
                          <button
                            key={monat}
                            onClick={() => toggleMonatStatus(s.id, monat)}
                            className={`
                              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm
                              ${bezahlt
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                              }
                              ${istAktuell ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}
                            `}
                          >
                            <span className="font-medium">
                              {format(new Date(monat + "-01"), "MMM yyyy", { locale: de })}
                            </span>
                            {bezahlt ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5 opacity-40" />
                            )}
                            <span className="text-xs">{bezahlt ? "Bezahlt" : "Offen"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
