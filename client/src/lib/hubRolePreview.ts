import type { HostEvent } from "@/components/zaylist/HostCard";
import type { ZaylistPermissions } from "@/lib/zaylistApi";

/**
 * "See it as…" — the owner-only Hub role preview.
 *
 * The mapping is the Night System permissions matrix (The System, §03)
 * applied to the Hub tree (§02), the same split the shipped build
 * enforces server-side in accessFor:
 *
 * - The push composer sits on top, rendered only for roles holding a
 *   push power in the matrix (everyone but Guest; push itself still
 *   follows the account, §03 Note 3 — the composer self-gates on the
 *   account's real push preview exactly as it does outside preview).
 * - Personal exists for every role, Guest included (§03 Note 4: a
 *   guest's whole hub is their own spot and pass).
 * - Hosting renders for the team roles only. A section a role cannot
 *   use does not render at all — not greyed out, not locked (§02).
 * - Administration and the Owner Desk are the owner's own layers;
 *   no event role below Owner renders them.
 *
 * The preview is view-only simulation: it re-derives what the Hub
 * renders from the role, client-side. It never touches the session,
 * the account, or any server permission, and every mutation inside a
 * previewed surface stays off (see ZaylistPanel's preview guard).
 */

export type HubRole = "owner" | "full" | "promoter" | "staff" | "talent" | "guest";

export const HUB_ROLES: ReadonlyArray<{ key: HubRole; label: string }> = [
  { key: "owner", label: "Owner" },
  { key: "full", label: "Full Zay'list Access" },
  { key: "promoter", label: "Promoter" },
  { key: "staff", label: "Staff" },
  { key: "talent", label: "Talent" },
  { key: "guest", label: "Guest" },
];

export function hubRoleLabel(role: HubRole): string {
  return HUB_ROLES.find((r) => r.key === role)?.label ?? role;
}

/** Which Hub layers render at all for a role (§02 tree). */
export interface HubLayers {
  /** Top of the tree: rendered only for accounts holding push permission. */
  pushComposer: boolean;
  /** "Working the night" — the team rail. */
  hosting: boolean;
  /** The account's own venues — an owner-layer surface, not an event role's. */
  venues: boolean;
  /** Site administration section. */
  administration: boolean;
  /** Owner desk section. */
  ownerDesk: boolean;
}

export function hubLayersFor(role: HubRole): HubLayers {
  switch (role) {
    case "owner":
      return { pushComposer: true, hosting: true, venues: true, administration: true, ownerDesk: true };
    case "full":
    case "promoter":
    case "staff":
    case "talent":
      return { pushComposer: true, hosting: true, venues: false, administration: false, ownerDesk: false };
    case "guest":
      return { pushComposer: false, hosting: false, venues: false, administration: false, ownerDesk: false };
  }
}

/**
 * The capability flags one workspace event carries for a viewer whose
 * role on the event is the previewed role, mirroring how the workspace
 * endpoint derives them from accessFor:
 *
 * - canManageList is the matrix's "Edit the list" (the shipped editor:
 *   owner, full access, promoter).
 * - canManageTeam carries the allocation-side powers (the matrix's
 *   "Set allowances": owner and full access only).
 * - canEditEvent is event-details editing, a host power; in the matrix
 *   it belongs to the Owner row — promoters edit the list, not the
 *   event, and full access delegates the allocation calls, not the
 *   event's own details.
 * - role is the card's role label, in the matrix's own names.
 */
export interface HubEventFlags {
  canEditEvent: boolean;
  canManageTeam: boolean;
  canManageList: boolean;
  role: string;
}

export function hubEventFlagsFor(role: HubRole): HubEventFlags {
  switch (role) {
    case "owner":
      return { canEditEvent: true, canManageTeam: true, canManageList: true, role: "Owner" };
    case "full":
      return { canEditEvent: false, canManageTeam: true, canManageList: true, role: "Full Zay'list Access" };
    case "promoter":
      return { canEditEvent: false, canManageTeam: false, canManageList: true, role: "Promoter" };
    case "staff":
      return { canEditEvent: false, canManageTeam: false, canManageList: false, role: "Staff" };
    case "talent":
      return { canEditEvent: false, canManageTeam: false, canManageList: false, role: "Talent" };
    case "guest":
      return { canEditEvent: false, canManageTeam: false, canManageList: false, role: "Guest" };
  }
}

/** One workspace event as the previewed role sees it on its card. */
export function previewEventForRole(event: HostEvent, role: HubRole): HostEvent {
  return { ...event, ...hubEventFlagsFor(role) };
}

export function previewEventsForRole(events: HostEvent[], role: HubRole): HostEvent[] {
  return events.map((event) => previewEventForRole(event, role));
}

/**
 * The Zay'list panel permissions for the previewed role (§03 matrix).
 * Partial powers follow the notes: allocate is partial for promoter,
 * staff and talent (they add from their own allowance — the preview
 * carries an unassigned allowance, so the add form renders the way it
 * does for an allowance holder), and granting drinks is an assigned
 * privilege, not a role, so no role below the allocators carries it
 * in preview.
 */
export function panelPermissionsFor(role: HubRole): ZaylistPermissions {
  switch (role) {
    case "owner":
      return { isOwner: true, team: true, editor: true, allocator: true, canGrantDrinks: true, allowance: null };
    case "full":
      return { isOwner: false, team: true, editor: true, allocator: true, canGrantDrinks: true, allowance: null };
    case "promoter":
      return {
        isOwner: false, team: true, editor: true, allocator: false, canGrantDrinks: false,
        allowance: { role: "promoter", spots: 0, used: 0 },
      };
    case "staff":
      return {
        isOwner: false, team: true, editor: false, allocator: false, canGrantDrinks: false,
        allowance: { role: "staff", spots: 0, used: 0 },
      };
    case "talent":
      return {
        isOwner: false, team: true, editor: false, allocator: false, canGrantDrinks: false,
        allowance: { role: "talent", spots: 0, used: 0 },
      };
    case "guest":
      return { isOwner: false, team: false, editor: false, allocator: false, canGrantDrinks: false, allowance: null };
  }
}
