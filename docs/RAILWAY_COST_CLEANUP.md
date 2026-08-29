# Railway cost cleanup

State: prepared locally; not deployed

This cleanup preserves the live UI and normal admin flows. Its first purpose is
to ensure that only the primary production service owns scheduled background
work and that legacy poster repair does not run after every application start.

## Runtime controls

| Variable | Default | Purpose |
| --- | --- | --- |
| `BACKGROUND_JOBS` | Primary production on; staging/dev/preview off | Explicitly override ownership of scheduled jobs |
| `QSEARCH_NIGHTLY` | Follows background-job ownership | Explicitly enable or disable nightly QSearch |
| `POSTER_MIRROR_ON_START` | Off | Run the legacy remote-poster backfill once after startup |
| `MEMORY_DIAGNOSTICS` | Off | Log RSS, heap, external, and ArrayBuffer memory every 15 minutes |

New event ingestion already captures full-quality remote posters when possible.
`POSTER_MIRROR_ON_START` exists only to repair older records and should be
enabled for a controlled maintenance deployment, then disabled again.

## Infrastructure steps after Railway access is restored

1. Keep the production service and `/data` volume untouched.
2. Confirm staging has `BACKGROUND_JOBS=0` and `QSEARCH_NIGHTLY=0`.
3. Stop staging when no review is in progress; retain its volume until Tucker
   confirms whether the data is disposable.
4. Enable `MEMORY_DIAGNOSTICS=1` temporarily in production, observe at least one
   idle window and one QSearch run, then disable it.
5. Move legacy-domain redirects to the existing Cloudflare zone. GoDaddy is the
   registrar, but Cloudflare is authoritative DNS; do not switch nameservers.
6. Verify apex and `www` redirects preserve the path and query string before
   removing either Railway redirect service.
7. Remove redirect services one at a time, verifying all old domains between
   removals.

Never delete the production or staging volumes as part of this cleanup.

