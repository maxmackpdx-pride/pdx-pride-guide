import { useEffect, useState } from "react";

type PairingRequest = {
  id: string;
  displayCode: string;
  createdAt?: string;
  expiresAt: string;
  approvedAt: string | null;
  status?: "pending" | "approved" | "consumed" | "expired";
};

/** Server-derived status; falls back to the dates for an older server. */
function requestStatus(request: PairingRequest): NonNullable<PairingRequest["status"]> {
  if (request.status) return request.status;
  if (new Date(request.expiresAt).getTime() <= Date.now()) return "expired";
  return request.approvedAt ? "approved" : "pending";
}

/** Short, secret-free reason for a failed request: status plus the server's own message. */
async function failureReason(response: Response, fallback: string) {
  let detail = "";
  try {
    const body = await response.json();
    detail = [body?.error, body?.detail].filter(Boolean).join(": ");
  } catch { /* non-JSON body */ }
  return `${fallback} (HTTP ${response.status}${detail ? `: ${detail}` : ""})`;
}
type AgentCredential = {
  id: string;
  agentName: string;
  createdAt: string;
  revokedAt: string | null;
};

export default function AdminQSearchPairing() {
  const [requests, setRequests] = useState<PairingRequest[]>([]);
  const [credentials, setCredentials] = useState<AgentCredential[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/event-research/pairing", { credentials: "include" });
    if (!response.ok) throw new Error(await failureReason(response, "Could not load agent access"));
    const data = await response.json();
    setRequests(data.requests || []);
    setCredentials(data.credentials || []);
  }

  useEffect(() => {
    void refresh().catch(err => setError(err.message));
    const timer = window.setInterval(() => { void refresh().then(() => setError(prev => prev.startsWith("Could not load") ? "" : prev)).catch(() => {}); }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  async function act(path: string, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error(await failureReason(response, "Action failed"));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-white/10 p-5 space-y-3 max-w-xl" style={{ background: "#111" }}>
      <h3 className="display text-lg text-white">QSearch agent access</h3>
      <p className="text-white/50 text-sm">
        This agent can research and publish verified events. It cannot manage people, posts, or notifications.
        Approve only a code you just asked the agent to show you.
      </p>
      {error && <p className="text-red-300 text-sm" role="alert">{error}</p>}
      {requests.length === 0 && <p className="text-white/40 text-sm">No connection requests in the last 24 hours. Ask the agent to start a new one; its code works for 15 minutes.</p>}
      {requests.length > 0 && !requests.some(item => requestStatus(item) === "pending") && (
        <p className="text-white/40 text-sm">Nothing is waiting for approval. Codes expire after 15 minutes, so ask the agent for a fresh one if yours shows as expired.</p>
      )}
      {requests.map(request => {
        const status = requestStatus(request);
        return (
        <div key={request.id} className="border-t border-white/10 pt-3 flex items-center justify-between gap-3" data-status={status}>
          <div>
            <p className={`font-mono tracking-wider ${status === "expired" ? "text-white/40 line-through" : "text-white"}`}>{request.displayCode}</p>
            <p className="text-white/40 text-xs">
              {status === "expired" ? `Expired ${new Date(request.expiresAt).toLocaleTimeString()}` : status === "consumed" ? "Connected" : `Expires ${new Date(request.expiresAt).toLocaleTimeString()}`}
            </p>
          </div>
          {status === "expired" ? <span className="text-xs text-white/40">Expired. Ask the agent for a new code</span>
          : status === "consumed" ? <span className="text-xs text-white/40">Agent connected</span>
          : status === "approved" ? <span className="text-xs text-white/40">Approved; waiting for agent</span> : (
            <button type="button" disabled={busy} className="zay-action pdx-glass-rebind display text-xs px-3 py-2 border"
              onClick={() => void act(`/api/admin/event-research/pairing/${encodeURIComponent(request.id)}/approve`,
                `Approve QSearch connection code ${request.displayCode}? The agent will be able to publish verified events.`)}>
              APPROVE
            </button>
          )}
        </div>
        );
      })}
      <p className="text-white/50 text-xs pt-2">Connected agents</p>
      {credentials.filter(item => !item.revokedAt).length === 0 && <p className="text-white/40 text-sm">None yet.</p>}
      {credentials.filter(item => !item.revokedAt).map(item => (
        <div key={item.id} className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
          <span className="text-white/70 text-sm">{item.agentName} · connected {new Date(item.createdAt).toLocaleDateString()}</span>
          <button type="button" disabled={busy} className="zay-action pdx-glass-rebind zay-action--destructive display text-xs px-3 py-2 border"
            onClick={() => void act(`/api/admin/event-research/credentials/${encodeURIComponent(item.id)}/revoke`,
              "Disconnect this QSearch agent? It will no longer be able to change events.")}>DISCONNECT</button>
        </div>
      ))}
    </section>
  );
}
