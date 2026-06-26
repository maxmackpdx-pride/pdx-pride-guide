import SpectrumLoader from "./SpectrumLoader";

export default function BoardLoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="board-loading-state" role="status" aria-label={label}>
      <SpectrumLoader variant="full" label={label} />
      <p className="board-loading-state__label">{label}</p>
    </div>
  );
}