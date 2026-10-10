> Current subscription workflow: manual PlatformStaff assignment, renewal and cancellation. Online payment integration has been removed; provider checkout references below describe earlier checkpoints and are superseded. See the backend MANUAL_SUBSCRIPTIONS.md.

# Implementation checkpoint — 9 October 2026

This is the earlier Phase A checkpoint. See [SAAS_DELIVERY_STATUS.md](SAAS_DELIVERY_STATUS.md) for the current implementation and remaining production dependencies. The architecture review is in [ENTERPRISE_SAAS_REVIEW.md](ENTERPRISE_SAAS_REVIEW.md).

## Completed changes

- Explicit Owner, Admin, Marketing Manager, Sales Agent and Viewer defaults; Viewer API write denial; existing custom/member grants retained.
- Frontend module/role denial, dashboard alias consistency, a no-access landing route, and account-specific React Query cache lifetime.
- Strict JWT tenant claims, tenant suspension checks, owner identity validation and null/foreign resource ownership rejection.
- Tenant Admin member management, functional role/email/password editing, backend/frontend role-profile response consistency, and reserved platform role denial.
- Unique registration identifiers for businesses with the same display name; existing identifiers unchanged.
- Campaign template ownership checks; existing Meta signup/encrypted tokens/signed webhooks retained.
- Frozen Alembic repair revision `e73a2109b001`, isolated PostgreSQL migration tests, read-only preflight, portable backend test runner.
- Removed the Render manifest's application database reference from `TEST_DATABASE_URL`.

## Read-only application database findings

| Resource | Rows | Null/mismatched tenant ownership |
| --- | ---: | --- |
| Customers | 6,999 | 0 |
| Uploads | 4 | 0 |
| Upload rows | 30,222 | 0 |

The seven inspected tables already have `tenant_id`; the four current marketing tables exist. No Alembic revision is recorded. This is a schema/history reconciliation requirement: do not run the initial migration against existing tables or blindly stamp a revision. Compare full schema/constraints with the historical migrations and current metadata on a restored copy, then establish the verified baseline before applying the repair revision. This inventory does not prove all foreign keys, RLS, backups, or production deployment are correct.

No application database writes, migrations, external messages/payments, or deployment were performed.

## Verification

Backend regression and PostgreSQL integration tests passed (149 cases), including original authentication/WhatsApp tests and new authorization, tenant access, template-alias bypass prevention, legacy schema upgrade, row preservation, and conflicting ownership tests. Frontend RBAC tests passed (5 cases), Vite production build passed, and ESLint passed. The migration chain has one head. Existing TestClient and datetime deprecation warnings remain.

## Remaining delivery

Strict PostgreSQL RLS and composite tenant constraints; audited platform administration and business profiles; Razorpay test-mode subscriptions/invoices/renewals; provider-specific managed multi-number onboarding and template sync; recorded consent, opt-out/service-window enforcement; Celery/outbox campaigns and billable usage reconciliation; monitoring, shared rate limits, backup restore drills and Render deployment. These are planned, not implemented. Existing sending paths still require the compliance phase before an enterprise launch.

The user selected Razorpay test mode and confirmed an approved centralized Meta/BSP billing arrangement. The specific provider contract/API and usage-feed configuration remain to be verified.
