import { describe, it, expect } from 'vitest';
import { randomBytes, createHash } from 'crypto';
import {
  createUserWithEmail,
  verifyPassword,
  findUserByEmail,
  _resetForTests,
} from '@/lib/db';

function sha256(salt: string, password: string) {
  return createHash('sha256').update(salt + password).digest('hex');
}

describe('db password hashing', () => {
  it('stores new passwords as scrypt and verifies them', async () => {
    const email = `scrypt-${Date.now()}-${randomBytes(3).toString('hex')}@example.com`;
    const user = await createUserWithEmail({ email, password: 'correct-horse' });

    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash!.startsWith('scrypt$')).toBe(true);
    // Self-contained: salt embedded in the hash, no separate salt field.
    expect(user.salt).toBeUndefined();

    const ok = await verifyPassword(email, 'correct-horse');
    expect(ok?.id).toBe(user.id);

    const bad = await verifyPassword(email, 'wrong-password');
    expect(bad).toBeNull();
  });

  it('verifies legacy sha256 hashes and upgrades them to scrypt on sign-in', async () => {
    // Simulate a pre-hardening record: raw sha256 hex + separate salt field.
    // (createUserWithEmail stores the user in the module's in-memory DB; we
    // mutate that same record into the legacy format, then verify.)
    _resetForTests();
    const email = `legacy-${Date.now()}-${randomBytes(3).toString('hex')}@example.com`;
    const salt = randomBytes(16).toString('hex');
    const legacyHash = sha256(salt, 'legacy-pass');

    const user = await createUserWithEmail({ email, name: 'Legacy' });
    user.passwordHash = legacyHash;
    user.salt = salt;

    const ok = await verifyPassword(email, 'legacy-pass');
    expect(ok?.id).toBe(user.id);

    const after = await findUserByEmail(email);
    expect(after?.passwordHash?.startsWith('scrypt$')).toBe(true);
    expect(after?.salt).toBeUndefined();

    // And the upgraded hash still verifies.
    const again = await verifyPassword(email, 'legacy-pass');
    expect(again?.id).toBe(user.id);
  });
});
