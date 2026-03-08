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

interface Mitarbeiter {
  id: number;
  name: string;
  rolle: string;
  stunden: number;
  telefon: string;
  status: "aktiv" | "inaktiv";
}

const initialData: Mitarbeiter[] = [
  { id: 1, name: "Ali Yilmaz", rolle: "Dönermacher", stunden: 38, telefon: "0151 1234567", status: "aktiv" },
  { id: 2, name: "Murat Demir", rolle: "Kassierer", stunden: 20, telefon: "0152 7654321", status: "aktiv" },
  { id: 3, name: "Leyla Kaya", rolle: "Service", stunden: 25, telefon: "0170 9876543", status: "aktiv" },
  { id: 4, name: "Hasan Özdemir", rolle: "Dönermacher", stunden: 40, telefon: "0163 4567890", status: "aktiv" },
  { id: 5, name: "Sophie Müller", rolle: "Aushilfe", stunden: 12, telefon: "0176 1112233", status: "inaktiv" },
];

export default function Mitarbeiter() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMA, setNewMA] = useState({ name: "", rolle: "", stunden: "", telefon: "" });

  const filtered = mitarbeiter.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.rolle.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newMA.name) return;
    setMitarbeiter([
      ...mitarbeiter,
      {
        id: Date.now(),
        name: newMA.name,
        rolle: newMA.rolle,
        stunden: Number(newMA.stunden) || 0,
        telefon: newMA.telefon,
        status: "aktiv",
      },
    ]);
    setNewMA({ name: "", rolle: "", stunden: "", telefon: "" });
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Mitarbeiter</h1>
          <p className="text-muted-foreground mt-1">{mitarbeiter.length} Mitarbeiter insgesamt</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Neuer Mitarbeiter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={newMA.name} onChange={(e) => setNewMA({ ...newMA, name: e.target.value })} placeholder="Vor- und Nachname" />
              </div>
              <div>
                <Label>Rolle</Label>
                <Input value={newMA.rolle} onChange={(e) => setNewMA({ ...newMA, rolle: e.target.value })} placeholder="z.B. Dönermacher, Kassierer" />
              </div>
              <div>
                <Label>Stunden/Woche</Label>
                <Input type="number" value={newMA.stunden} onChange={(e) => setNewMA({ ...newMA, stunden: e.target.value })} placeholder="z.B. 40" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={newMA.telefon} onChange={(e) => setNewMA({ ...newMA, telefon: e.target.value })} placeholder="Handynummer" />
              </div>
              <Button onClick={handleAdd} className="w-full">Hinzufügen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Mitarbeiter suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Name</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Rolle</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Std./Woche</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Telefon</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{m.name}</td>
                <td className="p-4 text-muted-foreground">{m.rolle}</td>
                <td className="p-4 text-muted-foreground">{m.stunden}h</td>
                <td className="p-4 text-muted-foreground">{m.telefon}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    m.status === "aktiv"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {m.status}
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
