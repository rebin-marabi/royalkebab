export default function Einstellungen() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Laden-Einstellungen verwalten</p>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold font-display text-foreground mb-2">Laden-Informationen</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="text-foreground font-medium">Döner König</p>
            </div>
            <div>
              <span className="text-muted-foreground">Adresse:</span>
              <p className="text-foreground font-medium">Hauptstraße 42, 12345 Berlin</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefon:</span>
              <p className="text-foreground font-medium">030 1234567</p>
            </div>
            <div>
              <span className="text-muted-foreground">Öffnungszeiten:</span>
              <p className="text-foreground font-medium">Mo-Sa 10:00 - 23:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
