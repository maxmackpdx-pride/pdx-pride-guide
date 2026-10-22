import { useEffect, useState } from "react";

type PairingRequest = {
  id: string;
  displayCode: string;
  expiresAt: string;
  approvedAt: string | null;
};
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
    if (!response.ok) throw new Error("Could not load agent access");
    const data = await response.json();
    setRequests(data.requests || []);
    setCredentials(data.credentials || []);
  }

  useEffect(() => {
    void refresh().catch(err => setError(err.message));
    const timer = window.setInterval(() => { void refresh().catch(() => {}); }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  async function act(path: string, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error((await response.json()).error || "Action failed");
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
      {requests.length === 0 && <p className="text-white/40 text-sm">No pending connection requests.</p>}
      {requests.map(request => (
        <div key={request.id} className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-white tracking-wider">{request.displayCode}</p>
            <p className="text-white/40 text-xs">Expires {new Date(request.expiresAt).toLocaleTimeString()}</p>
          </div>
          {request.approvedAt ? <span className="text-xs text-white/40">Approved; waiting for agent</span> : (
            <button type="button" disabled={busy} className="zay-action pdx-glass-rebind display text-xs px-3 py-2 border"
              onClick={() => void act(`/api/admin/event-research/pairing/${encodeURIComponent(request.id)}/approve`,
                `Approve QSearch connection code ${request.displayCode}? The agent will be able to publish verified events.`)}>
              APPROVE
            </button>
          )}
        </div>
      ))}
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
