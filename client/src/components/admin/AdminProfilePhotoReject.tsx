import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PROFILE_PHOTO_REJECT_REASONS } from "@shared/boardModeration";

type Props = {
  username: string;
  onRejected?: () => void;
};

export default function AdminProfilePhotoReject({ username, onRejected }: Props) {
  const { toast } = useToast();
  const [reasonCode, setReasonCode] = useState<string>(PROFILE_PHOTO_REJECT_REASONS[0].code);
  const [note, setNote] = useState("");

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${username}/reject-photo`, { reasonCode, note });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({ title: "Profile photo removed", duration: 2500 });
      onRejected?.();
    },
    onError: (err) => {
      toast({ title: parseApiError(err, "Could not remove photo"), variant: "destructive" });
    },
  });

  return (
    <div className="pp-admin-photo-reject">
      <label className="display pp-admin-photo-reject__label">ADMIN: REJECT PHOTO</label>
      <select
        value={reasonCode}
        onChange={e => setReasonCode(e.target.value)}
        className="pp-admin-photo-reject__select"
      >
        {PROFILE_PHOTO_REJECT_REASONS.map(r => (
          <option key={r.code} value={r.code}>{r.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note to member (inbox)"
        className="pp-admin-photo-reject__input"
      />
      <button
        type="button"
        disabled={rejectMutation.isPending || !reasonCode}
        onClick={() => rejectMutation.mutate()}
        className="pp-admin-photo-reject__btn"
      >
        {rejectMutation.isPending ? "REMOVING…" : "REJECT PHOTO"}
      </button>
    </div>
  );
}