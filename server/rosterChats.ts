import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import type { IStorage } from "./storage";
import type { ZaylistAccess } from "./zaylist";

type Kind = "events" | "places";
type Role = "owner" | "staff" | "promoter" | "talent";
type Mode = "combined" | "separate" | "team" | "off";
type Invite = {
  role: Role;
  state: "pending" | "accepted" | "declined";
  invitedBy: number;
};

export function registerRosterChats(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  auth: RequestHandler,
  accessFor: (event: number, user: number) => ZaylistAccess,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roster_chat_settings (
      kind TEXT NOT NULL, ref INTEGER NOT NULL, mode TEXT NOT NULL,
      PRIMARY KEY(kind,ref));
    CREATE TABLE IF NOT EXISTS roster_chat_invites (
      kind TEXT NOT NULL, ref INTEGER NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL, state TEXT NOT NULL, invited_by INTEGER NOT NULL REFERENCES users(id),
      PRIMARY KEY(kind,ref,user_id));
    CREATE INDEX IF NOT EXISTS roster_chat_invites_user ON roster_chat_invites(user_id,state);
    CREATE TABLE IF NOT EXISTS roster_chat_messages (
      id INTEGER PRIMARY KEY, kind TEXT NOT NULL, ref INTEGER NOT NULL, room TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL, request_key TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(kind,ref,room,user_id,request_key));
    CREATE INDEX IF NOT EXISTS roster_chat_history ON roster_chat_messages(kind,ref,room,id);
  `);
  const base = "/api/hub/roster-chats";
  const active: RequestHandler = (req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    const viewer = storage.getUserById(req.session.userId!);
    if (viewer?.status !== "active") return res.sendStatus(403);
    res.locals.viewer = viewer.id;
    next();
  };
  function snapshot(kind: Kind, id: number, viewer: number) {
    const record =
      kind === "events" ? storage.getEvent(id) : storage.getBusiness(id);
    if (
      !record ||
      ("title" in record ? record.status !== "LIVE" : !record.active)
    )
      return null;
    let role: Role | null = null;
    if (kind === "events") {
      const a = accessFor(id, viewer);
      if (a.isOwner) role = "owner";
      else if (a.fullAccess || a.allowance?.role === "staff") role = "staff";
      else if (a.promoter) role = "promoter";
      else if (a.talent) role = "talent";
    } else if ("ownerId" in record && record.ownerId === viewer) role = "owner";
    const invite = db
      .prepare(
        "SELECT role,state,invited_by AS invitedBy FROM roster_chat_invites WHERE kind=? AND ref=? AND user_id=?",
      )
      .get(kind, id, viewer) as Invite | undefined;
    const invitation =
      invite &&
      storage.getUserById(invite.invitedBy)?.status === "active" &&
      ("ownerId" in record
        ? record.ownerId === invite.invitedBy
        : accessFor(id, invite.invitedBy).isOwner) &&
      !storage.isMemberInteractionBlocked(viewer, invite.invitedBy)
        ? invite
        : undefined;
    const member =
      role || (invitation?.state === "accepted" ? invitation.role : null);
    const mode =
      (
        db
          .prepare(
            "SELECT mode FROM roster_chat_settings WHERE kind=? AND ref=?",
          )
          .get(kind, id) as { mode: Mode } | undefined
      )?.mode ?? (kind === "events" ? "combined" : "off");
    const rooms: string[] = [];
    if (member && mode !== "off") {
      if ((mode === "team" || mode === "separate") && member !== "promoter")
        rooms.push("team");
      if (mode !== "team") rooms.push("combined");
    }
    return {
      title: "title" in record ? record.title : record.name,
      role: member,
      automatic: !!role,
      owner: role === "owner",
      mode,
      rooms,
      pending: !role && invitation?.state === "pending",
    };
  }
  app.get(base + "/mine", auth, active, (_req, res) => {
    const viewer = res.locals.viewer;
    const rows = db
      .prepare(
        "SELECT kind,ref FROM roster_chat_invites WHERE user_id=? AND state IN ('accepted','pending')",
      )
      .all(viewer) as { kind: Kind; ref: number }[];
    const items = rows.flatMap(({ kind, ref }) => {
      const s = snapshot(kind, ref, viewer);
      return s && (s.pending || s.rooms.length)
        ? [{ kind, id: ref, title: s.title, pending: s.pending }]
        : [];
    });
    res.json(items);
  });
  const path = base + "/:kind/:id";
  const access: RequestHandler = (req, res, next) => {
    const kind = req.params.kind,
      id = Number(req.params.id);
    if (
      (kind !== "events" && kind !== "places") ||
      !Number.isSafeInteger(id) ||
      id <= 0
    )
      return res.sendStatus(404);
    const state = snapshot(kind, id, res.locals.viewer);
    if (!state || (!state.role && !state.pending)) return res.sendStatus(404);
    Object.assign(res.locals, { kind, id, state });
    next();
  };
  app.get(path, auth, active, access, (_req, res) => {
    res.json(res.locals.state);
  });
  app.put(path + "/mode", auth, active, access, (req, res) => {
    const { state, kind, id } = res.locals;
    if (!state.owner) return res.sendStatus(403);
    if (!["combined", "separate", "team", "off"].includes(req.body.mode))
      return res.sendStatus(400);
    db.prepare(
      "INSERT INTO roster_chat_settings VALUES(?,?,?) ON CONFLICT(kind,ref) DO UPDATE SET mode=excluded.mode",
    ).run(kind, id, req.body.mode);
    res.sendStatus(204);
  });
  app.post(path + "/invitations", auth, active, access, (req, res) => {
    const { state, kind, id, viewer } = res.locals;
    if (!state.owner) return res.sendStatus(403);
    if (
      !["staff", "talent", "promoter"].includes(req.body.role) ||
      typeof req.body.username !== "string"
    )
      return res.sendStatus(400);
    const person = storage.getUserByUsername(
      req.body.username.trim().replace(/^@/, ""),
    );
    if (
      !person ||
      person.status !== "active" ||
      storage.isMemberInteractionBlocked(viewer, person.id)
    )
      return res.sendStatus(404);
    const existing = snapshot(kind, id, person.id);
    if (existing?.role || existing?.pending)
      return res
        .status(409)
        .json({ error: "Already on this roster or invited." });
    db.prepare(
      `INSERT INTO roster_chat_invites VALUES(?,?,?,?,'pending',?) ON CONFLICT(kind,ref,user_id)
      DO UPDATE SET role=excluded.role,state='pending',invited_by=excluded.invited_by`,
    ).run(kind, id, person.id, req.body.role, viewer);
    res.sendStatus(201);
  });
  app.delete(
    path + "/invitations/:username",
    auth,
    active,
    access,
    (req, res) => {
      const { state, kind, id, viewer } = res.locals;
      const person = storage.getUserByUsername(
        String(req.params.username).replace(/^@/, ""),
      );
      if (!person || (!state.owner && person.id !== viewer))
        return res.sendStatus(403);
      const result = db
        .prepare(
          "DELETE FROM roster_chat_invites WHERE kind=? AND ref=? AND user_id=?",
        )
        .run(kind, id, person.id);
      res.sendStatus(result.changes ? 204 : 404);
    },
  );
  app.put(path + "/respond", auth, active, access, (req, res) => {
    const { kind, id, state, viewer } = res.locals;
    if (!state.pending || typeof req.body.accept !== "boolean")
      return res.sendStatus(400);
    db.prepare(
      "UPDATE roster_chat_invites SET state=? WHERE kind=? AND ref=? AND user_id=? AND state='pending'",
    ).run(req.body.accept ? "accepted" : "declined", kind, id, viewer);
    res.sendStatus(204);
  });
  const member: RequestHandler = (req, res, next) => {
    if (!res.locals.state.rooms.includes(req.params.room))
      return res.sendStatus(403);
    next();
  };
  app.get(path + "/rooms/:room", auth, active, access, member, (req, res) => {
    const { viewer, kind, id } = res.locals;
    const before = Number(req.query.before || Number.MAX_SAFE_INTEGER);
    if (!Number.isSafeInteger(before) || before <= 0)
      return res.sendStatus(400);
    const rows = db
      .prepare(
        `SELECT m.id,m.user_id AS userId,u.username,m.body,m.created_at AS createdAt
      FROM roster_chat_messages m JOIN users u ON u.id=m.user_id WHERE m.kind=? AND m.ref=? AND m.room=? AND m.id<? AND u.status='active'
      ORDER BY m.id DESC LIMIT 100`,
      )
      .all(kind, id, req.params.room, before) as {
      id: number;
      userId: number;
      username: string;
      body: string;
      createdAt: string;
    }[];
    res.json({
      items: rows
        .filter(
          (r) =>
            r.userId === viewer ||
            !storage.isMemberInteractionBlocked(viewer, r.userId),
        )
        .reverse(),
      before: rows.length === 100 ? rows[rows.length - 1].id : null,
    });
  });
  app.post(path + "/rooms/:room", auth, active, access, member, (req, res) => {
    const { kind, id, viewer } = res.locals;
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "",
      key = req.body.requestKey;
    if (
      !body ||
      body.length > 1500 ||
      typeof key !== "string" ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(key)
    )
      return res.sendStatus(400);
    db.prepare(
      "INSERT INTO roster_chat_messages(kind,ref,room,user_id,body,request_key) VALUES(?,?,?,?,?,?) ON CONFLICT(kind,ref,room,user_id,request_key) DO NOTHING",
    ).run(kind, id, req.params.room, viewer, body, key);
    res.sendStatus(204);
  });
}
