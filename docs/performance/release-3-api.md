# Release 3 public event feed computation cache

Status: local validation complete; publication and live verification pending. Base: `3a63fc4279005617c1ed79a19a8da5e5c5a6baad`, the verified Node 24 release plus report-only descendant.

## Changes and compatibility

The existing `/api/events` handler now uses one bounded, session-independent canonical computation cache. The default remains the full array, preserving historical events, multi-day expansion, deduplication, order and public field shaping. Day matching retains its original behavior; malformed non-string day values remain ignored.

Optional `limit` and `offset` are now honored. They must be non-negative digit strings and safe integers; an explicit limit cannot exceed 500. Invalid pagination returns 400. With no limit, the default is unchanged. Filtering by day precedes slicing. There is no cache entry per query string.

Only explicitly public rows are retained. Private/nonpublic/unknown-flag rows and oversized results bypass retention without silently changing existing listing visibility. Detail, admin and personalized endpoints are outside the cache. Serialized retained JSON is capped at 8 MiB and expires after 30 seconds; this is not a cap on all transient process memory. JSON parsing gives each caller an independent result.

Connection-local TEMP triggers track event, business, submission claim, talent and relevant user changes. `PRAGMA data_version` conservatively detects all other-connection commits. Ordinary sessions use the same shared SQLite handle and do not invalidate through unrelated local session writes. No persistent tables, schema migrations or production-volume changes are introduced.

Async enrichment still yields after each eight rows. Revision checks, bounded retries and coalescing detect edits/hides during computation and revalidate before the cache returns its snapshot. Writes after the final synchronous revision check can still make an in-flight response historical; this is not a guarantee through network delivery or a cross-process subscription. Open transactions are rejected with retryable 503 rather than caching uncommitted data; rolled-back revision reuse and user-ID join invalidation have explicit regression tests. Controlled teardown removes TEMP objects; disposal is safe even if the database connection has already closed.

## HTTP behavior

- Normal public response: `Cache-Control: private, no-cache` with existing ETag validation.
- Bypass/private response: `Cache-Control: private, no-store`.
- `X-Event-Feed-Cache` reports only HIT, MISS or BYPASS; it exposes no database revision or user information.
- Unstable data/open transaction: 503, private/no-store, Retry-After 1.
- Invalid pagination: 400, private/no-store.
- No shared CDN response cache or blanket API cache was added.

Cloudflare already delivered gzip-compressed responses before this release. Compression is not claimed as a new benefit. A genuine conditional HTTP request still returns 304; a client explicitly requiring no-cache correctly receives a fresh 200. Node fetch's automatic conditional-request headers were independently diagnosed, and the validator test uses raw HTTP rather than weakening the 304 assertion.

## Verification

- 49 isolated SQLite cache tests pass.
- Six actual production-handler HTTP tests pass, including an independent legacy-output oracle, full JSON equivalence, historical/multi-day/deduplication/privacy fields, dependency changes, private bypass, pagination, raw ETag/304, forced no-cache 200, external updates and an actual asynchronous hide race.
- The hide-race test uses three simultaneous requests and verifies exactly two builds: the invalidated original and its retry.
- The optional benchmark also passes: 56 combined tests when enabled, or 55 pass plus one explicit benchmark skip.
- Full updated CI unit selection: 126 pass plus the opt-in benchmark skip. Both new test files are included in the workflow.
- Independent source review and an independent Node 24 module/HTTP rerun passed.
- Typecheck, final predeploy, full production build and deployment-bundle verification passed.
- All 252 client JavaScript/CSS files matched the prior release in the final build; no frontend source was changed.

## Controlled timing evidence

Same immutable synthetic fixture, Node 24.22.2, local HTTP, 1,406 output rows. Four observations per legacy, warm and one-event path; one cold-cache observation. This is a small controlled sample, not a production SLA or a physical-phone measurement.

| Path | Median time | Response bytes | Rows |
| --- | ---: | ---: | ---: |
| Independent legacy handler | 36.41 ms | 1,362,579 | 1,406 |
| Cache miss (one observation) | 38.53 ms | 1,362,579 | 1,406 |
| Warm cache | 10.93 ms | 1,362,579 | 1,406 |
| Warm limit=1 | 3.83 ms | 749 | 1 |

Legacy and full cached JSON are deeply equal with identical response bytes. Warm median is about 70% lower in this fixture; no cold-path speed improvement is claimed. Event-loop histogram values in the raw artifact are short-window diagnostics, not reliable long-run percentile estimates.

[Benchmark samples](releases/release-3/benchmark.json). [Live pre-release curl samples](releases/release-3/live-before.json) are separately recorded and dominated by cloud proxy/TLS overhead; do not compare their totals directly with this loopback benchmark.

## Publication gate

Verify the exact intended tree, publish through GitHub master, require core CI and Railway verification, then probe live default/paginated output, cache diagnostics, conditional responses and runtime identity. Do not mutate production events just to test invalidation; those mutations are tested against disposable local databases. Retain the earlier physical Safari/GPU and external-network measurement limitations.
