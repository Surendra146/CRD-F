# Manual subscriptions

Billing shows plans, effective subscription status, start/expiry dates, invoice
history and WhatsApp usage. Plan assignment, renewal and cancellation are
performed in Platform by authorized active staff with `subscriptions.read` and
`subscriptions.manage`. Local plan creation requires `plans.manage`.

Checkout, browser payment SDK loading and gateway settings have been removed.
The console uses request IDs to make unchanged retries safe within the mounted
session. Every change requires a reason and is audited. Immediate cancellation
revokes access; cancellation at expiry retains access for the current period.

Before starting this frontend with the updated backend, manually review and
apply backend revision `f91c320ab005` after `f91c320ab004`. See the backend
`MANUAL_SUBSCRIPTIONS.md` for complete setup and rollback limitations.
