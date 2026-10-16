// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { randomBytes, createHash } from 'crypto';
import {
  createUserWithEmail,
  verifyPassword,
  findUserByEmail,
  emptyDB,
} from '@/lib/db';
import { mutateDocument } from '@/lib/storage';
const password = 'a-long-unique-passphrase-2026';
describe('durable accounts', () => {
  it('stores scrypt with random salts and verifies without exposing hashes in a profile', async () => {
    const { getUserProfile } = await import('@/lib/db');
    const u = await createUserWithEmail({
      email: 'scrypt@example.invalid',
      password,
    });
    expect(u.passwordHash).toMatch(/^scrypt\$/);
    expect((await verifyPassword(u.email, password))?.id).toBe(u.id);
    expect(await verifyPassword(u.email, 'wrong')).toBeNull();
    expect(await getUserProfile(u.id)).not.toHaveProperty('passwordHash');
  });
  it('upgrades legacy sha256 hashes on successful signin', async () => {
    const u = await createUserWithEmail({
      email: 'legacy@example.invalid',
      password,
    });
    const salt = randomBytes(16).toString('hex');
    await mutateDocument('accounts', emptyDB(), (db) => {
      const row = db.users.find((x) => x.id === u.id)!;
      row.passwordHash = createHash('sha256')
        .update(salt + password)
        .digest('hex');
      row.salt = salt;
    });
    expect((await verifyPassword(u.email, password))?.id).toBe(u.id);
    expect((await findUserByEmail(u.email))?.passwordHash).toMatch(/^scrypt\$/);
  });
  it('rejects weak/oversized passwords, bad email, and duplicate parallel signups', async () => {
    await expect(
      createUserWithEmail({ email: 'weak@example.invalid', password: '1234' }),
    ).rejects.toThrow();
    await expect(
      createUserWithEmail({ email: 'not-email', password }),
    ).rejects.toThrow();
    await expect(
      createUserWithEmail({
        email: 'long@example.invalid',
        password: 'a'.repeat(129),
      }),
    ).rejects.toThrow();
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        createUserWithEmail({ email: 'same@example.invalid', password }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
});
