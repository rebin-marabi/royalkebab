import { useState, useMemo, useRef } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Upload, Trash2, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function Rechnungen() {
  const { rechnungen, addRechnung, deleteRechnung } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  // Upload form state
  const [beschreibung, setBeschreibung] = useState("");
  const [betrag, setBetrag] = useState("");
  const [rechnungsDatum, setRechnungsDatum] = useState(now.toISOString().slice(0, 10));
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const monatRechnungen = useMemo(() => {
    if (selectedMonth === null) return [];
    const prefix = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return rechnungen.filter((r) => r.monat === prefix).sort((a, b) => b.id - a.id);
  }, [rechnungen, selectedMonth, year]);

  const countPerMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rechnungen) {
      if (r.monat.startsWith(`${year}-`)) {
        counts[r.monat] = (counts[r.monat] || 0) + 1;
      }
    }
    return counts;
  }, [rechnungen, year]);

  const sumPerMonth = useMemo(() => {
    const sums: Record<string, number> = {};
    for (const r of rechnungen) {
      if (r.monat.startsWith(`${year}-`) && r.betrag !== undefined) {
        sums[r.monat] = (sums[r.monat] || 0) + r.betrag;
      }
    }
    return sums;
  }, [rechnungen, year]);

  const handleFilesSelected = () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
  };

  const handleUpload = () => {
    if (pendingFiles.length === 0) return;
    // Derive month from rechnungsDatum
    const [y, m] = rechnungsDatum.split("-");
    const monat = `${y}-${m}`;

    pendingFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addRechnung({
          monat,
          dateiName: file.name,
          dateiTyp: file.type,
          dateiData: reader.result as string,
          beschreibung: beschreibung.trim(),
          betrag: betrag ? parseFloat(betrag) : undefined,
          hochgeladenAm: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset
    setPendingFiles([]);
    if (fileRef.current) fileRef.current.value = "";
    setBeschreibung("");
    setBetrag("");
    setRechnungsDatum(now.toISOString().slice(0, 10));
  };

  const openPreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
  };

  // Month grid view
  if (selectedMonth === null) {
    return (
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground mb-2">Einkommende Rechnungen</h1>
        <p className="text-muted-foreground mb-6">Rechnungen hochladen – werden automatisch dem Monat zugeordnet</p>

        {/* Upload area – always visible on overview */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rechnung hochladen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Rechnungsdatum</label>
                <Input
                  type="date"
                  value={rechnungsDatum}
                  onChange={(e) => setRechnungsDatum(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Beschreibung / Label</label>
                <Input
                  placeholder="z.B. Strom, Miete, Lieferant..."
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Betrag €</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={betrag}
                  onChange={(e) => setBetrag(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Datei wählen
              </Button>
              {pendingFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {pendingFiles.map((f) => f.name).join(", ")}
                </span>
              )}
              <div className="ml-auto">
                <Button onClick={handleUpload} disabled={pendingFiles.length === 0 || !rechnungsDatum}>
                  <Upload className="h-4 w-4 mr-2" /> Hochladen
                </Button>
              </div>
            </div>
            {rechnungsDatum && (
              <p className="text-xs text-muted-foreground">
                → Wird einsortiert in: <span className="font-semibold text-foreground">
                  {MONTHS[parseInt(rechnungsDatum.split("-")[1], 10) - 1]} {rechnungsDatum.split("-")[0]}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Year navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold font-display">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {MONTHS.map((name, i) => {
            const key = `${year}-${String(i + 1).padStart(2, "0")}`;
            const count = countPerMonth[key] || 0;
            const sum = sumPerMonth[key];
            return (
              <Card
                key={i}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/40"
                onClick={() => setSelectedMonth(i)}
              >
                <CardContent className="p-5 text-center">
                  <p className="font-bold font-display text-lg">{name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {count === 0 ? "Keine Rechnungen" : `${count} Rechnung${count > 1 ? "en" : ""}`}
                  </p>
                  {sum !== undefined && sum > 0 && (
                    <p className="text-sm font-semibold text-primary mt-1">{sum.toFixed(2)} €</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Month detail view
  const monthSum = monatRechnungen.reduce((s, r) => s + (r.betrag || 0), 0);

  return (
    <div>
      <Button variant="ghost" onClick={() => setSelectedMonth(null)} className="mb-4 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Zurück zur Übersicht
      </Button>

      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            {MONTHS[selectedMonth]} {year}
          </h1>
          <p className="text-muted-foreground">
            {monatRechnungen.length} Rechnung{monatRechnungen.length !== 1 ? "en" : ""}
          </p>
        </div>
        {monthSum > 0 && (
          <p className="text-2xl font-bold text-primary">{monthSum.toFixed(2)} €</p>
        )}
      </div>

      {/* Rechnungen list */}
      {monatRechnungen.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Noch keine Rechnungen für diesen Monat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monatRechnungen.map((r) => {
            const isPdf = r.dateiTyp.includes("pdf");
            return (
              <Card key={r.id} className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {isPdf ? (
                    <FileText className="h-5 w-5 text-destructive" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.beschreibung || r.dateiName}</p>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>{r.dateiName}</span>
                    {r.betrag !== undefined && <span className="font-semibold">{r.betrag.toFixed(2)} €</span>}
                    <span>{new Date(r.hochgeladenAm).toLocaleDateString("de-DE")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openPreview(r.dateiData, r.dateiName)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRechnung(r.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewUrl.startsWith("data:application/pdf") ? (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-md" />
            ) : (
              <img src={previewUrl} alt={previewName} className="w-full h-auto max-h-[70vh] object-contain rounded-md" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
