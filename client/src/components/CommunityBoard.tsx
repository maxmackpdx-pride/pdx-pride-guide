import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
type Entry = { id: number; name: string; username: string; title: string };
export default function CommunityBoard({
  slug,
  owner,
  members,
}: {
  slug: string;
  owner: boolean;
  members?: { id: number; username: string; status: string }[];
}) {
  const { user } = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const path = "/api/communities/" + encodeURIComponent(slug) + "/board",
    board = useQuery<Entry[]>({
      queryKey: [path, user?.id],
      queryFn: () => apiRequest("GET", path).then((r) => r.json()),
    });
  if (!owner && !board.data?.length) return null;
  const save = async (id: number, title: string) => {
    setBusy(true);
    setError("");
    try {
      await apiRequest("PUT", path + "/" + id, { title });
      await board.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="z-community-feed__compose pdx-glass-rebind">
      <h3>Board members</h3>
      {board.data?.map((p) => (
        <div key={p.id}>
          <Link href={"/u/" + encodeURIComponent(p.username)}>{p.name}</Link> ·{" "}
          {p.title}{" "}
          {owner && (
            <button disabled={busy} onClick={() => void save(p.id, "")}>
              Remove listing
            </button>
          )}
        </div>
      ))}
      {owner && (
        <details>
          <summary>Assign a board title</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void save(Number(f.get("member")), String(f.get("title")));
            }}
          >
            <label>
              Active member
              <select name="member" required defaultValue="">
                <option value="" disabled>
                  Select a member
                </option>
                {members
                  ?.filter((m) => m.status === "active")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      @{m.username}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Board title
              <input name="title" required maxLength={80} />
            </label>
            <button disabled={busy}>List board member</button>
          </form>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
