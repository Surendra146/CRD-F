> Current subscription workflow: manual PlatformStaff assignment, renewal and cancellation. Online payment integration has been removed; provider checkout references below describe earlier checkpoints and are superseded. See the backend MANUAL_SUBSCRIPTIONS.md.

# SaaS delivery status — 9 October 2026

The existing application was extended in place. This supersedes the earlier Phase A-only checkpoint. Production activation is not complete.

## Implemented

- Tenant RBAC, strict JWT claims, suspended-tenant denial, owner validation, frontend route denial and per-account cache isolation.
- Explicit platform staff membership and scoped permissions; tenant overview/suspension, configured plans, assisted onboarding and audit history.
- Separate business profiles, with additive backfill for existing organizations; tenant Business and Billing screens.
- Razorpay test-mode subscriptions, verified server prices, signed raw-body callbacks, replay checks, canonical reconciliation, renewal/failure states, period-end cancellation and tenant-scoped invoice snapshots. Browser callbacks do not activate access.
- Official authorized WhatsApp signup, encrypted tenant credentials, subscription number limits, multiple senders/default selection, WABA-specific template sync and message history.
- Recorded opt-in evidence, consent history, signed STOP opt-out, service-window enforcement and per-recipient campaign checks. Sending requires approved template identity/language/WABA; local editors cannot forge Meta approval metadata.
- Redis/Celery processing through a transactional outbox, dispatch locking, campaign pause/resume and duplicate-launch protection. Ambiguous sends remain unknown. Provider statement usage records remain separate from subscription charges.
- Forced PostgreSQL RLS with transaction-local scope renewed after commits, composite ownership constraints, append-only audit/consent/usage history and shared Redis rate limiting.
- Render API/worker/beat/Redis blueprint, readiness checks, database role grants, staff bootstrap, backup tooling and operations/recovery runbook.

## Database preservation

The earlier read-only inventory found 6,999 customers, 4 uploads and 30,222 upload rows. The existing database has no recorded Alembic revision. Compare its complete schema with historical migrations on a restored staging copy before establishing a baseline. Do not blindly stamp or upgrade the live database.

Prepared revisions: `e73a2109b001` frozen repair, `f91c320ab002` SaaS schema/composite ownership/profile backfill, `f91c320ab003` forced RLS. These are tested in isolated PostgreSQL schemas. No application database migration, provider message/payment or deployment was performed.

## Verification

All 170 backend tests passed, including authentication, RBAC, tenant API isolation, raw SQL isolation under a restricted PostgreSQL role, scope renewal, composite ownership, billing signatures/replays/reconciliation/invoices, consent, template approval isolation, campaign queue actions and legacy profile-backfill preservation. Compilation and whitespace checks passed; Alembic has one head (`f91c320ab003`).

Five frontend RBAC tests, the Vite production build and ESLint passed. No browser interaction test or live Redis/Meta/Razorpay test was performed. One existing Starlette TestClient deprecation warning remains.

## Required before production

1. Reconcile the current migration baseline on a backup restore; provision restricted runtime and separate control roles; apply reviewed migrations.
2. Supply Razorpay test credentials and configured provider plans; complete actual checkout/webhook tests before live activation.
3. Supply the confirmed Meta/BSP provider name, API contract and approved billing reference. Complete provider-specific credit allocation and usage-feed integration.
4. Implement separate messaging-charge collection, refund/dispute handling and reviewed tax invoices/credit notes. Usage records and payment invoice snapshots do not implement those workflows.
5. Run a real Redis worker smoke/load test, configure alerts, verify restoration and deploy the prepared services. Review infrastructure cost before deployment.

See [backend operations](<D:/web apps/Python/CBD_Python/ENTERPRISE_OPERATIONS.md>) for release safeguards and commands.
