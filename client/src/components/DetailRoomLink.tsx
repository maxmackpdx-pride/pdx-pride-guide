import { createContext } from "react";

/**
 * A detail sheet opened somewhere other than its room (Mapz) gets one link back
 * to that room. DetailActions reads it; the sheets themselves stay unchanged.
 */
export type DetailRoomLinkValue = { room: string; href: string } | null;
export const DetailRoomLinkContext = createContext<DetailRoomLinkValue>(null);
