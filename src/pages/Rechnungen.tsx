import { useState, useMemo, useRef } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Upload, Trash2, Eye, FileText, Image as ImageIcon, X } from "lucide-react";
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
  const [beschreibung, setBeschreibung] = useState("");
  const [betrag, setBetrag] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const monatRechnungen = useMemo(() => {
    if (selectedMonth === null) return [];
    const prefix = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return rechnungen
      .filter((r) => r.monat === prefix)
      .sort((a, b) => b.id - a.id);
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

  const handleUpload = () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0 || selectedMonth === null) return;
    const prefix = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addRechnung({
          monat: prefix,
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

    if (fileRef.current) fileRef.current.value = "";
    setBeschreibung("");
    setBetrag("");
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
        <p className="text-muted-foreground mb-6">Rechnungen nach Monat verwalten und hochladen</p>

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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Month detail view
  return (
    <div>
      <Button variant="ghost" onClick={() => setSelectedMonth(null)} className="mb-4 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Zurück zur Übersicht
      </Button>

      <h1 className="text-3xl font-bold font-display text-foreground mb-2">
        {MONTHS[selectedMonth]} {year}
      </h1>
      <p className="text-muted-foreground mb-6">
        {monatRechnungen.length} Rechnung{monatRechnungen.length !== 1 ? "en" : ""}
      </p>

      {/* Upload area */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rechnung hochladen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={() => {
                if (fileRef.current?.files?.length) handleUpload();
              }}
            />
            <Input
              placeholder="Beschreibung (optional)"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Betrag €"
              type="number"
              step="0.01"
              value={betrag}
              onChange={(e) => setBetrag(e.target.value)}
              className="w-32"
            />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Hochladen
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <p className="font-medium truncate">{r.dateiName}</p>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {r.beschreibung && <span>{r.beschreibung}</span>}
                    {r.betrag !== undefined && <span>{r.betrag.toFixed(2)} €</span>}
                    <span>{new Date(r.hochgeladenAm).toLocaleDateString("de-DE")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openPreview(r.dateiData, r.dateiName)}
                  >
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
