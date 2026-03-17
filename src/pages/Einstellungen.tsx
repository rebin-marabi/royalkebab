import { useState } from "react";
import { useStore, ArbeitgeberDaten, Vertragstyp, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Pencil, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Einstellungen() {
  const { arbeitgeber, setArbeitgeber, vorlagen, updateVorlage } = useStore();
  const { changePassword } = useAuth();
  const [agForm, setAgForm] = useState<ArbeitgeberDaten>(arbeitgeber);
  const [editingParagraph, setEditingParagraph] = useState<{ typ: Vertragstyp; index: number } | null>(null);
  const [editText, setEditText] = useState("");
  const [editTitel, setEditTitel] = useState("");

  // Passwort ändern
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleChangePw = () => {
    if (newPw.length < 4) {
      toast({ title: "Fehler", description: "Neues Passwort muss mindestens 4 Zeichen haben.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }
    if (changePassword(currentPw, newPw)) {
      toast({ title: "Gespeichert", description: "Passwort wurde geändert." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      toast({ title: "Fehler", description: "Aktuelles Passwort ist falsch.", variant: "destructive" });
    }
  };

  const saveArbeitgeber = () => {
    setArbeitgeber(agForm);
    toast({ title: "Gespeichert", description: "Arbeitgeber-Daten wurden aktualisiert." });
  };

  const startEdit = (typ: Vertragstyp, index: number) => {
    const vorlage = vorlagen.find((v) => v.typ === typ);
    if (!vorlage) return;
    setEditingParagraph({ typ, index });
    setEditTitel(vorlage.paragraphen[index].titel);
    setEditText(vorlage.paragraphen[index].inhalt);
  };

  const saveEdit = () => {
    if (!editingParagraph) return;
    const vorlage = vorlagen.find((v) => v.typ === editingParagraph.typ);
    if (!vorlage) return;
    const updated = { ...vorlage, paragraphen: [...vorlage.paragraphen] };
    updated.paragraphen[editingParagraph.index] = { titel: editTitel, inhalt: editText };
    updateVorlage(editingParagraph.typ, updated);
    setEditingParagraph(null);
    toast({ title: "Gespeichert", description: "Vertragsvorlage wurde aktualisiert." });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Laden-Daten und Vertragsvorlagen verwalten</p>
      </div>

      {/* Arbeitgeber */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-bold font-display text-foreground mb-4">Arbeitgeber-Daten</h2>
        <p className="text-sm text-muted-foreground mb-4">Diese Daten erscheinen in allen Vertraegen.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Firmenname</Label><Input value={agForm.name} onChange={(e) => setAgForm({ ...agForm, name: e.target.value })} /></div>
          <div><Label>Adresse</Label><Input value={agForm.adresse} onChange={(e) => setAgForm({ ...agForm, adresse: e.target.value })} /></div>
          <div><Label>Vertreten durch</Label><Input value={agForm.vertreter} onChange={(e) => setAgForm({ ...agForm, vertreter: e.target.value })} /></div>
          <div><Label>Ort</Label><Input value={agForm.ort} onChange={(e) => setAgForm({ ...agForm, ort: e.target.value })} /></div>
        </div>
        <Button onClick={saveArbeitgeber} className="mt-4"><Save className="h-4 w-4 mr-2" /> Speichern</Button>
      </div>

      {/* Passwort ändern */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" /> Passwort ändern
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Admin-Zugangspasswort ändern.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Aktuelles Passwort</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Neues Passwort</Label>
            <Input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 4 Zeichen" />
          </div>
          <div>
            <Label>Passwort bestätigen</Label>
            <Input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Wiederholen" />
          </div>
        </div>
        <Button onClick={handleChangePw} className="mt-4" disabled={!currentPw || !newPw || !confirmPw}>
          <Save className="h-4 w-4 mr-2" /> Passwort ändern
        </Button>
      </div>

      {/* Vertragsvorlagen */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-bold font-display text-foreground mb-4">Vertragsvorlagen</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Hier kannst du die Texte fuer jeden Vertragstyp anpassen. Platzhalter wie <code className="bg-muted px-1 rounded text-xs">{"{vorname}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{nachname}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{stundenlohn}"}</code>, etc. werden automatisch ersetzt.
        </p>

        <Tabs defaultValue="minijob">
          <TabsList>
            {(["minijob", "teilzeit", "vollzeit"] as Vertragstyp[]).map((typ) => (
              <TabsTrigger key={typ} value={typ}>{VERTRAGSTYP_LABELS[typ]}</TabsTrigger>
            ))}
          </TabsList>

          {(["minijob", "teilzeit", "vollzeit"] as Vertragstyp[]).map((typ) => {
            const vorlage = vorlagen.find((v) => v.typ === typ);
            if (!vorlage) return null;
            return (
              <TabsContent key={typ} value={typ} className="mt-4 space-y-3">
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground">Ueberschrift</Label>
                  <p className="text-sm font-medium text-foreground">{vorlage.ueberschrift}</p>
                </div>
                {vorlage.paragraphen.map((p, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    {editingParagraph?.typ === typ && editingParagraph?.index === i ? (
                      <div className="space-y-3">
                        <div><Label>Titel</Label><Input value={editTitel} onChange={(e) => setEditTitel(e.target.value)} /></div>
                        <div><Label>Inhalt</Label><Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={6} className="font-mono text-sm" /></div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}><Save className="h-3 w-3 mr-1" /> Speichern</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingParagraph(null)}>Abbrechen</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">Paragraph {i + 1}: {p.titel}</p>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{p.inhalt}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(typ, i)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
