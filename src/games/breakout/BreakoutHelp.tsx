import './BreakoutHelp.css';

interface BreakoutHelpProps {
  onClose: () => void;
}

export function BreakoutHelp({ onClose }: BreakoutHelpProps) {
  return (
    <div className="bo-help-overlay" role="dialog" aria-labelledby="bo-help-title">
      <div className="bo-help">
        <h2 id="bo-help-title" className="bo-help-title">
          Breakout
        </h2>
        <p>
          Steuere den Schläger am unteren Rand und halte den Ball im Spiel. Zerstöre alle Blöcke,
          indem du den Ball gegen sie lenkst. Trifft der Ball den Schläger weiter links oder rechts,
          ändert sich sein Abprallwinkel. Fällt der Ball unter den Schläger, verlierst du ein Leben.
        </p>
        <h3 className="bo-help-sub">Steuerung</h3>
        <p>
          <strong>Desktop:</strong> Pfeiltasten oder A/D – Schläger · Leertaste oder Enter – Ball
          starten · P oder Escape – Pause
        </p>
        <p>
          <strong>Maus:</strong> Maus über dem Spielfeld bewegen, um den Schläger zu steuern
        </p>
        <p>
          <strong>Handy und Tablet:</strong> Finger horizontal über das Spielfeld bewegen · alternativ
          Links-/Rechts-Schaltflächen · Spielfeld antippen, um den Ball zu starten
        </p>
        <h3 className="bo-help-sub">Ziel</h3>
        <p>
          Zerstöre alle Blöcke, sammle Punkte und erreiche einen möglichst hohen Highscore.
        </p>
        <button type="button" className="bo-btn" onClick={onClose}>
          SCHLIESSEN
        </button>
      </div>
    </div>
  );
}
