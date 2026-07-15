import './GameHelp.css';

interface GameHelpProps {
  mode?: 'classic' | 'dynamic' | 'both';
  compact?: boolean;
}

export function GameHelp({ mode = 'both', compact = false }: GameHelpProps) {
  return (
    <div className={`bs-help${compact ? ' bs-help--compact' : ''}`}>
      {(mode === 'both' || mode === 'classic') && (
        <section className="bs-help-section">
          <h4 className="bs-help-title">Klassisch</h4>
          <p>
            Jeder Spieler feuert pro Zug immer drei Schüsse – unabhängig davon, wie viele Schiffe
            noch auf dem Wasser sind.
          </p>
        </section>
      )}
      {(mode === 'both' || mode === 'dynamic') && (
        <section className="bs-help-section">
          <h4 className="bs-help-title">Dynamischer Modus</h4>
          <p>
            Im dynamischen Modus richtet sich die Anzahl deiner Schüsse nach der Stärke deiner
            verbleibenden Flotte. Solange dir noch starke Schiffe zur Verfügung stehen, kannst du pro
            Zug drei Schüsse abgeben. Mit jeder vollständig versenkten Einheit sinkt deine
            Kampfkraft. Je kleiner deine verbliebene Flotte wird, desto weniger Schüsse stehen dir
            pro Runde zur Verfügung. Große Schiffe wie das Schlachtschiff oder der Kreuzer haben
            dabei einen größeren Einfluss als kleine Schiffe.
          </p>
          <ul className="bs-help-list">
            <li>12–17 Punkte → 3 Schüsse</li>
            <li>6–11 Punkte → 2 Schüsse</li>
            <li>1–5 Punkte → 1 Schuss</li>
          </ul>
          <p className="bs-help-note">
            Beschädigte Schiffe zählen mit voller Länge, bis sie versenkt sind. Die neue Schusszahl
            gilt erst ab dem nächsten Zug.
          </p>
        </section>
      )}
    </div>
  );
}
