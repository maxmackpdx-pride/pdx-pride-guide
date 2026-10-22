#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const KEYCHAIN_ACCOUNT = "qsearch-3";
const KEYCHAIN_SERVICE = "zaylist-qsearch-agent-api";
const PAIRING_SERVICE = "zaylist-qsearch-agent-pairing";
const baseUrl = String(process.env.QSEARCH_API_BASE_URL || "https://www.zaylist.com")
  .trim()
  .replace(/\/$/, "");

function readToken() {
  if (process.platform === "darwin") {
    try { return readKeychain(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT); } catch { /* continue */ }
  }
  const fromEnv = String(process.env.QSEARCH_AGENT_TOKEN || "").trim();
  if (fromEnv) return fromEnv;
  if (process.platform === "darwin") {
    try { return readKeychain(KEYCHAIN_SERVICE, "qsearch-2"); } catch { /* legacy fallback */ }
  }
  throw new Error(
    "QSearch is not paired. Run 'node script/qsearch-agent-api.mjs pair-start', approve its code in Zaylist Admin, then run 'pair-complete'.",
  );
}

function readKeychain(service, account) {
  return execFileSync("/usr/bin/security", ["find-generic-password", "-a", account, "-s", service, "-w"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function writeKeychain(service, account, secret) {
  if (process.platform !== "darwin") throw new Error("Owner pairing currently requires macOS Keychain.");
  // With -w last, security prompts twice on stdin; the secret is never an argv value.
  execFileSync("/usr/bin/security", ["add-generic-password", "-a", account, "-s", service, "-U", "-w"],
    { input: `${secret}\n${secret}\n`, stdio: ["pipe", "ignore", "pipe"], timeout: 15_000 });
}

function deleteKeychain(service, account) {
  execFileSync("/usr/bin/security", ["delete-generic-password", "-a", account, "-s", service],
    { stdio: ["ignore", "ignore", "ignore"] });
}

async function unauthenticatedRequest(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok && response.status !== 202) throw new Error(`${response.status}: ${payload?.error || "Pairing failed"}`);
  return payload;
}

function jsonInput(raw) {
  const text = raw === "-" ? readFileSync(0, "utf8") : String(raw || "");
  if (!text.trim()) throw new Error("A JSON payload is required.");
  return JSON.parse(text);
}

async function request(method, path, body) {
  const token = readToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { error: text || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    const message = payload?.error || `HTTP ${response.status}`;
    if (response.status === 401) {
      throw new Error("401: QSearch credential rejected; stop production writes and report the access failure.");
    }
    throw new Error(`${response.status}: ${message}`);
  }
  return payload;
}

function usage() {
  return [
    "QSearch 3 scoped API client",
    "",
    "Commands:",
    "  pair-start        Ask the owner to approve a short code in Zaylist Admin",
    "  pair-complete     Finish pairing and save access in macOS Keychain",
    "  source-memory",
    "  control",
    "  events [from-date]",
    "  changes [limit]",
    "  begin-run [json|-]",
    "  mark-source <run-id> <json|->",
    "  schedule-source <json|->",
    "  finish-run <run-id> <json|->",
    "  record-evidence <json|->",
    "  upsert-identity <json|->",
    "  record-conflict <json|->",
    "  queue-review <json|->",
    "  record-media <json|->",
    "  upsert-mistake-test <json|->",
    "  record-mistake-result <json|->",
    "  decision-gate <json|->",
    "  upsert-series <json|->",
    "  record-outcome <json|->",
    "  resolve-item <json|->",
    "  record-path <json|->",
    "  upload-poster <local-image-path>",
    "  create-event <json|->",
    "  change-event <event-id> <json|->",
    "  rollback <rollback-token>",
  ].join("\n");
}

async function main() {
  const [command, first, second] = process.argv.slice(2);
  let payload;
  switch (command) {
    case "pair-start": {
      if (process.platform !== "darwin") throw new Error("Pairing currently requires macOS Keychain.");
      payload = await unauthenticatedRequest("/api/admin/event-research/pairing/start", {});
      writeKeychain(PAIRING_SERVICE, KEYCHAIN_ACCOUNT, JSON.stringify({ id: payload.id, claimSecret: payload.claimSecret }));
      payload = { displayCode: payload.displayCode, expiresAt: payload.expiresAt,
        next: "Approve this code in Zaylist Admin > Team, then run pair-complete." };
      break;
    }
    case "pair-complete": {
      const pending = JSON.parse(readKeychain(PAIRING_SERVICE, KEYCHAIN_ACCOUNT));
      const result = await unauthenticatedRequest("/api/admin/event-research/pairing/redeem", pending);
      if (result.status === "pending") { payload = { status: "pending", next: "Owner approval is still needed." }; break; }
      writeKeychain(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, result.token);
      deleteKeychain(PAIRING_SERVICE, KEYCHAIN_ACCOUNT);
      payload = { status: "paired", credentialId: result.credentialId };
      break;
    }
    case "source-memory":
      payload = await request("GET", "/api/admin/event-research/source-memory");
      break;
    case "control":
      payload = await request("GET", "/api/admin/event-research/control");
      break;
    case "events": {
      const query = first ? `?from=${encodeURIComponent(first)}` : "";
      payload = await request("GET", `/api/admin/event-research/events${query}`);
      break;
    }
    case "changes": {
      const limit = first ? `?limit=${encodeURIComponent(first)}` : "";
      payload = await request("GET", `/api/admin/event-research/changes${limit}`);
      break;
    }
    case "begin-run":
      payload = await request("POST", "/api/admin/event-research/runs", first ? jsonInput(first) : {});
      break;
    case "mark-source":
      if (!first) throw new Error("A run id is required.");
      payload = await request("POST", `/api/admin/event-research/runs/${encodeURIComponent(first)}/source`, jsonInput(second));
      break;
    case "schedule-source":
      payload = await request("POST", "/api/admin/event-research/source-memory/schedule", jsonInput(first));
      break;
    case "finish-run":
      if (!first) throw new Error("A run id is required.");
      payload = await request("POST", `/api/admin/event-research/runs/${encodeURIComponent(first)}/finish`, jsonInput(second));
      break;
    case "record-evidence":
      payload = await request("POST", "/api/admin/event-research/evidence", jsonInput(first));
      break;
    case "upsert-identity":
      payload = await request("POST", "/api/admin/event-research/identities", jsonInput(first));
      break;
    case "record-conflict":
      payload = await request("POST", "/api/admin/event-research/conflicts", jsonInput(first));
      break;
    case "queue-review":
      payload = await request("POST", "/api/admin/event-research/review", jsonInput(first));
      break;
    case "record-media":
      payload = await request("POST", "/api/admin/event-research/media", jsonInput(first));
      break;
    case "upsert-mistake-test":
      payload = await request("POST", "/api/admin/event-research/mistake-tests", jsonInput(first));
      break;
    case "record-mistake-result":
      payload = await request("POST", "/api/admin/event-research/mistake-tests/result", jsonInput(first));
      break;
    case "decision-gate":
      payload = await request("POST", "/api/admin/event-research/decision-gate", jsonInput(first));
      break;
    case "upsert-series":
      payload = await request("POST", "/api/admin/event-research/series", jsonInput(first));
      break;
    case "record-outcome":
      payload = await request("POST", "/api/admin/event-research/outcomes", jsonInput(first));
      break;
    case "resolve-item":
      payload = await request("POST", "/api/admin/event-research/resolve", jsonInput(first));
      break;
    case "record-path":
      payload = await request(
        "POST",
        "/api/admin/event-research/source-memory/path",
        jsonInput(first),
      );
      break;
    case "upload-poster": {
      if (!first) throw new Error("A local poster path is required.");
      const ext = path.extname(first).toLowerCase();
      const mime = ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" })[ext];
      if (!mime) throw new Error("Poster must be JPG, PNG, GIF, or WebP.");
      const body = new FormData();
      body.set("poster", new Blob([readFileSync(first)], { type: mime }), path.basename(first));
      const response = await fetch(`${baseUrl}/api/admin/event-research/poster`, {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: { Authorization: `Bearer ${readToken()}`, Accept: "application/json" },
        body,
      });
      payload = await response.json();
      if (!response.ok) throw new Error(`${response.status}: ${payload?.error || "Poster upload failed"}`);
      break;
    }
    case "create-event":
      payload = await request(
        "POST",
        "/api/admin/event-research/events",
        jsonInput(first),
      );
      break;
    case "change-event": {
      const eventId = Number(first);
      if (!Number.isInteger(eventId) || eventId <= 0) throw new Error("A valid event id is required.");
      payload = await request(
        "POST",
        `/api/admin/event-research/events/${eventId}/change`,
        jsonInput(second),
      );
      break;
    }
    case "rollback":
      if (!first) throw new Error("A rollback token is required.");
      payload = await request(
        "POST",
        `/api/admin/event-research/changes/${encodeURIComponent(first)}/rollback`,
        { confirm: true },
      );
      break;
    default:
      process.stdout.write(`${usage()}\n`);
      process.exitCode = command ? 1 : 0;
      return;
  }
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main().catch(error => {
  process.stderr.write(`QSearch API request failed: ${error.message}\n`);
  process.exitCode = 1;
});
