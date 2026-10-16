# Storage schema

Apply `001-security.sql` as migration owner with `npm run db:migrate`.
Use a separate non-superuser, non-owner runtime role; exact GRANT statements,
TLS guidance, security-state cleanup, operator role provisioning, backup and
restore controls are in `docs/security-deployment.md`.

There is intentionally no seed/default administrator or password and no automatic
import of legacy demo JSON. Production never creates schema on a request or falls
back to local JSON. All schema changes go through a reviewed migration.

Current storage model serializes updates per `(tenant_id, key)` document with
PostgreSQL row locks and writes the audit event in the same transaction. This
prioritizes correctness for the current small application; it is not a claim of
high-write scalability. Load test and normalize/shard before large deployment.
