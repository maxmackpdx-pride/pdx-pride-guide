import { Component, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalA11y } from "@/hooks/useModalA11y";

function CardError({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) {
  const dialogRef = useModalA11y({ onClose });
  return createPortal(<div className="board-detail-backdrop" onClick={onClose}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Post could not open" tabIndex={-1} className="board-open-card" onClick={event => event.stopPropagation()}>
      <p role="alert">This post could not open. Your board is still here.</p>
      <button type="button" className="eb-tool" onClick={onRetry}>Try again</button>
      <button type="button" className="eb-tool" onClick={onClose}>Back to Our BoardZ</button>
    </div>
  </div>, document.body);
}

/** A broken post must never replace the room or require a page reload. */
export default class BoardDetailBoundary extends Component<{ children: ReactNode; onClose: () => void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) {
    try { void fetch("/api/system-diagnostics/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: error.message, stack: error.stack?.slice(0, 8000), pageUrl: window.location.href, userAgent: navigator.userAgent }) }).catch(() => {}); } catch { /* Diagnostics must never interrupt recovery. */ }
  }
  render() {
    return this.state.error ? <CardError onClose={this.props.onClose} onRetry={() => this.setState({ error: false })} /> : this.props.children;
  }
}
