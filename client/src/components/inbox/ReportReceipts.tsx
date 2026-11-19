import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

type Receipt = {
  id: number;
  caseId: number;
  kind: "appeal" | "desk";
  subject: string;
  status: string;
};
type Conversation = {
  status: string;
  replies: Array<{
    id: number;
    author: "member" | "owner";
    body: string;
    createdAt: string;
  }>;
};
const statusLabel = (value: string) =>
  ({
    PENDING: "Waiting for review",
    OPEN: "Open",
    APPROVED: "Approved",
    REJECTED: "Declined",
    RESOLVED: "Resolved",
  })[value] ?? "Received";

export function ReportConversation({
  id,
  owner = false,
}: {
  id: number;
  owner?: boolean;
}) {
  const { user } = useAuth();
  const path = owner
    ? `/api/admin/owner-desk/${id}/conversation`
    : `/api/me/report-receipts/${id}/conversation`;
  const client = useQueryClient();
  const key = [path, user?.id];
  const thread = useQuery<Conversation>({
    queryKey: key,
    queryFn: () => apiRequest("GET", path).then((r) => r.json()),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const [draft, setDraft] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const data: Conversation = await apiRequest("POST", path, {
        body: draft,
        requestId,
      }).then((r) => r.json());
      client.setQueryData(key, data);
      setDraft("");
      setRequestId(crypto.randomUUID());
    } catch {
      setError("Reply could not be confirmed. You can try again.");
      void thread.refetch();
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="report-conversation" aria-label="Report conversation">
      {thread.isPending && <p role="status">Loading replies…</p>}
      {thread.isError && (
        <p role="alert">
          Replies unavailable.{" "}
          <button onClick={() => void thread.refetch()}>Retry</button>
        </p>
      )}
      {thread.data?.replies.map((reply) => (
        <p key={reply.id}>
          <strong>
            {reply.author === "owner" ? "Site owner" : "Reporter"}
          </strong>
          <br />
          {reply.body}
        </p>
      ))}
      {thread.data?.status === "OPEN" && (
        <form onSubmit={submit}>
          <label>
            Reply in Zaylist
            <textarea
              maxLength={2000}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setRequestId(crypto.randomUUID());
              }}
              disabled={sending}
              required
            />
          </label>
          <button type="submit" disabled={sending || !draft.trim()}>
            {sending ? "Sending…" : "Send private reply"}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

export function ReportReceipts({
  appealsOnly = false,
}: {
  appealsOnly?: boolean;
}) {
  const { user } = useAuth();
  const path = appealsOnly
    ? "/api/auth/suspension-appeal/receipts"
    : "/api/me/report-receipts";
  const query = useQuery<Receipt[]>({
    queryKey: [path, user?.id],
    queryFn: () => apiRequest("GET", path).then((r) => r.json()),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const [selected, setSelected] = useState<number | null>(null);
  if (query.isError)
    return (
      <p role="alert">
        Report receipts unavailable.{" "}
        <button onClick={() => void query.refetch()}>Retry</button>
      </p>
    );
  if (!query.data?.length) return null;
  return (
    <section
      className="report-receipts"
      aria-label={appealsOnly ? "Your appeals" : "Your report receipts"}
    >
      <h3>{appealsOnly ? "Your appeals" : "Your report receipts"}</h3>
      {query.data.map((row) => (
        <div key={row.id}>
          {row.kind === "desk" ? (
            <button
              type="button"
              aria-expanded={selected === row.id}
              onClick={() => setSelected(selected === row.id ? null : row.id)}
            >
              {row.subject} · {statusLabel(row.status)}
            </button>
          ) : (
            <p>
              Appeal #{row.caseId} · {statusLabel(row.status)}
            </p>
          )}
          {row.kind === "desk" && selected === row.id && (
            <ReportConversation key={row.id} id={row.id} />
          )}
        </div>
      ))}
    </section>
  );
}
