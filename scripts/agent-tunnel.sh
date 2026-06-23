#!/usr/bin/env bash
# Agent tunnel — async message bus for Grok, Codex, Claude, Tucker
# Not a live socket; poll with: ./scripts/agent-tunnel.sh poll grok
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUS_FILE="AGENT_TUNNEL.jsonl"
BUS_PATH="$REPO_DIR/$BUS_FILE"
TOKEN_FILE="${GITHUB_TOKEN_FILE:-$HOME/.pdx-pride-guide-github-token}"

usage() {
  cat <<'EOF'
Usage:
  agent-tunnel.sh send <from> <to> <message...>   Append a message and push
  agent-tunnel.sh poll <for> [--all]              Show unread messages (pulls first)
  agent-tunnel.sh ack <id> <reader>               Mark message read
  agent-tunnel.sh status                          Show last 5 messages

Agents: grok | codex | claude | tucker | all

Examples:
  ./scripts/agent-tunnel.sh send grok codex "Phase 1 is live on master"
  ./scripts/agent-tunnel.sh poll codex
  ./scripts/agent-tunnel.sh ack 2026-06-23T12:00:00Z-grok-1 codex
EOF
}

sync_pull() {
  git -C "$REPO_DIR" pull --rebase origin master >/dev/null 2>&1 || git -C "$REPO_DIR" pull origin master >/dev/null 2>&1 || true
}

sync_push() {
  git -C "$REPO_DIR" add "$BUS_FILE"
  if git -C "$REPO_DIR" diff --cached --quiet; then
    return 0
  fi
  git -C "$REPO_DIR" commit -m "tunnel: agent message bus update"
  git -C "$REPO_DIR" push origin master
}

new_id() {
  printf '%s-%s-%s' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$RANDOM"
}

cmd_send() {
  local from="$1" to="$2"
  shift 2
  local body="$*"
  sync_pull
  touch "$BUS_PATH"
  local id
  id="$(new_id "$from")"
  python3 - "$id" "$from" "$to" "$body" "$BUS_PATH" <<'PY'
import json, sys
msg_id, sender, recipient, body, path = sys.argv[1:6]
entry = {
    "id": msg_id,
    "from": sender,
    "to": recipient,
    "ts": msg_id.split("-")[0] if "-" in msg_id else "",
    "body": body,
    "read_by": []
}
with open(path, "a", encoding="utf-8") as f:
    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(json.dumps(entry, indent=2))
PY
  sync_push
  echo "→ pushed to master ($BUS_FILE)"
}

cmd_poll() {
  local for_agent="$1"
  local show_all="${2:-}"
  sync_pull
  [[ -f "$BUS_PATH" ]] || { echo "(no messages yet)"; return 0; }
  python3 - "$for_agent" "$show_all" "$BUS_PATH" <<'PY'
import json, sys
agent, show_all, path = sys.argv[1:4]
msgs = []
with open(path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            msgs.append(json.loads(line))
        except json.JSONDecodeError:
            continue
unread = []
for m in msgs:
    to = m.get("to", "")
    readers = m.get("read_by", [])
    if show_all == "--all":
        if to in (agent, "all"):
            unread.append(m)
    elif to in (agent, "all") and agent not in readers:
        unread.append(m)
if not unread:
    print(f"(no unread for {agent})")
else:
    for m in unread:
        print(f"[{m['id']}] {m.get('from','?')} → {m.get('to','?')}: {m.get('body','')}")
PY
}

cmd_ack() {
  local id="$1" reader="$2"
  sync_pull
  python3 - "$id" "$reader" "$BUS_PATH" <<'PY'
import json, sys
msg_id, reader, path = sys.argv[1:4]
lines = []
found = False
with open(path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        m = json.loads(line)
        if m.get("id") == msg_id:
            rb = m.setdefault("read_by", [])
            if reader not in rb:
                rb.append(reader)
            found = True
        lines.append(json.dumps(m, ensure_ascii=False))
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + ("\n" if lines else ""))
print("acked" if found else "id not found")
PY
  sync_push
}

cmd_status() {
  sync_pull
  [[ -f "$BUS_PATH" ]] || { echo "(empty bus)"; return 0; }
  tail -5 "$BUS_PATH" | python3 -c "
import json, sys
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    m = json.loads(line)
    print(f\"{m.get('id','?')[:19]} {m.get('from')}→{m.get('to')}: {m.get('body','')[:80]}\")
"
}

main() {
  cd "$REPO_DIR"
  case "${1:-}" in
    send)   [[ $# -ge 4 ]] || { usage; exit 1; }; cmd_send "$2" "$3" "${@:4}" ;;
    poll)   [[ $# -ge 2 ]] || { usage; exit 1; }; cmd_poll "$2" "${3:-}" ;;
    ack)    [[ $# -ge 3 ]] || { usage; exit 1; }; cmd_ack "$2" "$3" ;;
    status) cmd_status ;;
    -h|--help|help|"") usage ;;
    *) echo "Unknown command: $1"; usage; exit 1 ;;
  esac
}

main "$@"