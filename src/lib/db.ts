import { randomBytes, createHash } from 'crypto';

/**
 * Lightweight file-backed JSON store for the Auth demo.
 * In production this would be Postgres/Prisma/Drizzle — but for a clone we
 * use an append-only JSON file so state persists across dev reloads without
 * standing up a database. Everything runs server-side only.
 */

// Keep the DB in-process memory with a simple async mutex for atomic writes.
type DB = {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    image?: string;
    passwordHash?: string; // hex(sha256(salt + password))
    salt?: string;
    createdAt: string;
    newsletterPreferences: Record<string, boolean>;
  }>;
  accounts: Array<{ id: string; userId: string; provider: string; providerAccountId: string }>;
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

const DB_PATH = './.demo-db.json';
let memory: DB | null = null;
let writeChain: Promise<void> = Promise.resolve();

function empty(): DB {
  return { users: [], accounts: [], sessions: {}, bookmarks: {}, comments: [] };
}

async function load(): Promise<DB> {
  if (memory) return memory;
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(DB_PATH, 'utf8');
    memory = JSON.parse(raw) as DB;
  } catch {
    memory = empty();
  }
  return memory;
}

async function save() {
  const db = await load();
  const fs = await import('fs/promises');
  const serialized = JSON.stringify(db, null, 2);
  writeChain = writeChain.then(() => fs.writeFile(DB_PATH, serialized, 'utf8'));
  await writeChain;
}

function genId(len = 16) {
  return randomBytes(len).toString('hex');
}

function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(s + password).digest('hex');
  return { salt: s, hash };
}

export async function findUserByEmail(email: string) {
  const db = await load();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string) {
  const db = await load();
  return db.users.find((u) => u.id === id);
}

export async function createUserWithEmail({
  email,
  password,
  name,
}: {
  email: string;
  password?: string;
  name?: string;
}) {
  const db = await load();
  const id = genId();
  const pw = password ? hashPassword(password) : null;
  const user: DB['users'][number] = {
    id,
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
    newsletterPreferences: { 'morning-mix': true },
    ...(pw ? { passwordHash: pw.hash, salt: pw.salt } : {}),
  };
  db.users.push(user);
  await save();
  return user;
}

export async function verifyPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) return null;
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return null;
  return user;
}

export async function createOAuthUser({
  email,
  name,
  image,
  provider,
  providerAccountId,
}: {
  email: string;
  name?: string;
  image?: string;
  provider: string;
  providerAccountId: string;
}) {
  const db = await load();
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: genId(),
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      image,
      createdAt: new Date().toISOString(),
      newsletterPreferences: { 'morning-mix': true },
    };
    db.users.push(user);
  } else if (image && !user.image) {
    user.image = image;
  }
  if (!db.accounts.find((a) => a.provider === provider && a.providerAccountId === providerAccountId)) {
    db.accounts.push({ id: genId(), userId: user.id, provider, providerAccountId });
  }
  await save();
  return user;
}

export async function getBookmarks(userId: string): Promise<string[]> {
  const db = await load();
  return db.bookmarks[userId] || [];
}

export async function toggleBookmark(userId: string, slug: string) {
  const db = await load();
  const list = db.bookmarks[userId] ? [...db.bookmarks[userId]] : [];
  const idx = list.indexOf(slug);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(slug);
  db.bookmarks[userId] = list;
  await save();
  return list;
}

export async function setNewsletterPrefs(userId: string, prefs: Record<string, boolean>) {
  const db = await load();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  user.newsletterPreferences = prefs;
  await save();
  return prefs;
}

export async function getComments(articleId: string) {
  const db = await load();
  return db.comments
    .filter((c) => c.articleId === articleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addComment({
  articleId,
  userId,
  body,
}: {
  articleId: string;
  userId: string;
  body: string;
}) {
  const db = await load();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');
  const comment: DB['comments'][number] = {
    id: genId(),
    articleId,
    userId,
    userName: user.name || user.email,
    body: body.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };
  db.comments.push(comment);
  await save();
  return comment;
}

export async function getUserProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) return null;
  const { passwordHash, salt, ...safe } = user;
  return {
    ...safe,
    bookmarks: await getBookmarks(userId),
  };
}
