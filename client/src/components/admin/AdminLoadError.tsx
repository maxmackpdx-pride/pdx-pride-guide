type Props = {
  label: string;
  onRetry: () => void;
};

export default function AdminLoadError({ label, onRetry }: Props) {
  return (
    <div
      role="alert"
      style={{
        textAlign: "center",
        padding: "48px 20px",
        border: "1px solid var(--dash-orange)",
        background: "rgba(255,140,0,0.08)",
      }}
    >
      <p className="dash-anton" style={{ color: "#fff", fontSize: 20, marginBottom: 8 }}>
        COULD NOT LOAD {label.toUpperCase()}
      </p>
      <p className="dash-mono" style={{ color: "var(--dash-muted)", fontSize: 11, textTransform: "none", letterSpacing: "0.04em", marginBottom: 16 }}>
        The admin API may be down or your session expired.
      </p>
      <button type="button" className="dash-btn dash-btn-lime" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}