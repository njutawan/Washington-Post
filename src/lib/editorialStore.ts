/**
 * File-backed store for editorial CMS workflows.
 *
 * We persist drafts, assignments, moderation queues and media metadata to
 * .editorial-data/*.json. Published articles live in /content/articles/*.mdx
 * (see mdx.ts) — publishing a draft from the CMS writes an MDX file.
 *
 * This is intentionally simple (single-process JSON + fs) so the CMS works
 * without spinning up Postgres/PlanetScale; swap the load/write helpers for
 * a real DB when shipping.
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.editorial-data');
const ENSURED = new Set<string>();

function ensure(dir: string) {
  if (ENSURED.has(dir)) return;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  ENSURED.add(dir);
}

function readJson<T>(file: string, fallback: T): T {
  const p = path.join(DATA_DIR, file);
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}
function writeJson(file: string, value: unknown) {
  ensure(DATA_DIR);
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf-8');
}

export function claimAssignment(id: string, actor: { id: string; name: string }) {
  const all = getAssignments();
  const a = all.find((x) => x.id === id);
  if (a && a.status === 'open') {
    a.status = 'claimed';
    a.reporterId = actor.id;
    a.reporterName = actor.name;
    writeJson('assignments.json', all);
  }
  return a;
}

// ---------- Types ----------
export type StoryStatus = 'idea' | 'pitched' | 'assigned' | 'drafting' | 'editing' | 'ready' | 'published' | 'killed';

export type Story = {
  id: string;
  slug: string;
  title: string;
  dek?: string;
  category: string;
  categorySlug: string;
  kicker?: string;
  status: StoryStatus;
  authorId?: string;
  authorName?: string;
  editorId?: string;
  editorName?: string;
  wordCount: number;
  priority: 'routine' | 'urgent' | 'breaking';
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  comments: number;
  bodyPreview?: string;
};

export type Comment = {
  id: string;
  storySlug: string;
  storyTitle: string;
  authorName: string;
  body: string;
  createdAt: string;
  flagged: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reports: number;
};

export type MediaItem = {
  id: string;
  filename: string;
  url: string;
  caption?: string;
  credit?: string;
  kind: 'image' | 'video' | 'graphic';
  uploadedBy: string;
  uploadedAt: string;
  width?: number;
  height?: number;
};

export type Assignment = {
  id: string;
  storyId?: string;
  beat: string;
  summary: string;
  reporterId?: string;
  reporterName?: string;
  dueDate?: string;
  createdAt: string;
  createdBy: string;
  status: 'open' | 'claimed' | 'filed' | 'spiked';
};

export type Alert = {
  id: string;
  kind: 'breaking' | 'correction' | 'note';
  headline: string;
  body?: string;
  live: boolean;
  createdAt: string;
  createdBy: string;
};

// ---------- Seed initial data on first load ----------
function seedIfEmpty() {
  if (!fs.existsSync(path.join(DATA_DIR, 'stories.json'))) {
    const now = new Date().toISOString();
    const seeds: Story[] = [
      { id: 's-001', slug: 'seed-overnight-developments', title: 'Overnight: White House signals openness to short-term CR as shutdown clock ticks', category: 'Politics', categorySlug: 'politics', kicker: 'Politics', status: 'editing', authorName: 'Paul Kane', editorName: 'National Desk', wordCount: 842, priority: 'breaking', createdAt: now, updatedAt: now, comments: 12 },
      { id: 's-002', slug: 'seed-fed-preview', title: 'What to watch when the Fed announces its rate decision Wednesday', category: 'Business', categorySlug: 'business', kicker: 'Economy', status: 'drafting', authorName: 'Rachel Siegel', editorName: 'Business Desk', wordCount: 510, priority: 'urgent', createdAt: now, updatedAt: now, comments: 3 },
      { id: 's-003', slug: 'seed-commanders-analysis', title: 'Analysis: How the Commanders\u2019 rebuilt offensive line is changing everything', category: 'Sports', categorySlug: 'sports', status: 'ready', authorName: 'Barry Svrluga', editorName: 'Sports Desk', wordCount: 1102, priority: 'routine', createdAt: now, updatedAt: now, comments: 28 },
      { id: 's-004', slug: 'seed-cold-weather-hacks', title: 'Six winter hacks that actually work, according to people who live in Minnesota', category: 'Well+Being', categorySlug: 'wellbeing', kicker: 'Well+Being', status: 'pitched', authorName: 'Kelyn Soong', wordCount: 630, priority: 'routine', createdAt: now, updatedAt: now, comments: 0 },
      { id: 's-005', slug: 'seed-opioid-settlement', title: 'States clash over how to spend $50B in opioid settlement money', category: 'Investigations', categorySlug: 'investigations', kicker: 'Investigation', status: 'assigned', authorName: 'Todd C. Frankel', editorName: 'Investigations Desk', wordCount: 320, priority: 'urgent', createdAt: now, updatedAt: now, comments: 1 },
      { id: 's-006', slug: 'seed-film-festival-preview', title: 'The 10 most anticipated films at this year\u2019s New York Film Festival', category: 'Style', categorySlug: 'style', status: 'drafting', authorName: 'Ann Hornaday', wordCount: 740, priority: 'routine', createdAt: now, updatedAt: now, comments: 4 },
    ];
    writeJson('stories.json', seeds);
  }
  if (!fs.existsSync(path.join(DATA_DIR, 'comments.json'))) {
    const now = new Date().toISOString();
    writeJson('comments.json', [
      { id: 'c-001', storySlug: 'house-passes-short-term-spending-bill', storyTitle: 'House passes short-term spending bill', authorName: 'DCReader42', body: 'This is the same kabuki we saw in March. When does it end?', createdAt: now, flagged: false, status: 'pending', reports: 0 },
      { id: 'c-002', storySlug: 'oil-rockets-toward-100-per-barrel', storyTitle: 'Oil rockets back toward $100', authorName: 'EnergyWatcher', body: 'Drill baby drill is not an energy policy.', createdAt: now, flagged: true, status: 'pending', reports: 3 },
      { id: 'c-003', storySlug: 'commanders-real-football', storyTitle: 'The Commanders finally look like a real football team', authorName: 'HTTC4Life', body: 'Small sample size, but I\u2019ll take it.', createdAt: now, flagged: false, status: 'pending', reports: 0 },
      { id: 'c-004', storySlug: 'cds-are-back-baby', storyTitle: 'CDs are back, baby', authorName: 'MixTape94', body: 'Now do MiniDisc.', createdAt: now, flagged: false, status: 'approved', reports: 0 },
    ]);
  }
  if (!fs.existsSync(path.join(DATA_DIR, 'media.json'))) {
    writeJson('media.json', []);
  }
  if (!fs.existsSync(path.join(DATA_DIR, 'assignments.json'))) {
    const now = new Date().toISOString();
    writeJson('assignments.json', [
      { id: 'a-001', beat: 'White House', summary: 'Check in with sources on whether the President will sign the CR if the Senate passes it Saturday.', createdBy: 'Politics Desk', createdAt: now, status: 'open' },
      { id: 'a-002', beat: 'Markets', summary: 'Reax piece from the floor of the NYSE after Fed decision — need quotes from two traders.', createdBy: 'Business Desk', createdAt: now, status: 'claimed', reporterName: 'Evan Halper' },
    ]);
  }
  if (!fs.existsSync(path.join(DATA_DIR, 'alerts.json'))) {
    writeJson('alerts.json', []);
  }
}
seedIfEmpty();

// ---------- Stories ----------
export function getStories(status?: StoryStatus): Story[] {
  const all = readJson<Story[]>('stories.json', []);
  if (status) return all.filter((s) => s.status === status);
  return all;
}
export function getStoryById(id: string): Story | null {
  return getStories().find((s) => s.id === id) || null;
}
export function upsertStory(s: Story) {
  const all = getStories();
  const idx = all.findIndex((x) => x.id === s.id);
  s.updatedAt = new Date().toISOString();
  if (idx === -1) all.unshift(s); else all[idx] = s;
  writeJson('stories.json', all);
  return s;
}
export function deleteStory(id: string) {
  writeJson('stories.json', getStories().filter((s) => s.id !== id));
}
export function createStory(input: Partial<Story> & { title: string; category: string; categorySlug: string }, actor: { id: string; name: string }): Story {
  const now = new Date().toISOString();
  const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const s: Story = {
    id: 's-' + Math.random().toString(36).slice(2, 9),
    slug,
    title: input.title,
    dek: input.dek,
    kicker: input.kicker,
    category: input.category,
    categorySlug: input.categorySlug,
    status: input.status || 'idea',
    authorId: actor.id,
    authorName: actor.name,
    wordCount: input.wordCount || 0,
    priority: input.priority || 'routine',
    createdAt: now,
    updatedAt: now,
    comments: 0,
  };
  return upsertStory(s);
}

// ---------- Comments ----------
export function getComments(filter?: { status?: Comment['status']; flagged?: boolean }): Comment[] {
  let all = readJson<Comment[]>('comments.json', []);
  if (filter?.status) all = all.filter((c) => c.status === filter.status);
  if (filter?.flagged) all = all.filter((c) => c.flagged);
  return all;
}
export function moderateComment(id: string, status: Comment['status']) {
  const all = readJson<Comment[]>('comments.json', []);
  const c = all.find((x) => x.id === id);
  if (c) { c.status = status; writeJson('comments.json', all); }
}

// ---------- Assignments ----------
export function getAssignments(status?: Assignment['status']): Assignment[] {
  const all = readJson<Assignment[]>('assignments.json', []);
  if (status) return all.filter((a) => a.status === status);
  return all;
}
export function createAssignment(input: Partial<Assignment> & { beat: string; summary: string }, actor: { id: string; name: string }): Assignment {
  const a: Assignment = {
    id: 'a-' + Math.random().toString(36).slice(2, 9),
    beat: input.beat,
    summary: input.summary,
    dueDate: input.dueDate,
    createdBy: actor.name,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  const all = getAssignments();
  all.unshift(a);
  writeJson('assignments.json', all);
  return a;
}

// ---------- Media ----------
export function getMedia(): MediaItem[] {
  return readJson<MediaItem[]>('media.json', []);
}
export function addMedia(item: Omit<MediaItem, 'id' | 'uploadedAt'>): MediaItem {
  const m: MediaItem = { ...item, id: 'm-' + Math.random().toString(36).slice(2, 9), uploadedAt: new Date().toISOString() };
  const all = getMedia();
  all.unshift(m);
  writeJson('media.json', all);
  return m;
}

// ---------- Alerts / Breaking news ----------
export function getAlerts(): Alert[] {
  return readJson<Alert[]>('alerts.json', []);
}
export function upsertAlert(a: Alert) {
  const all = getAlerts();
  const i = all.findIndex((x) => x.id === a.id);
  if (i === -1) all.unshift(a); else all[i] = a;
  writeJson('alerts.json', all);
}
export function deleteAlert(id: string) {
  writeJson('alerts.json', getAlerts().filter((a) => a.id !== id));
}
export function createAlert(input: { kind: Alert['kind']; headline: string; body?: string }, actor: { id: string; name: string }): Alert {
  const a: Alert = {
    id: 'al-' + Math.random().toString(36).slice(2, 9),
    kind: input.kind,
    headline: input.headline,
    body: input.body,
    live: true,
    createdAt: new Date().toISOString(),
    createdBy: actor.name,
  };
  upsertAlert(a);
  return a;
}

// ---------- Publishing: write draft as MDX ----------
import matter from 'gray-matter';

export function publishStory(id: string, actor: { id: string; name: string }) {
  const s = getStoryById(id);
  if (!s) throw new Error('Story not found');
  const articlesDir = path.join(process.cwd(), 'content', 'articles');
  ensure(articlesDir);
  const filePath = path.join(articlesDir, `${s.slug}.mdx`);
  // Preserve existing body if present
  let existingBody = '';
  if (fs.existsSync(filePath)) {
    try {
      const parsed = matter(fs.readFileSync(filePath, 'utf-8'));
      existingBody = parsed.content.trim();
    } catch { /* ignore */ }
  }
  if (!existingBody) {
    existingBody = `${s.dek || ''}\n\n_${s.kicker || s.category} —_ ${s.title.charAt(0).toLowerCase() + s.title.slice(1)}.\n\nThis story was published from the Editorial CMS.\n`;
  }
  const fm: Record<string, unknown> = {
    title: s.title,
    dek: s.dek,
    kicker: s.kicker,
    category: s.category,
    categorySlug: s.categorySlug,
    byline: s.authorName ? `By ${s.authorName}` : 'The Washington Post',
    editor: s.editorName,
    time: 'Just now',
    publishedAt: new Date().toISOString(),
  };
  const out = matter.stringify(existingBody, fm);
  fs.writeFileSync(filePath, out, 'utf-8');
  s.status = 'published';
  s.publishedAt = new Date().toISOString();
  if (!s.editorId) { s.editorId = actor.id; s.editorName = actor.name; }
  upsertStory(s);
  return s;
}
