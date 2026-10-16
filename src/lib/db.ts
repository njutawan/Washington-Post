import {
  randomBytes,
  createHash,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { readDocument, mutateDocument } from './storage';
import { signupSchema, slugSchema } from './security-input';
import type { EditorialRole } from './editorialAuth';
const scrypt = promisify(nodeScrypt);
export type DB = {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    image?: string;
    passwordHash?: string; // 'scrypt$N$r$p$salt$hash' (new) or legacy raw sha256 hex
    salt?: string; // legacy only — scrypt salt is embedded in passwordHash
    createdAt: string;
    role?: 'reader' | 'author' | 'editor' | 'admin';
    disabled?: boolean;
    newsletterPreferences: Record<string, boolean>;
  }>;
  accounts: Array<{
    id: string;
    userId: string;
    provider: string;
    providerAccountId: string;
  }>;
  sessions: Record<string, { userId: string; expiresAt: string }>;
  bookmarks: Record<string, string[]>; // userId -> article slugs
  comments: Array<{
    id: string;
    articleId: string;
    userId: string;
    userName: string;
    body: string;
    createdAt: string;
  }>;
};

export function emptyDB(): DB {
  return { users: [], accounts: [], sessions: {}, bookmarks: {}, comments: [] };
}
const load = () => readDocument('accounts', emptyDB());
const change = <R>(run: (db: DB) => R | Promise<R>) =>
  mutateDocument('accounts', emptyDB(), run);
const genId = () => randomBytes(16).toString('hex');
// CWE-916: memory-hard scrypt with random salt. Async so signup cannot block the event loop.
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, Buffer.from(salt, 'hex'), 64)) as Buffer;
  return `scrypt$16384$8$1$${salt}$${hash.toString('hex')}`;
}
async function verifyStored(
  password: string,
  user: DB['users'][number],
): Promise<boolean> {
  const stored = user.passwordHash || '';
  let hash: Buffer;
  let expected: Buffer;
  if (stored.startsWith('scrypt$')) {
    const [, n, r, p, salt, hex] = stored.split('$');
    // Never accept attacker/corruption-controlled KDF cost from storage.
    if (
      n !== '16384' ||
      r !== '8' ||
      p !== '1' ||
      !/^[a-f0-9]{32}$/.test(salt || '') ||
      !/^[a-f0-9]{128}$/.test(hex || '')
    )
      return false;
    hash = (await scrypt(password, Buffer.from(salt, 'hex'), 64)) as Buffer;
    expected = Buffer.from(hex, 'hex');
  } else if (/^[a-f0-9]{64}$/.test(stored) && user.salt) {
    hash = createHash('sha256')
      .update(user.salt + password)
      .digest();
    expected = Buffer.from(stored, 'hex');
  } else return false;
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
export async function findUserByEmail(email: string) {
  return (await load()).users.find(
    (u) => u.email === email.trim().toLowerCase(),
  );
}
export async function findUserById(id: string) {
  return (await load()).users.find((u) => u.id === id);
}
export async function createUserWithEmail(input: {
  email: string;
  password?: string;
  name?: string;
}) {
  const data = signupSchema.parse(input);
  const passwordHash = await hashPassword(data.password);
  return change((db) => {
    if (db.users.length >= 100000) throw new Error('Account capacity reached');
    if (db.users.some((u) => u.email === data.email))
      throw new Error('Unable to create account');
    const user: DB['users'][number] = {
      id: genId(),
      email: data.email,
      name: data.name || data.email.split('@')[0],
      passwordHash,
      role: 'reader',
      createdAt: new Date().toISOString(),
      newsletterPreferences: {},
    };
    db.users.push(user);
    return user;
  });
}
export async function verifyPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (
    !user ||
    user.disabled ||
    password.length > 128 ||
    !(await verifyStored(password, user))
  )
    return null;
  if (!user.passwordHash?.startsWith('scrypt$')) {
    const passwordHash = await hashPassword(password);
    await change((db) => {
      const u = db.users.find((u) => u.id === user.id);
      if (u) {
        u.passwordHash = passwordHash;
        delete u.salt;
      }
    });
  }
  return user;
}
export async function getStaffIdentity(id: string) {
  const u = await findUserById(id);
  if (!u || u.disabled) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || 'Staff',
    role: (u.role || 'reader') as EditorialRole,
  };
}
export async function getBookmarks(userId: string): Promise<string[]> {
  return (await load()).bookmarks[userId] || [];
}
export async function toggleBookmark(userId: string, slug: string) {
  slugSchema.parse(slug);
  return change((db) => {
    if (!db.users.some((u) => u.id === userId && !u.disabled))
      throw new Error('Unauthorized');
    const list = db.bookmarks[userId] || [];
    const idx = list.indexOf(slug);
    if (idx >= 0) list.splice(idx, 1);
    else {
      if (list.length >= 500) throw new Error('Bookmark quota reached');
      list.push(slug);
    }
    db.bookmarks[userId] = list;
    return list;
  });
}
export async function setNewsletterPrefs(
  userId: string,
  prefs: Record<string, boolean>,
) {
  return change((db) => {
    const u = db.users.find((u) => u.id === userId && !u.disabled);
    if (!u) throw new Error('Unauthorized');
    u.newsletterPreferences = prefs;
    return prefs;
  });
}
export async function getComments(articleId: string) {
  return (await load()).comments
    .filter((c) => c.articleId === articleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100)
    .map(({ id, userName, body, createdAt }) => ({
      id,
      userName,
      body,
      createdAt,
    }));
}
export async function addComment(input: {
  articleId: string;
  userId: string;
  body: string;
}) {
  return change((db) => {
    const user = db.users.find((u) => u.id === input.userId && !u.disabled);
    if (!user) throw new Error('Unauthorized');
    if (db.comments.length >= 50000) throw new Error('Comment quota reached');
    const comment = {
      id: genId(),
      ...input,
      userName: user.name || 'Reader',
      createdAt: new Date().toISOString(),
    };
    db.comments.push(comment);
    const { id, userName, body, createdAt } = comment;
    return { id, userName, body, createdAt };
  });
}
export async function getUserProfile(userId: string) {
  const u = await findUserById(userId);
  if (!u || u.disabled) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.image,
    createdAt: u.createdAt,
    newsletterPreferences: u.newsletterPreferences,
    bookmarks: await getBookmarks(userId),
  };
}
/** Legacy tests no longer need cache reset: storage reads are fresh. */
export function _resetForTests() {
  /* no in-process user cache */
}
