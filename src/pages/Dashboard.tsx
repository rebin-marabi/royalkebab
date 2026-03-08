import { Users, FileText, Clock, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { mitarbeiter } = useStore();
  const navigate = useNavigate();

  const aktiv = mitarbeiter.filter((m) => m.vertragStatus === "aktiv").length;
  const gekuendigt = mitarbeiter.filter((m) => m.vertragStatus === "gekuendigt").length;

  const stats = [
    { label: "Mitarbeiter aktiv", value: String(aktiv), icon: Users, sub: `${gekuendigt} gekündigt` },
    { label: "Verträge gesamt", value: String(mitarbeiter.length), icon: FileText, sub: "Alle Verträge" },
    { label: "Ø Stunden/Woche", value: `${(mitarbeiter.reduce((s, m) => s + m.stundenProWoche, 0) / mitarbeiter.length).toFixed(0)}h`, icon: Clock, sub: "Pro Mitarbeiter" },
    { label: "Lohnkosten/Std.", value: `€${(mitarbeiter.reduce((s, m) => s + m.stundenlohn, 0) / mitarbeiter.length).toFixed(2)}`, icon: TrendingUp, sub: "Durchschnitt" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Willkommen zurück! Hier ist dein Überblick.</p>
      </div>

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

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/mitarbeiter")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Mitarbeiter verwalten</h3>
          <p className="text-sm text-muted-foreground">Personalfragebogen, Daten einsehen</p>
        </button>
        <button onClick={() => navigate("/vertraege")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Verträge & Kündigung</h3>
          <p className="text-sm text-muted-foreground">Verträge verwalten und kündigen</p>
        </button>
        <button onClick={() => navigate("/stunden")} className="stat-card text-left hover:border-primary/30 transition-colors">
          <h3 className="font-bold font-display text-foreground mb-1">Stunden erfassen</h3>
          <p className="text-sm text-muted-foreground">Arbeitszeiten eintragen und tracken</p>
        </button>
      </div>
    </div>
  );
}
