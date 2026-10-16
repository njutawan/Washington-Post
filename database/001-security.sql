-- Run as migration owner, not as the runtime role. BACKUP includes all these tables.
CREATE TABLE IF NOT EXISTS app_documents (
  tenant_id text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);
CREATE TABLE IF NOT EXISTS security_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL,
  target_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS security_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS security_limits_expiry ON security_limits(expires_at);
CREATE TABLE IF NOT EXISTS security_leases (
  id uuid PRIMARY KEY,
  key text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS security_leases_key ON security_leases(key, expires_at);
-- Append-only against accidental/compromised app UPDATE/DELETE. DB owner can
-- still alter schema: use separate runtime/migration/backup roles in production.
CREATE OR REPLACE FUNCTION reject_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'security_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS audit_immutable ON security_audit;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON security_audit
FOR EACH ROW EXECUTE FUNCTION reject_audit_change();
