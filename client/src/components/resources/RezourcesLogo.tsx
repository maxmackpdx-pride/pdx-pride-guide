import './RezourcesLogo.css';

/** Only the perimeter drafting lines move; the wordmark and illustrations stay still. */
export function RezourcesLogo({ quietMotion = false }: { quietMotion?: boolean }) {
  return (
    <h1 className="rg-board-logo-frame rg-z-logo" data-quiet-motion={quietMotion || undefined}>
      <img className="rg-board-logo" src="/brand/family/rezources.svg" alt="ReZources" />
      {!quietMotion && ['top', 'bottom'].map(edge => (
        <img
          key={edge}
          className={`rg-board-logo rg-sketch-motion rg-sketch-motion--${edge}`}
          src="/brand/family/rezources.svg"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ))}
    </h1>
  );
}
