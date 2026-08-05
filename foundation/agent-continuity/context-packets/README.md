# Context packets

Create one JSON packet per bounded handoff. Use the schema in `../schemas/context-packet.schema.json`.

Filename: `YYYY-MM-DDTHHMMSSZ-from-to-topic.json`

Packets expire when their canonical release, production evidence commit, owner direction, or explicit expiry no longer matches current context. A stale packet may be historical evidence but must not drive new work.
