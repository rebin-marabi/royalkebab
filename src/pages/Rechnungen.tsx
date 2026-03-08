import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Rechnung {
  id: number;
  nummer: string;
  kunde: string;
  betrag: number;
  datum: string;
  status: "bezahlt" | "offen" | "überfällig";
}

const initialData: Rechnung[] = [
  { id: 1, nummer: "R-1042", kunde: "Lieferant Fleisch GmbH", betrag: 1250.0, datum: "2026-03-07", status: "offen" },
  { id: 2, nummer: "R-1041", kunde: "Getränke-Express", betrag: 380.5, datum: "2026-03-05", status: "bezahlt" },
  { id: 3, nummer: "R-1040", kunde: "Bäckerei Schmidt", betrag: 95.0, datum: "2026-03-03", status: "bezahlt" },
  { id: 4, nummer: "R-1039", kunde: "Gemüse-Großhandel Özkan", betrag: 620.0, datum: "2026-02-28", status: "überfällig" },
  { id: 5, nummer: "R-1038", kunde: "Verpackung & Co", betrag: 210.0, datum: "2026-02-25", status: "offen" },
];

const statusColors: Record<string, string> = {
  bezahlt: "bg-primary/10 text-primary",
  offen: "bg-accent/10 text-accent-foreground",
  überfällig: "bg-destructive/10 text-destructive",
};

export default function Rechnungen() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newR, setNewR] = useState({ nummer: "", kunde: "", betrag: "", datum: "" });

  const filtered = rechnungen.filter(
    (r) =>
      r.nummer.toLowerCase().includes(search.toLowerCase()) ||
      r.kunde.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newR.kunde) return;
    setRechnungen([
      ...rechnungen,
      {
        id: Date.now(),
        nummer: newR.nummer || `R-${1043 + rechnungen.length}`,
        kunde: newR.kunde,
        betrag: Number(newR.betrag) || 0,
        datum: newR.datum || new Date().toISOString().split("T")[0],
        status: "offen",
      },
    ]);
    setNewR({ nummer: "", kunde: "", betrag: "", datum: "" });
    setDialogOpen(false);
  };

  const total = rechnungen.reduce((s, r) => s + r.betrag, 0);
  const offen = rechnungen.filter((r) => r.status !== "bezahlt").reduce((s, r) => s + r.betrag, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Rechnungen</h1>
          <p className="text-muted-foreground mt-1">
            Gesamt: €{total.toFixed(2)} · Offen: €{offen.toFixed(2)}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Neue Rechnung
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Neue Rechnung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Rechnungsnummer</Label>
                <Input value={newR.nummer} onChange={(e) => setNewR({ ...newR, nummer: e.target.value })} placeholder="z.B. R-1043" />
              </div>
              <div>
                <Label>Kunde / Lieferant</Label>
                <Input value={newR.kunde} onChange={(e) => setNewR({ ...newR, kunde: e.target.value })} placeholder="Name" />
              </div>
              <div>
                <Label>Betrag (€)</Label>
                <Input type="number" value={newR.betrag} onChange={(e) => setNewR({ ...newR, betrag: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Datum</Label>
                <Input type="date" value={newR.datum} onChange={(e) => setNewR({ ...newR, datum: e.target.value })} />
              </div>
              <Button onClick={handleAdd} className="w-full">Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Rechnungen suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Nr.</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Kunde</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Betrag</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Datum</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{r.nummer}</td>
                <td className="p-4 text-muted-foreground">{r.kunde}</td>
                <td className="p-4 text-foreground font-medium">€{r.betrag.toFixed(2)}</td>
                <td className="p-4 text-muted-foreground">{r.datum}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
