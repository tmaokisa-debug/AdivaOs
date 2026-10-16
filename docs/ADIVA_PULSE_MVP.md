# Adiva Pulse MVP: Evidence-First Implementation

**Status:** IN PROGRESS — audit/design committed; UI integration not yet verified  
**Date:** 2026-10-16  
**Branch:** `feature/adiva-pulse-mvp`

## Objective

Add a mobile-first operational view to the existing AdivaOs/Paperclip UI. Reuse current UI, API, host monitors, AdivaOS Core event stream, and governance. Do not introduce a second application, database, scheduler, task queue, agent registry, or monitoring stack.

## Repository evidence inspected

- Root `package.json`: Paperclip monorepo; pnpm 9.15.4; Node >=20; scripts include `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`, and Playwright E2E tests.
- Root `README.md`: identifies this as a Paperclip server + React UI with an API, dashboard, agent/task orchestration, activity history, governance, and plugin system.
- `adivaos-core/runtime/paperclip_bridge.py`: reads `PAPERCLIP_API_URL` (default `http://127.0.0.1:3100`), API key/company/agent/run IDs from environment; has GET helpers and syncs pending Paperclip issues to the existing `world_state/task_queue.json`. It can also PATCH issue status/comments, so Pulse's initial integration must remain GET/read-only.
- `adivaos-core/runtime/logger.py`: append-only JSONL event stream at `event_stream/events.jsonl`; UTC timestamps, event ID, status, run/correlation IDs, evidence refs, duration, retry count and verification fields. Its docstring explicitly says live integration testing is still needed.
- `adivaos-core/docs/operations/GAP_TO_CAPABILITY_LOOP_v1.md`: reuse existing registries, event stream, Drive for canonical durable records, ClickUp for execution, and Mookamedi's existing Jev-gated dispatcher. Live paths, queue behavior, agent receipts, and Drive mirroring remain unverified.

## Audit limitation

The connected GitHub file reader returned the root README and package manifest, but code search did not return UI route, plugin contribution, or monitor-script matches. A guessed `packages/ui/package.json` path returned 404. Therefore the actual UI route, package layout, deployed commit, live monitor scripts, and runtime health are **UNKNOWN**. Do not claim they are absent. Continue by inspecting the repository tree and actual UI package paths before editing application code.

## MVP screen

One overview screen with:
1. ProBook and Phoenix machine cards.
2. Critical service checks: Paperclip API, database readiness, Ollama/model endpoints, Core bridge.
3. Current Paperclip agent/task summary.
4. Latest Core event and evidence link, if readable.
5. Highest-priority blocker only when supported by current evidence.
6. Per-source observed time, age/freshness, latency, and error state.

Every source must support explicit `HEALTHY`, `DEGRADED`, `FAILED`, `STALE`, or `UNKNOWN` display states. Preserve last-known values when a source fails, but visibly mark them stale. Never equate a responding API with overall system health.

## Integration decision

Prefer, in order:
1. Existing supported Paperclip plugin dashboard/page extension if the checked-out fork/version supports it.
2. Existing dashboard route/component if a plugin extension is not appropriate.
3. Do not create a standalone frontend unless repository evidence establishes there is no safe in-platform extension point.

Use the existing Paperclip API and UI conventions. Read-only collection only for MVP. No new database, polling daemon, scheduler, metrics stack, or write API.

## Minimum data contract

Each observation:
- `source_id`, `subject_id`, `status`
- `observed_at` (UTC), `source_timestamp` when available
- `latency_ms`, `summary`, `error_class` (redacted)
- `evidence_ref`, `verification_method`, `verification_result`

Never expose credentials, environment values, auth headers, or secret-bearing raw logs to the browser.

## Build sequence

- [x] Inspect root package manifest and README.
- [x] Inspect Core Paperclip bridge.
- [x] Inspect Core event logger and gap-to-capability protocol.
- [x] Create isolated feature branch.
- [ ] Locate actual UI package, route, dashboard components, and plugin SDK usage in the repository.
- [ ] Inspect exact health/dashboard API schemas and auth behavior used by this fork.
- [ ] Locate existing host monitor scripts and their output contracts; do not recreate them.
- [ ] Implement one overview view using the existing extension point.
- [ ] Add tests for stale data, timeouts, malformed payloads, partial source failure, and secret redaction.
- [ ] Run relevant typecheck/build/unit tests.
- [ ] Record results and rollback steps; do not merge or deploy without test evidence.

## Acceptance criteria

- UI renders with partial or unavailable sources.
- Every metric has source and freshness.
- Old data cannot display as current.
- API, database, model endpoints, host heartbeat, and Core bridge are represented separately.
- All initial collection is read-only.
- No secrets are logged or rendered.
- Test evidence is recorded and independently reproducible.
- No duplicate infrastructure is introduced.
- No claim of live status or deployment without runtime evidence.

## Rollback

Before deployment, revert the feature branch commit or disable the added route/plugin contribution. The MVP must not migrate schemas, mutate operational state, restart services, or change credentials.
