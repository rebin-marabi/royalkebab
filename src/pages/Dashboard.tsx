import { useState, useMemo } from "react";
import { Users, FileText, Clock, TrendingUp, Search, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useStore, VERTRAGSTYP_LABELS } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { calcHours } from "@/lib/stundenUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function Dashboard() {
  const { mitarbeiter, stunden } = useStore();
  const navigate = useNavigate();
  const now = new Date();

  const [searchMA, setSearchMA] = useState("");
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  // Stats
  const aktiv = mitarbeiter.filter((m) => m.vertragStatus === "aktiv").length;
  const gekuendigt = mitarbeiter.filter((m) => m.vertragStatus === "gekuendigt").length;
  const minijobs = mitarbeiter.filter((m) => m.vertragstyp === "minijob").length;
  const teilzeit = mitarbeiter.filter((m) => m.vertragstyp === "teilzeit").length;
  const vollzeit = mitarbeiter.filter((m) => m.vertragstyp === "vollzeit").length;

  const stats = [
    { label: "Mitarbeiter aktiv", value: String(aktiv), icon: Users, sub: `${gekuendigt} gekündigt` },
    { label: "Vollzeit", value: String(vollzeit), icon: FileText, sub: `${teilzeit} Teilzeit, ${minijobs} Minijob` },
    { label: "Verträge gesamt", value: String(mitarbeiter.length), icon: Clock, sub: "Alle Vertragsarten" },
    { label: "Lohnkosten/Std.", value: `€${(mitarbeiter.reduce((s, m) => s + m.stundenlohn, 0) / (mitarbeiter.length || 1)).toFixed(2)}`, icon: TrendingUp, sub: "Durchschnitt" },
  ];

  // Monthly employee data
  const maMonthData = useMemo(() => {
    return mitarbeiter.map((m) => {
      const entries = stunden.filter(
        (s) => s.mitarbeiterId === m.id && s.datum.startsWith(monthPrefix)
      );
      const istStunden = entries.reduce(
        (sum, e) => sum + calcHours(e.startzeit, e.endzeit, e.pause),
        0
      );
      const sollStunden = m.monatlicheStunden;
      const prozent = sollStunden > 0 ? Math.min(100, (istStunden / sollStunden) * 100) : 0;
      const tageGearbeitet = new Set(entries.map((e) => e.datum)).size;

      return { ...m, istStunden, sollStunden, prozent, tageGearbeitet, eintraegeCount: entries.length };
    });
  }, [mitarbeiter, stunden, monthPrefix]);

  const filtered = maMonthData.filter(
    (m) =>
      `${m.vorname} ${m.nachname}`.toLowerCase().includes(searchMA.toLowerCase()) ||
      m.position.toLowerCase().includes(searchMA.toLowerCase()) ||
      m.vertragstyp.toLowerCase().includes(searchMA.toLowerCase())
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Willkommen zurück! Hier ist dein Überblick.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Employee Overview */}
      <div className="bg-card rounded-lg border p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">Monatsübersicht Mitarbeiter</h2>
            <p className="text-sm text-muted-foreground">Wer hat wieviel gearbeitet?</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold font-display min-w-[140px] text-center">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Mitarbeiter suchen (Name, Position, Vertragstyp)..."
            value={searchMA}
            onChange={(e) => setSearchMA(e.target.value)}
          />
        </div>

        {/* Employee list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Keine Mitarbeiter gefunden</p>
          ) : (
            filtered.map((m) => {
              const isComplete = m.prozent >= 100;
              const hasEntries = m.eintraegeCount > 0;
              const isLow = m.prozent > 0 && m.prozent < 50;

              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-background hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/mitarbeiter/${m.id}`)}
                >
                  {/* Name & Info */}
                  <div className="flex items-center gap-3 sm:w-[220px] shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isComplete
                        ? "bg-primary/15 text-primary"
                        : !hasEntries
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}>
                      {m.vorname[0]}{m.nachname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{m.vorname} {m.nachname}</p>
                      <div className="flex gap-1.5 items-center">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {VERTRAGSTYP_LABELS[m.vertragstyp]}
                        </Badge>
                        <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                          m.vertragStatus === "aktiv"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {m.vertragStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-muted-foreground">
                        {m.istStunden.toFixed(1)}h / {m.sollStunden}h Soll
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isComplete && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        {isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <span className={`text-sm font-bold ${
                          isComplete ? "text-primary" : isLow ? "text-amber-500" : "text-foreground"
                        }`}>
                          {m.prozent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={m.prozent} className="h-2" />
                  </div>

                  {/* Days worked */}
                  <div className="text-right sm:w-[80px] shrink-0">
                    <p className="text-lg font-bold font-display text-foreground">{m.tageGearbeitet}</p>
                    <p className="text-xs text-muted-foreground">Tage</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/mitarbeiter")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Mitarbeiter verwalten</h3>
          <p className="text-sm text-muted-foreground">Personalfragebogen, Daten einsehen</p>
        </button>
        <button onClick={() => navigate("/vertraege")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Verträge & Kündigung</h3>
          <p className="text-sm text-muted-foreground">PDF erstellen, Verträge verwalten</p>
        </button>
        <button onClick={() => navigate("/stunden")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Stunden erfassen</h3>
          <p className="text-sm text-muted-foreground">Arbeitszeiten eintragen und tracken</p>
        </button>
      </div>
    </div>
  );
}
