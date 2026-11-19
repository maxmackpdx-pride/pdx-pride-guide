import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useThreadArchive(guide = false, enabled = true) {
  const { user } = useAuth();
  const client = useQueryClient();
  const { toast } = useToast();
  const path = guide ? "/api/admin/messages/archive" : "/api/messages/archive";
  const key = [path, user?.id];
  const archive = useQuery<string[]>({
    queryKey: key,
    enabled: Boolean(user && enabled),
    queryFn: () => apiRequest("GET", path).then((r) => r.json()),
    refetchOnWindowFocus: "always",
    refetchInterval: 60_000,
  });
  const ids = useMemo(() => new Set(archive.data ?? []), [archive.data]);
  const change = async (id: string, archived: boolean) => {
    try {
      await apiRequest(
        archived ? "PUT" : "DELETE",
        path + "/" + encodeURIComponent(id),
      );
      client.setQueryData<string[]>(key, (previous) =>
        archived
          ? [...new Set([...(previous ?? []), id])]
          : (previous ?? []).filter((value) => value !== id),
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({
          queryKey: [
            guide
              ? "/api/admin/messages/unread-count"
              : "/api/messages/unread-count",
          ],
        }),
        ...(guide
          ? [
              client.invalidateQueries({
                queryKey: ["/api/admin/pending-count"],
              }),
              client.invalidateQueries({ queryKey: ["/api/admin/pulse"] }),
            ]
          : []),
      ]);
      return true;
    } catch {
      toast({
        title: "Could not update the conversation",
        description: "Try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  return { ids, change, query: archive };
}

/** The old device-wide key has no account identity. Import only on request,
 * and remove only the IDs the server confirmed belong to this mailbox. */
export function ImportDeviceArchive({
  guide = false,
  onChange,
}: {
  guide?: boolean;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const key = guide ? "pdx-admin-guide-archived-v1" : "pdx-inbox-archived-v1";
  const read = (): string[] => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  };
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!user || done || read().length === 0) return null;
  const importThreads = async () => {
    setBusy(true);
    try {
      const ids = read(),
        path = guide
          ? "/api/admin/messages/archive/import"
          : "/api/messages/archive/import";
      const received = new Set<string>();
      for (let i = 0; i < ids.length; i += 100) {
        const r = await apiRequest("POST", path, {
          ids: ids.slice(i, i + 100),
        });
        const body: { imported: string[] } = await r.json();
        body.imported.forEach((id) => received.add(id));
      }
      localStorage.setItem(
        key,
        JSON.stringify(read().filter((id) => !received.has(id))),
      );
      setDone(true);
      onChange();
      toast({
        title: received.size
          ? "Conversations added to your archive"
          : "No matching conversations for this account",
      });
    } catch {
      toast({ title: "Could not import the archive", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      className="inbox-exp-mark-read"
      type="button"
      onClick={importThreads}
      disabled={busy}
    >
      {busy
        ? "Importing…"
        : "Import my archived conversations from this browser"}
    </button>
  );
}
