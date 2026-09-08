import session from "express-session";
import type Database from "better-sqlite3";
import { BetterSqliteSessionStore } from "./sessionStore";

/** HTTPS in production; plain http://127.0.0.1 preview (LOCAL_PREVIEW=1) must not set Secure cookies. */
export function productionSecureCookies(): boolean {
  return process.env.NODE_ENV === "production" && process.env.LOCAL_PREVIEW !== "1";
}

export function createSessionMiddleware(sqlite: Database.Database) {
  return session({
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET env var is required in production"); })() : "pdxpride_secret_dev_only"),
    store: new BetterSqliteSessionStore(sqlite),
    proxy: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: productionSecureCookies(),
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });
}
