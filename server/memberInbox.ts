import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";

type Mailbox = "personal" | "guide";
type ReceiptKind = "desk" | "appeal";

export function createMemberInbox(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member_thread_archives (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mailbox TEXT NOT NULL, thread_id TEXT NOT NULL, archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, mailbox, thread_id)
    );
    CREATE TABLE IF NOT EXISTS member_report_receipts (
      id INTEGER PRIMARY KEY, kind TEXT NOT NULL, case_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(kind, case_id)
    );
    CREATE INDEX IF NOT EXISTS idx_member_report_receipts_user ON member_report_receipts(user_id, id);
    CREATE TABLE IF NOT EXISTS member_report_replies (
      id INTEGER PRIMARY KEY, receipt_id INTEGER NOT NULL REFERENCES member_report_receipts(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, author TEXT NOT NULL,
      body TEXT NOT NULL, request_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(receipt_id, sender_id, request_id)
    );
  `);
  const receiptSelect = `SELECT r.id, r.kind, r.case_id AS caseId, r.user_id AS userId, r.subject,
    r.created_at AS createdAt, CASE WHEN r.kind='appeal' THEN m.status ELSE d.status END AS status
    FROM member_report_receipts r
    LEFT JOIN owner_desk_items d ON r.kind='desk' AND r.case_id=d.id
    LEFT JOIN moderation_requests m ON r.kind='appeal' AND r.case_id=m.id`;
  type Receipt = {
    id: number;
    kind: ReceiptKind;
    caseId: number;
    userId: number;
    subject: string;
    createdAt: string;
    status: string;
  };
  return {
    archiveIds(userId: number, mailbox: Mailbox) {
      return (
        db
          .prepare(
            "SELECT thread_id AS id FROM member_thread_archives WHERE user_id=? AND mailbox=?",
          )
          .all(userId, mailbox) as { id: string }[]
      ).map((row) => row.id);
    },
    unreadThreads(viewerId: number, archiveOwnerId: number, mailbox: Mailbox) {
      const row = db
        .prepare(
          `SELECT COUNT(*) AS count FROM messages m
        JOIN (SELECT MAX(id) AS id FROM messages WHERE to_user_id=? AND deleted_by_to=0 GROUP BY thread_id) latest ON latest.id=m.id
        WHERE m.is_read=0 AND NOT EXISTS (
          SELECT 1 FROM member_thread_archives a WHERE a.user_id=? AND a.mailbox=? AND a.thread_id=m.thread_id
        ) AND NOT EXISTS (
          SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=m.from_user_id AND b.blocked_user_id=m.to_user_id)
          OR (b.blocker_user_id=m.to_user_id AND b.blocked_user_id=m.from_user_id)
        )`,
        )
        .get(viewerId, archiveOwnerId, mailbox) as { count: number };
      return row.count;
    },
    setArchived(
      userId: number,
      mailbox: Mailbox,
      threadId: string,
      archived: boolean,
    ) {
      if (archived)
        db.prepare(
          "INSERT OR IGNORE INTO member_thread_archives(user_id,mailbox,thread_id) VALUES(?,?,?)",
        ).run(userId, mailbox, threadId);
      else
        db.prepare(
          "DELETE FROM member_thread_archives WHERE user_id=? AND mailbox=? AND thread_id=?",
        ).run(userId, mailbox, threadId);
    },
    addReceipt(
      kind: ReceiptKind,
      caseId: number,
      userId: number,
      subject: string,
    ) {
      return Number(
        db
          .prepare(
            "INSERT INTO member_report_receipts(kind,case_id,user_id,subject) VALUES(?,?,?,?)",
          )
          .run(kind, caseId, userId, subject).lastInsertRowid,
      );
    },
    memberReceipts(userId: number, onlyAppeals: boolean) {
      return db
        .prepare(
          receiptSelect +
            " WHERE r.user_id=? AND (?=0 OR r.kind='appeal') ORDER BY r.id DESC",
        )
        .all(userId, Number(onlyAppeals)) as Receipt[];
    },
    memberReceipt(id: number, userId: number) {
      return db
        .prepare(receiptSelect + " WHERE r.id=? AND r.user_id=?")
        .get(id, userId) as Receipt | undefined;
    },
    deskReceipt(caseId: number) {
      return db
        .prepare(receiptSelect + " WHERE r.kind='desk' AND r.case_id=?")
        .get(caseId) as Receipt | undefined;
    },
    replies(id: number) {
      return db
        .prepare(
          "SELECT id,author,body,created_at AS createdAt FROM member_report_replies WHERE receipt_id=? ORDER BY id",
        )
        .all(id);
    },
    addReply(
      id: number,
      sender: number,
      author: "owner" | "member",
      body: string,
      requestId: string,
    ) {
      db.prepare(
        "INSERT INTO member_report_replies(receipt_id,sender_id,author,body,request_id) VALUES(?,?,?,?,?) ON CONFLICT(receipt_id,sender_id,request_id) DO NOTHING",
      ).run(id, sender, author, body, requestId);
    },
  };
}

export function registerMemberInbox(
  app: Express,
  db: Database.Database,
  auth: RequestHandler,
  admin: RequestHandler,
  owner: RequestHandler,
  guideAccount: () => number | undefined,
) {
  const store = createMemberInbox(db);
  const visibleThread =
    db.prepare(`SELECT 1 FROM messages m WHERE m.thread_id=@thread AND
    ((m.to_user_id=@viewer AND m.deleted_by_to=0) OR (m.from_user_id=@viewer AND m.deleted_by_from=0))
    AND NOT EXISTS (SELECT 1 FROM member_blocks b WHERE
      (b.blocker_user_id=m.from_user_id AND b.blocked_user_id=m.to_user_id) OR
      (b.blocker_user_id=m.to_user_id AND b.blocked_user_id=m.from_user_id)) LIMIT 1`);
  for (const mailbox of ["personal", "guide"] as const) {
    const base =
      mailbox === "personal"
        ? "/api/messages/archive"
        : "/api/admin/messages/archive";
    const guards = mailbox === "personal" ? [auth] : [auth, admin];
    const write: RequestHandler = (req, res) => {
      const userId = req.session.userId!;
      const viewer = mailbox === "personal" ? userId : guideAccount();
      const thread = String(req.params.threadId);
      if (!viewer || !visibleThread.get({ viewer, thread })) {
        res.status(404).json({ error: "Conversation unavailable" });
        return;
      }
      store.setArchived(userId, mailbox, thread, req.method === "PUT");
      res.json({ archived: req.method === "PUT" });
    };
    app.get(base, ...guards, (req, res) => {
      res
        .set("Cache-Control", "private, no-store")
        .json(store.archiveIds(req.session.userId!, mailbox));
    });
    app.post(base + "/import", ...guards, (req, res) => {
      const userId = req.session.userId!,
        viewer = mailbox === "personal" ? userId : guideAccount();
      const ids: unknown = req.body?.ids;
      if (
        !viewer ||
        !Array.isArray(ids) ||
        ids.length > 100 ||
        ids.some((id) => typeof id !== "string" || id.length > 256)
      ) {
        return res.status(400).json({ error: "Invalid archive selection" });
      }
      const imported = db.transaction(() =>
        ids
          .filter((thread) => visibleThread.get({ viewer, thread }))
          .map((thread) => {
            store.setArchived(userId, mailbox, thread, true);
            return thread;
          }),
      )();
      res.json({ imported });
    });
    app.put(base + "/:threadId", ...guards, write);
    app.delete(base + "/:threadId", ...guards, write);
  }

  app.get("/api/me/report-receipts", auth, (req, res) => {
    res
      .set("Cache-Control", "private, no-store")
      .json(
        store
          .memberReceipts(req.session.userId!, false)
          .map(({ userId, ...receipt }) => receipt),
      );
  });
  app.get("/api/auth/suspension-appeal/receipts", auth, (req, res) => {
    res
      .set("Cache-Control", "private, no-store")
      .json(
        store
          .memberReceipts(req.session.userId!, true)
          .map(({ userId, ...receipt }) => receipt),
      );
  });
  for (const actor of ["member", "owner"] as const) {
    const url =
      actor === "member"
        ? "/api/me/report-receipts/:id/conversation"
        : "/api/admin/owner-desk/:id/conversation";
    const guards = actor === "member" ? [auth] : [auth, admin, owner];
    const access: RequestHandler = (req, res) => {
      const id = Number(req.params.id);
      const receipt =
        actor === "member"
          ? store.memberReceipt(id, req.session.userId!)
          : store.deskReceipt(id);
      if (!receipt || receipt.kind !== "desk") {
        res.status(404).json({ error: "Conversation unavailable" });
        return;
      }
      if (req.method === "POST") {
        const body =
          typeof req.body?.body === "string" ? req.body.body.trim() : "";
        const requestId = String(req.body?.requestId || "");
        if (
          !body ||
          body.length > 2000 ||
          !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)
        ) {
          res
            .status(400)
            .json({ error: "Enter a reply of up to 2,000 characters." });
          return;
        }
        if (receipt.status !== "OPEN") {
          res.status(409).json({ error: "This report has been resolved." });
          return;
        }
        store.addReply(receipt.id, req.session.userId!, actor, body, requestId);
      }
      res
        .set("Cache-Control", "private, no-store")
        .json({
          subject: receipt.subject,
          status: receipt.status,
          replies: store.replies(receipt.id),
        });
    };
    app.get(url, ...guards, access);
    app.post(url, ...guards, access);
  }
  return store;
}
