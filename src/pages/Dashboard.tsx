import { Users, FileText, Euro, TrendingUp } from "lucide-react";

const stats = [
  { label: "Mitarbeiter", value: "8", icon: Users, change: "+1 diesen Monat" },
  { label: "Offene Rechnungen", value: "12", icon: FileText, change: "3 überfällig" },
  { label: "Umsatz (Monat)", value: "€14.520", icon: Euro, change: "+8% vs. Vormonat" },
  { label: "Bestellungen heute", value: "87", icon: TrendingUp, change: "Durchschnitt: 72" },
];

const recentActivity = [
  { text: "Rechnung #1042 erstellt", time: "vor 2 Std.", type: "rechnung" },
  { text: "Ali hat Schicht getauscht", time: "vor 3 Std.", type: "mitarbeiter" },
  { text: "Rechnung #1039 bezahlt", time: "vor 5 Std.", type: "rechnung" },
  { text: "Neuer Mitarbeiter: Murat", time: "gestern", type: "mitarbeiter" },
  { text: "Lieferant-Rechnung eingegangen", time: "gestern", type: "rechnung" },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Willkommen zurück! Hier ist dein Überblick.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Letzte Aktivitäten</h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.type === "rechnung" ? "bg-accent" : "bg-primary"}`} />
                <span className="text-sm text-foreground">{item.text}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
