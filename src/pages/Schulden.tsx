import { useState } from "react";
import { useStore, SchuldenData, SchuldenKategorie } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CreditCard, CheckCircle2, XCircle, Home, ShieldCheck, Banknote, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, isBefore, startOfMonth, isAfter } from "date-fns";
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

  const aktuellerMonat = format(new Date(), "yyyy-MM");
  const aktiveSchulden = schulden.filter(s => s.status === "aktiv");
  const totalMonatlich = aktiveSchulden.reduce((sum, s) => sum + s.ratenBetrag, 0);
  const diesenMonatOffen = aktiveSchulden.filter(s => !getMonatBezahlt(s, aktuellerMonat));
  const diesenMonatBezahlt = aktiveSchulden.filter(s => getMonatBezahlt(s, aktuellerMonat));

  // Fällige Monate die nicht bezahlt (vergangene Monate)
  const getOffeneMonate = (s: SchuldenData) => {
    const monate = getMonateListe(s.startDatum);
    return monate.filter(m => {
      const monatEnde = new Date(m + "-28");
      return !getMonatBezahlt(s, m) && (m <= aktuellerMonat);
    });
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

      {/* Aktueller Monat Übersicht - PROMINENT */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            📅 {format(new Date(), "MMMM yyyy", { locale: de })} – Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aktiveSchulden.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Zahlungen eingetragen.</p>
          ) : (
            <div className="space-y-3">
              {/* Bezahlt / Offen Balken */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{diesenMonatBezahlt.length} von {aktiveSchulden.length} bezahlt</span>
                    <span className="text-muted-foreground">
                      {diesenMonatBezahlt.length === aktiveSchulden.length
                        ? "✅ Alles bezahlt!"
                        : `${diesenMonatOffen.length} noch offen`}
                    </span>
                  </div>
                  <Progress
                    value={aktiveSchulden.length > 0 ? (diesenMonatBezahlt.length / aktiveSchulden.length) * 100 : 0}
                    className="h-4"
                  />
                </div>
              </div>

              {/* Schnelle Liste: Was ist offen? */}
              {diesenMonatOffen.length > 0 && (
                <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm font-semibold text-destructive mb-2">⚠️ Noch offen diesen Monat:</p>
                  <div className="space-y-2">
                    {diesenMonatOffen.map(s => {
                      const katCfg = KATEGORIE_CONFIG[s.kategorie];
                      const KatIcon = katCfg.icon;
                      return (
                        <div key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <KatIcon className={`h-4 w-4 ${katCfg.color}`} />
                            <span className="font-medium text-sm">{s.bezeichnung}</span>
                            <span className="text-xs text-muted-foreground">Fällig am {s.faelligkeitTag}.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{s.ratenBetrag.toFixed(2)} €</span>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => toggleMonatStatus(s.id, aktuellerMonat)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />Als bezahlt markieren
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-destructive/20 flex justify-between text-sm">
                    <span className="text-destructive font-medium">Offen gesamt:</span>
                    <span className="text-destructive font-bold">
                      {diesenMonatOffen.reduce((sum, s) => sum + s.ratenBetrag, 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}

              {/* Bezahlte Liste */}
              {diesenMonatBezahlt.length > 0 && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-semibold text-primary mb-2">✅ Bereits bezahlt:</p>
                  <div className="space-y-2">
                    {diesenMonatBezahlt.map(s => {
                      const katCfg = KATEGORIE_CONFIG[s.kategorie];
                      const KatIcon = katCfg.icon;
                      return (
                        <div key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <KatIcon className={`h-4 w-4 ${katCfg.color}`} />
                            <span className="font-medium text-sm line-through opacity-70">{s.bezeichnung}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-primary">{s.ratenBetrag.toFixed(2)} €</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => toggleMonatStatus(s.id, aktuellerMonat)}
                            >
                              Rückgängig
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Monatliche Gesamtkosten</div>
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
            <div className="text-2xl font-bold">
              {diesenMonatBezahlt.reduce((s, x) => s + x.ratenBetrag, 0).toFixed(2)} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alle Zahlungen */}
      <div>
        <h2 className="text-xl font-bold mb-3">Alle Zahlungen</h2>
        {schulden.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Noch keine festen Zahlungen eingetragen.</p>
              <p className="text-sm mt-1">Füge z.B. Miete, Raten oder Versicherungen hinzu.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schulden.map(s => {
              const katCfg = KATEGORIE_CONFIG[s.kategorie];
              const KatIcon = katCfg.icon;
              const monate = getMonateListe(s.startDatum);
              const isExpanded = expandedId === s.id;
              const bezahltCount = getBezahlteAnzahl(s);
              const hatGesamtbetrag = s.gesamtbetrag > 0;
              const offeneMonate = getOffeneMonate(s);
              const istDiesenMonatBezahlt = getMonatBezahlt(s, aktuellerMonat);

              return (
                <Card key={s.id}>
                  <CardHeader
                    className="pb-2 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`p-2 rounded-lg ${istDiesenMonatBezahlt ? "bg-primary/10" : "bg-destructive/10"}`}>
                          <KatIcon className={`h-5 w-5 ${katCfg.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{s.bezeichnung}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{katCfg.label}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{s.ratenBetrag.toFixed(2)} € / Monat</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">Fällig am {s.faelligkeitTag}.</span>
                          </div>
                        </div>
                        {/* Status Badge - groß und auffällig */}
                        {istDiesenMonatBezahlt ? (
                          <Badge className="bg-primary text-primary-foreground px-3 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Bezahlt
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="px-3 py-1">
                            <XCircle className="h-3.5 w-3.5 mr-1" />Offen
                          </Badge>
                        )}
                        {offeneMonate.length > 1 && (
                          <Badge variant="outline" className="border-destructive/50 text-destructive text-xs">
                            {offeneMonate.length} Monate offen!
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); deleteSchulden(s.id); toast({ title: "Gelöscht" }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {hatGesamtbetrag && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bezahlt: {getBezahltSumme(s).toFixed(2)} € von {s.gesamtbetrag.toFixed(2)} €</span>
                          <span className="font-medium">Rest: {Math.max(0, s.gesamtbetrag - getBezahltSumme(s)).toFixed(2)} €</span>
                        </div>
                        <Progress value={Math.min(100, (getBezahltSumme(s) / s.gesamtbetrag) * 100)} className="h-2" />
                      </div>
                    )}
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-3">
                          Monatsübersicht <span className="text-muted-foreground font-normal">– klicke um zu markieren</span>
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {monate.map(monat => {
                            const bezahlt = getMonatBezahlt(s, monat);
                            const istAktuell = monat === aktuellerMonat;
                            const istVergangen = monat < aktuellerMonat;
                            const istZukunft = monat > aktuellerMonat;

                            return (
                              <button
                                key={monat}
                                onClick={() => toggleMonatStatus(s.id, monat)}
                                className={`
                                  flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-xs
                                  ${bezahlt
                                    ? "border-primary bg-primary/15 text-primary font-semibold"
                                    : istVergangen
                                      ? "border-destructive/50 bg-destructive/10 text-destructive"
                                      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                                  }
                                  ${istAktuell && !bezahlt ? "ring-2 ring-destructive ring-offset-1 ring-offset-background" : ""}
                                  ${istAktuell && bezahlt ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                                `}
                              >
                                <span className="font-medium leading-tight">
                                  {format(new Date(monat + "-01"), "MMM", { locale: de })}
                                </span>
                                <span className="text-[10px] opacity-70">
                                  {format(new Date(monat + "-01"), "yyyy")}
                                </span>
                                {bezahlt ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <XCircle className={`h-4 w-4 ${istVergangen ? "opacity-80" : "opacity-30"}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {s.beschreibung && <p className="text-xs text-muted-foreground mt-3">{s.beschreibung}</p>}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
