import { useState } from "react";
import { useStore, SchuldenData } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CreditCard, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Schulden() {
  const { schulden, addSchulden, deleteSchulden, addZahlung, updateSchuldenStatus } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [zahlungDialogId, setZahlungDialogId] = useState<number | null>(null);
  const [zahlungBetrag, setZahlungBetrag] = useState("");
  const [zahlungNotiz, setZahlungNotiz] = useState("");

  const [form, setForm] = useState({
    bezeichnung: "",
    beschreibung: "",
    gesamtbetrag: "",
    ratenBetrag: "",
    startDatum: format(new Date(), "yyyy-MM-dd"),
    faelligkeitTag: "1",
    intervall: "monatlich" as SchuldenData["intervall"],
  });

  const handleAdd = () => {
    if (!form.bezeichnung || !form.gesamtbetrag || !form.ratenBetrag) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }
    addSchulden({
      bezeichnung: form.bezeichnung,
      beschreibung: form.beschreibung,
      gesamtbetrag: parseFloat(form.gesamtbetrag),
      ratenBetrag: parseFloat(form.ratenBetrag),
      startDatum: form.startDatum,
      faelligkeitTag: parseInt(form.faelligkeitTag),
      intervall: form.intervall,
      zahlungen: [],
      status: "aktiv",
    });
    setForm({ bezeichnung: "", beschreibung: "", gesamtbetrag: "", ratenBetrag: "", startDatum: format(new Date(), "yyyy-MM-dd"), faelligkeitTag: "1", intervall: "monatlich" });
    setOpen(false);
    toast({ title: "Schuld/Rate hinzugefügt" });
  };

  const handleZahlung = () => {
    if (zahlungDialogId === null || !zahlungBetrag) return;
    addZahlung(zahlungDialogId, {
      id: Date.now(),
      datum: format(new Date(), "yyyy-MM-dd"),
      betrag: parseFloat(zahlungBetrag),
      notiz: zahlungNotiz,
    });
    // Check if fully paid
    const item = schulden.find(s => s.id === zahlungDialogId);
    if (item) {
      const totalPaid = item.zahlungen.reduce((sum, z) => sum + z.betrag, 0) + parseFloat(zahlungBetrag);
      if (totalPaid >= item.gesamtbetrag) {
        updateSchuldenStatus(zahlungDialogId, "abgeschlossen");
        toast({ title: "🎉 Vollständig bezahlt!" });
      } else {
        toast({ title: "Zahlung eingetragen" });
      }
    }
    setZahlungDialogId(null);
    setZahlungBetrag("");
    setZahlungNotiz("");
  };

  const getBezahlt = (s: SchuldenData) => s.zahlungen.reduce((sum, z) => sum + z.betrag, 0);
  const getProgress = (s: SchuldenData) => Math.min(100, (getBezahlt(s) / s.gesamtbetrag) * 100);
  const getRest = (s: SchuldenData) => Math.max(0, s.gesamtbetrag - getBezahlt(s));

  const totalSchulden = schulden.filter(s => s.status === "aktiv").reduce((sum, s) => sum + getRest(s), 0);
  const totalAbgeschlossen = schulden.filter(s => s.status === "abgeschlossen").length;

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
          <p className="text-muted-foreground mt-1">Ratenzahlungen und offene Beträge verwalten</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Rate</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Schuld / Ratenzahlung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bezeichnung *</Label>
                <Input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} placeholder="z.B. Kühlschrank, Möbel..." />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Input value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} placeholder="Optionale Details" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gesamtbetrag (€) *</Label>
                  <Input type="number" step="0.01" value={form.gesamtbetrag} onChange={e => setForm(f => ({ ...f, gesamtbetrag: e.target.value }))} />
                </div>
                <div>
                  <Label>Ratenbetrag (€) *</Label>
                  <Input type="number" step="0.01" value={form.ratenBetrag} onChange={e => setForm(f => ({ ...f, ratenBetrag: e.target.value }))} />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Offene Schulden gesamt</div>
            <div className="text-2xl font-bold text-destructive">{totalSchulden.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Aktive Raten</div>
            <div className="text-2xl font-bold">{schulden.filter(s => s.status === "aktiv").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Abgeschlossen</div>
            <div className="text-2xl font-bold text-primary">{totalAbgeschlossen}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schulden List */}
      {schulden.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Noch keine Schulden oder Raten eingetragen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schulden.map(s => (
            <Card key={s.id} className={s.status === "abgeschlossen" ? "opacity-70" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{s.bezeichnung}</CardTitle>
                    <Badge variant={s.status === "aktiv" ? "default" : "secondary"}>
                      {s.status === "aktiv" ? "Aktiv" : <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Bezahlt</span>}
                    </Badge>
                    <Badge variant="outline">{intervallLabels[s.intervall]}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {s.status === "aktiv" && (
                      <Dialog open={zahlungDialogId === s.id} onOpenChange={v => { if (!v) setZahlungDialogId(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => { setZahlungDialogId(s.id); setZahlungBetrag(s.ratenBetrag.toString()); }}>
                            <CreditCard className="h-4 w-4 mr-1" />Zahlung
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader><DialogTitle>Zahlung eintragen</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>Betrag (€)</Label>
                              <Input type="number" step="0.01" value={zahlungBetrag} onChange={e => setZahlungBetrag(e.target.value)} />
                            </div>
                            <div>
                              <Label>Notiz</Label>
                              <Input value={zahlungNotiz} onChange={e => setZahlungNotiz(e.target.value)} placeholder="Optional" />
                            </div>
                            <Button className="w-full" onClick={handleZahlung}>Zahlung eintragen</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { deleteSchulden(s.id); toast({ title: "Gelöscht" }); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {s.beschreibung && <p className="text-sm text-muted-foreground">{s.beschreibung}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Bezahlt: <strong>{getBezahlt(s).toFixed(2)} €</strong> von {s.gesamtbetrag.toFixed(2)} €</span>
                  <span>Rest: <strong>{getRest(s).toFixed(2)} €</strong></span>
                </div>
                <Progress value={getProgress(s)} className="h-3" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Rate: {s.ratenBetrag.toFixed(2)} €</span>
                  <span>Fällig am {s.faelligkeitTag}. des Monats</span>
                  <span>Start: {format(new Date(s.startDatum), "dd.MM.yyyy", { locale: de })}</span>
                </div>

                {s.zahlungen.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Zahlungshistorie</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Betrag</TableHead>
                          <TableHead>Notiz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {s.zahlungen.slice().reverse().map(z => (
                          <TableRow key={z.id}>
                            <TableCell>{format(new Date(z.datum), "dd.MM.yyyy", { locale: de })}</TableCell>
                            <TableCell>{z.betrag.toFixed(2)} €</TableCell>
                            <TableCell className="text-muted-foreground">{z.notiz || "–"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
