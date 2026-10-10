# Staging baseline review — hanuram_staging

The user confirmed the restored staging counts match the production backup source: 7,005 customers, 2 uploads and 14,740 upload rows. Connection: local PostgreSQL 18, port 5433. No Alembic revision is recorded.

The exported schema was compared offline with the frozen initial migration: 12 baseline tables, column types/nullability, primary and unique keys, indexes and foreign keys. Historical WhatsApp connection columns/keys and marketing table columns/indexes/foreign keys were also checked.

Known legacy drift: seven extra tenant columns and four extra marketing tables; two segment unique constraints changed from organization-based keys to tenant-based keys. The user ran both organization/code and organization/name duplicate checks on staging and reported zero duplicate groups.

The repair revision `e73a2109b001` now restores missing organization-based segment keys, retains tenant-based keys, checks duplicate groups before adding constraints and remains repeatable. A PostgreSQL regression test covers this exact drift. No staging or production database was changed by the agent.

Bootstrap sequence for this reviewed legacy schema: record `62942c9db687` as the legacy starting revision, then immediately upgrade to `e73a2109b001` to reconcile the documented drift. This records a reviewed legacy starting point; it does not claim the restored database is an exact untouched initial schema. The connection revision checks existing tables before creation. Do not skip the repair or stamp the SaaS/RLS head.

Run only against `hanuram_staging`, then verify counts, ownership and the recorded revision. SaaS/RLS migrations and restricted role setup are subsequent staging steps. This review does not authorize automatic production baseline changes.
