interface BreakoutControlsProps {
  visible: boolean;
  onLeft: (pressed: boolean) => void;
  onRight: (pressed: boolean) => void;
}

export function BreakoutControls({ visible, onLeft, onRight }: BreakoutControlsProps) {
  if (!visible) return null;

  return (
    <div className="bo-touch-controls" aria-hidden={!visible}>
      <button
        type="button"
        className="bo-touch-btn"
        aria-label="Schläger links"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          onLeft(true);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onLeft(false);
        }}
        onPointerCancel={() => onLeft(false)}
        onLostPointerCapture={() => onLeft(false)}
      >
        ◀
      </button>
      <button
        type="button"
        className="bo-touch-btn"
        aria-label="Schläger rechts"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          onRight(true);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onRight(false);
        }}
        onPointerCancel={() => onRight(false)}
        onLostPointerCapture={() => onRight(false)}
      >
        ▶
      </button>
    </div>
  );
}
