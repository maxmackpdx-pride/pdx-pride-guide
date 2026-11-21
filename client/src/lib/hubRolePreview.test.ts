import assert from "node:assert/strict";
import test from "node:test";
import {
  HUB_ROLES,
  hubEventFlagsFor,
  hubLayersFor,
  hubRoleLabel,
  panelPermissionsFor,
  previewEventForRole,
} from "./hubRolePreview";
import type { HostEvent } from "@/components/zaylist/HostCard";

test("the six Night System roles are the preview's roles, in matrix order", () => {
  assert.deepEqual(
    HUB_ROLES.map((r) => r.key),
    ["owner", "full", "promoter", "staff", "talent", "guest"],
  );
  assert.equal(hubRoleLabel("full"), "Full Zay'list Access");
});

test("a guest's hub is the personal layer only — no layer renders", () => {
  assert.deepEqual(hubLayersFor("guest"), {
    pushComposer: false,
    hosting: false,
    venues: false,
    administration: false,
    ownerDesk: false,
  });
});

test("team roles render the composer and hosting, never the owner's layers", () => {
  for (const role of ["full", "promoter", "staff", "talent"] as const) {
    const layers = hubLayersFor(role);
    assert.equal(layers.pushComposer, true, role);
    assert.equal(layers.hosting, true, role);
    assert.equal(layers.venues, false, role);
    assert.equal(layers.administration, false, role);
    assert.equal(layers.ownerDesk, false, role);
  }
  assert.deepEqual(hubLayersFor("owner"), {
    pushComposer: true,
    hosting: true,
    venues: true,
    administration: true,
    ownerDesk: true,
  });
});

test("event flags follow the matrix: edit the list stops at promoter", () => {
  assert.equal(hubEventFlagsFor("owner").canManageList, true);
  assert.equal(hubEventFlagsFor("full").canManageList, true);
  assert.equal(hubEventFlagsFor("promoter").canManageList, true);
  assert.equal(hubEventFlagsFor("staff").canManageList, false);
  assert.equal(hubEventFlagsFor("talent").canManageList, false);
  assert.equal(hubEventFlagsFor("guest").canManageList, false);
});

test("team management (set allowances) is owner and full access only", () => {
  assert.equal(hubEventFlagsFor("owner").canManageTeam, true);
  assert.equal(hubEventFlagsFor("full").canManageTeam, true);
  for (const role of ["promoter", "staff", "talent", "guest"] as const) {
    assert.equal(hubEventFlagsFor(role).canManageTeam, false, role);
  }
});

test("event-details editing belongs to the owner row only", () => {
  assert.equal(hubEventFlagsFor("owner").canEditEvent, true);
  for (const role of ["full", "promoter", "staff", "talent", "guest"] as const) {
    assert.equal(hubEventFlagsFor(role).canEditEvent, false, role);
  }
});

test("panel permissions: allocation is the smallest room", () => {
  assert.equal(panelPermissionsFor("owner").allocator, true);
  assert.equal(panelPermissionsFor("full").allocator, true);
  assert.equal(panelPermissionsFor("promoter").allocator, false);
  assert.equal(panelPermissionsFor("promoter").editor, true);
  assert.equal(panelPermissionsFor("staff").editor, false);
  assert.equal(panelPermissionsFor("talent").editor, false);
  assert.equal(panelPermissionsFor("guest").team, false);
});

test("panel permissions: drinks are a privilege, not a role", () => {
  assert.equal(panelPermissionsFor("owner").canGrantDrinks, true);
  assert.equal(panelPermissionsFor("full").canGrantDrinks, true);
  for (const role of ["promoter", "staff", "talent", "guest"] as const) {
    assert.equal(panelPermissionsFor(role).canGrantDrinks, false, role);
  }
});

test("previewing an event keeps its facts and replaces only role and flags", () => {
  const event = {
    id: 7,
    role: "Owner",
    canEditEvent: true,
    canManageTeam: true,
    canManageList: true,
    metrics: { interested: 3, going: 2, accepted: 1, arrived: 0, pending: 1, drinksServed: 0, gifted: 0 },
    title: "Yes Coach: 3-Year Anniversary",
    venueName: "Sanctuary Club",
    address: null,
    neighborhood: null,
    dateStart: "2026-11-29T18:00:00",
    dateEnd: null,
    admission: null,
    ticketUrl: null,
    description: null,
    posterImageUrl: null,
  } satisfies HostEvent;
  const asStaff = previewEventForRole(event, "staff");
  assert.equal(asStaff.title, event.title);
  assert.deepEqual(asStaff.metrics, event.metrics);
  assert.equal(asStaff.role, "Staff");
  assert.equal(asStaff.canEditEvent, false);
  assert.equal(asStaff.canManageTeam, false);
  assert.equal(asStaff.canManageList, false);
  // The source event is not mutated.
  assert.equal(event.role, "Owner");
  assert.equal(event.canManageList, true);
});
