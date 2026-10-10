> Current subscription workflow: manual PlatformStaff assignment, renewal and cancellation. Online payment integration has been removed; provider checkout references below describe earlier checkpoints and are superseded. See the backend MANUAL_SUBSCRIPTIONS.md.

# HanuRam Tech enterprise SaaS review and rollout

Review date: 9 October 2026. Frontend: `D:/web apps/React/CBD project`; backend: `D:/web apps/Python/CBD_Python`.

Implementation checkpoint: Phase A authorization changes are implemented and tested. A frozen schema-repair migration (`e73a2109b001`) and isolated legacy-schema tests are added; the migration is not applied to the application database. Full RLS, subscription billing, platform administration, compliant campaign processing, and the remaining roadmap are still pending. The user selected Razorpay test mode and reported an approved centralized Meta/BSP billing arrangement; provider-specific integration details have not yet been verified. See backend `ENTERPRISE_PHASES.md` for current limitations and commands.

This is a source-level review. The live database, Render account, Meta app approval, payment account eligibility, and recovery procedures have not been verified. No live migrations or external sends/payments are authorized by this document. Implementation status must be distinguished from this target architecture.

## 1. Existing architecture

React 19/Vite 8/Tailwind frontend uses Axios, Zustand persisted authentication, React Query, lazy routes, and module-based navigation. CRM includes customer CRUD, purchases/interactions, segmentation, spreadsheet staging/import, analytics, templates, campaigns, and WhatsApp broadcast/scheduling screens. Frontend `test` currently only builds the application; it does not test behavior.

FastAPI uses synchronous SQLAlchemy sessions and PostgreSQL JSONB. `Tenant`, `Organization`, and `User` represent tenancy; CRM list queries normally constrain both tenant and organization, and ID lookups call `ensure_tenant_access`. Owner-only member/role management and router-level module dependencies already exist. Passwords are bcrypt, JWTs have expiry, and password changes invalidate older tokens. Legacy plaintext passwords remain accepted for upgrade on login. Authentication rate limiting is per API process.

WhatsApp already uses the official Cloud API, backend token exchange, server verification of granted WABA/phone assets, tenant-bound Fernet encryption, expiring single-use signup attempts, phone registration, and webhook subscription. Tokens are omitted from serializers. Webhooks verify Meta HMAC signatures, resolve tenant by WABA plus phone ID, and update broadcast delivery states with row locks. Scheduled broadcasts use an API-process thread and database row claims. Unknown sends are deliberately not automatically retried.

PostgreSQL, Docker, Render manifests, pytest tests, and separate frontend/backend GitHub workflows exist. Existing API tests isolate their data in a dedicated PostgreSQL database/schema. These are useful foundations to extend, not replace.

## 2. Implemented, incomplete, and missing

| Capability | Current source status | Required work |
| --- | --- | --- |
| Tenant registration | Creates tenant, organization, owner atomically | Business/legal profile, verification, collision-safe identifiers, lifecycle |
| Isolation | Application filters and ownership checks | PostgreSQL RLS, non-bypass runtime role, composite tenant foreign keys, workers and raw SQL tests |
| RBAC | Owner and per-user module grants | Explicit enterprise roles, action permissions, frontend denial, consistent role-profile API |
| Platform administration | Missing | Separate platform identity and audited operational APIs/dashboard |
| Managed WhatsApp connection | Embedded Signup implemented | Assisted request workflow, provider eligibility/billing readiness, lifecycle/revocation, multi-number entitlements |
| Multi-number tenancy | Unique organization connection | Preserve existing connection as default; allow plan-controlled additional numbers |
| Templates | Local CRUD | Meta sync, pagination, WABA-scoped approval/category/language and webhook updates |
| Campaigns | CRUD; launch/resume return 501 | Durable recipients/outbox, Celery execution, pause/cancel/recovery |
| Broadcast delivery | Real sends plus signed status callbacks | Consent and service-window enforcement, durable per-message history and metering |
| Billing | User JSON subscription field only | Razorpay plans/subscriptions, verified events, payments, invoices, renewals, dunning/reconciliation |
| Consent | Preferences field; several paths default true | Explicit evidence, opt-out suppression, inbound processing, dispatch-time checks |
| Security/operations | Some protection and CI already present | Audit trail, shared rate limits, credential rotation, RLS tests, restore drills and monitoring |

### Prioritized risks

1. Frontend `hasRoleAccess` returns true; empty module lists effectively grant navigation access. UI access does not prove backend permission. Viewer writes are not distinguished from reads.
2. Application-only isolation is insufficient for a missed query. `ensure_tenant_access` accepts null ownership fields. Some ownership columns are nullable and independent foreign keys allow cross-tenant references.
3. JWT tenant claims are optional in current validation; malformed tenant claims can raise uncaught conversion errors. Tenant suspension is not checked. Owner privilege should also verify actual organization ownership.
4. New customer/import preferences can claim consent without evidence. Broadcast and direct-send paths do not enforce opt-out or the customer-service window. Directory or group-derived contacts cannot be treated as consent.
5. Alembic drift: the initial revision lacks current tenant fields (including upload row tenant IDs) and newer marketing tables; some migration code imports mutable application models. `create_all` cannot repair existing columns. Never blindly stamp a deployed database as migrated.
6. Render points `TEST_DATABASE_URL` at the application database, enables startup table creation, and lacks a dedicated campaign worker. Tests currently reject the database name, but the configuration should still be removed.
7. Process-local scheduler and rate limits do not provide scalable coordination/recovery guarantees. Legacy development socket subscription does not authenticate tenant membership.
8. Roles API returns a list while Users/Roles screens expect `customRoles`; dashboard module names differ across backend/frontend. Password reset and phone verification correctly report 501 rather than pretending to work.

## 3. Recommended architecture

Keep the existing modular FastAPI backend, React frontend, and shared PostgreSQL database. Separate tenant APIs from platform operational APIs. Platform staff must not be granted global tenant bypass through a tenant role string or public registration. Use a distinct platform membership table, MFA-capable identity, limited grants, and an audited support-access workflow.

Tenant data uses tenant and organization scope derived from verified server identity. PostgreSQL enforces RLS for runtime SQL and workers with transaction-local `set_config` context and policies using both `USING` and `WITH CHECK`. Restore context after every commit/new transaction; never use pooled session-global tenant settings. Authentication discovery and signed provider callbacks require narrowly scoped trusted lookup paths, not a public bypass flag. Use separate migration ownership and runtime roles; runtime must not be superuser/BYPASSRLS. Table owners normally bypass RLS unless forced: [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Retain legacy organization IDs and tenant relationships. Add composite organization/tenant and resource/tenant keys to prevent cross-tenant references. Treat Redis as broker/cache/rate limiter, PostgreSQL as source of truth, and Celery as a separate worker plus one scheduler. Use a transactional outbox, recipient-level claims, bounded concurrency, tenant quotas, dead-letter/reconciliation tools, and safe handling of ambiguous Meta responses.

Separate control-plane plans, platform operations, provider event inboxes from tenant CRM/business data. Store secrets server-side, encrypt tenant credentials with context binding, redact telemetry, and preserve encryption keys across redeploys and backups. Use short-lived access authentication with a deliberate refresh/revocation design before changing the existing bearer/cookie contract.

## 4. Database changes and Alembic plan

1. Inventory actual schema and `alembic_version` read-only. Compare against both revisions and current metadata. Back up, restore to an isolated database, and record row counts, null ownership, mismatched organizations, and orphan references. Do not infer missing tenant IDs from names.
2. Add a frozen schema-repair revision for missing columns/tables. Backfill upload row tenant from its upload/organization only when unambiguous; fail with a diagnostic if inconsistent. Use expand/backfill/validate/contract. Preserve rows; no table replacement or destructive downgrade in a production run.
3. Add tenant lifecycle/business profile and explicit permission foundation without rewriting existing grants. Seed role definitions, not prices. Existing custom/member grants remain supported.
4. Add plan versions/entitlements, subscriptions, provider customers, payments, provider event inbox (unique provider event ID plus body digest), invoice/line-item/credit-note snapshots, billing profiles, usage ledger and rate-card versions. Use integer minor currency units/Decimal, never binary floats for billing.
5. Add onboarding requests, provider readiness, credential versions, multiple sender connections, default sender, and WABA-scoped templates. Remove organization uniqueness only after sender-selection compatibility and quota checks are in place. Globally prevent the same phone ID from being assigned to different tenants.
6. Add phone-scoped consent events/suppression and inbound conversation windows; normalize per tenant. Add durable campaign recipients, message attempts/status events and outbox. Relate records using composite tenant keys.
7. Add append-only audit events, support grants, RLS policies and least-privilege database roles. Activate RLS only after auth/worker/webhook context wiring and rollback behavior pass actual PostgreSQL tests; never enable it ahead of that wiring.
8. Run upgrade from an empty database and a restored existing schema, verify row counts/mappings and migration repeatability, then deploy through a controlled migration job. Do not execute live migrations from API startup.

## 5. Backend and frontend implementation plan

| Phase | Backend | Frontend | Release evidence |
| --- | --- | --- | --- |
| A: authorization foundation | Canonical roles/module grants; viewer read-only; strict JWT/ownership validation; safe registration identifiers; tenant-owned campaign template validation | Denying guards and safe no-access route; role response compatibility; actual RBAC tests | Existing regression suite plus negative role/tenant tests |
| B: schema and isolation | Repair migration, data preflight, RLS context/auth discovery/worker callback boundaries, composite ownership keys | Tenant context/cache isolation | Restricted-role PostgreSQL read/write/raw SQL/pooled-connection tests |
| C: business/platform management | Profile validation; platform staff identity, audit and limited support access | Tenant profile and platform admin overview/onboarding queue | Platform cannot be self-created; staff scopes verified |
| D: subscriptions | Configured plan catalog and Razorpay adapter; server checkout, inbox verification, renewals/dunning, invoice snapshots and reconciliation | Plan selection, checkout, subscription/usage/invoice pages | Invalid/duplicate/out-of-order webhook, amount/currency/tenant, refund and renewal tests |
| E: managed WhatsApp | Assisted onboarding; preserve Embedded Signup; provider readiness; multi-number quotas; Meta template sync | Plain-language connect/request flow, number selector, verification/status help | Ownership/replay/expiry/secret-leak tests and authorized sandbox smoke test |
| F: compliant campaigns | Consent/suppression/window checks; Celery/outbox; recipient delivery and usage ledger | Consent controls, campaign queue/status, delivery/usage screens | Unsubscribed contacts excluded at send time; crash/retry/concurrency tests |
| G: operations | Shared limiter, telemetry, readiness, CI migrations, Render worker/Redis, backup/restore and runbooks | Operational failure states | Staging load/security checks, successful restore drill and monitored rollout |

## 6. Meta onboarding and billing approach

Customer flow: register business → choose configured SaaS plan → complete payment → connect WhatsApp or request assistance → authorize their business through official signup → verify/control their phone and satisfy any Meta business/account requirements → readiness check → approved messaging. Customers do not paste API tokens or configure webhooks. HanuRam operates the Meta app and backend integration; customers still give authorization and complete required verification.

Keep Embedded Signup and its server-side asset checks. Add an assisted onboarding request with explicit states: requested, needs_customer_action, provider_review, authorized, phone_registered, billing_pending, ready, rejected, disconnected. A stored token alone does not prove production messaging/billing readiness. Verify permissions, current WABA/number ownership, registration, webhook subscription, and provider/account status. Do not promise existing-app coexistence, number migration, automatic verification or group messaging without supported and verified eligibility.

Tech Provider status alone must not be treated as centralized billing eligibility. Meta distinguishes partner capabilities, including authorized line-of-credit sharing: [Meta partner information](https://whatsappbusiness.com/partners/become-a-partner/). HanuRam can bill its SaaS subscription independently. For customers to pay HanuRam for messaging as well, use an eligible approved provider credit-line arrangement or a contracted BSP/Solution Partner that supplies centralized billing and usage reconciliation. Until that is established, clearly disclose any separate customer payment arrangement Meta requires. The app must not fabricate provider approval or billing readiness.

Keep SaaS subscription charges separate from messaging usage in accounting, UI, and invoices. Usage prices are effective-dated configuration and reconciled to actual provider billable usage; sent-message counts alone do not establish charges. No hardcoded plan prices, Meta rates or entitlement assumptions. [Meta pricing](https://business.whatsapp.com/products/platform-pricing).

Razorpay checkout receives only public key/checkout identifiers. Backend owns plan selection, amount/currency and tenant mapping. Verify webhook HMAC against raw bytes before parsing, deduplicate provider event IDs, handle event order and reconcile provider state: [Razorpay verification](https://razorpay.com/docs/webhooks/validate-test/). Never activate paid access based only on a browser callback. Confirm gateway recurring-payment eligibility and merchant KYC separately. Invoice/tax rules require the business's actual billing registration and approved policy.

## 7. Development and rollout roadmap

Work in phase order; preserve existing routes where possible and record behavior changes explicitly. Test a phase before enabling the next. Provider live operations require the actual approved accounts and verified configuration; code can be developed and mocked without inventing that status.

First deliver the review and authorization changes. Next unblock PostgreSQL integration/migration testing, repair drift on a restored database, and enforce isolation. Then build business/platform operations, gateway billing, managed multi-number onboarding, compliant background campaigns, and production operations. Release only when migration, provider sandbox, restore, authorization and isolation evidence is recorded. No claim of production readiness should be made from a frontend build or mocked provider tests alone.
