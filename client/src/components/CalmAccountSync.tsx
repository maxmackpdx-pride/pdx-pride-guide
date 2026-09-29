import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/queryClient";

/**
 * Members keep calm mode on their account so it follows them to other devices.
 * Guests keep it on the device (ThemeContext). The account value wins on sign-in;
 * a change while signed in is saved back. A failed save leaves the device value.
 */
export default function CalmAccountSync() {
  const { user } = useAuth();
  const { calmMode, setCalmMode } = useTheme();
  const synced = useRef<number | null>(null);
  const previous = useRef(calmMode);

  useEffect(() => {
    const changed = previous.current !== calmMode;
    previous.current = calmMode;
    if (!user) { synced.current = null; return; }
    if (synced.current !== user.id) {
      // Sign-in: adopt the account's choice; never overwrite it with the device value.
      synced.current = user.id;
      if (typeof user.calmMode === "boolean" && user.calmMode !== calmMode) {
        previous.current = user.calmMode;
        setCalmMode(user.calmMode);
      }
      return;
    }
    if (changed) apiRequest("PUT", "/api/users/me/calm", { calmMode }).catch(() => {});
  }, [user, calmMode, setCalmMode]);

  return null;
}
