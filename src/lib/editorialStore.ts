/** Durable tenant-scoped CMS. Publishing stores plain text, NEVER executable MDX.
 * CWE-22: user-controlled slugs never reach filesystem APIs. Legacy local MDX
 * remains build-time trusted repository content only.
 */
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { readDocument, mutateDocument } from './storage';
import {
  idSchema,
  slugSchema,
  statusSchema,
  prioritySchema,
  storyFormSchema,
} from './security-input';
import { assertActor, assertOwner, assertTransition } from './editorial-policy';
import { HttpError } from './http-security';
import type { Actor } from './editorialAuth';
export type StoryStatus =
  | 'idea'
  | 'pitched'
  | 'assigned'
  | 'drafting'
  | 'editing'
  | 'ready'
  | 'published'
  | 'killed';

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
  body?: string;
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

export type EditorialState = {
  stories: Story[];
  comments: Comment[];
  media: MediaItem[];
  assignments: Assignment[];
  alerts: Alert[];
};
export const emptyEditorial = (): EditorialState => ({
  stories: [],
  comments: [],
  media: [],
  assignments: [],
  alerts: [],
});
const load = () => readDocument('editorial', emptyEditorial());
function change<R>(
  actor: Actor,
  action: string,
  targetId: string,
  run: (state: EditorialState) => R,
) {
  assertActor(actor);
  idSchema.parse(targetId);
  return mutateDocument('editorial', emptyEditorial(), run, {
    actorId: actor.id,
    action,
    targetId,
  });
}
export async function getStories(status?: StoryStatus) {
  const all = (await load()).stories;
  return status ? all.filter((s) => s.status === status) : all;
}
export async function getStoryById(id: string) {
  idSchema.parse(id);
  return (await load()).stories.find((s) => s.id === id) || null;
}
export async function getPublishedArticle(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  const s = (await load()).stories.find(
    (s) => s.slug === slug && s.status === 'published',
  );
  if (!s) return null;
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    dek: s.dek,
    category: s.category,
    categorySlug: s.categorySlug,
    kicker: s.kicker,
    byline: 'By ' + s.authorName,
    publishedAt: s.publishedAt,
    time: 'Published',
    body: (s.body || s.bodyPreview || '').split(/\n\n+/),
  };
}
function storyIn(state: EditorialState, id: string) {
  const s = state.stories.find((s) => s.id === id);
  if (!s) throw new HttpError(404, 'Story not found');
  return s;
}
export async function createStory(
  input: {
    title: string;
    category: string;
    categorySlug: string;
    dek?: string;
    kicker?: string;
    priority?: Story['priority'];
  },
  actor: Actor,
) {
  const id = 's-' + randomUUID();
  const slug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 65)
      .replace(/-$/, '') +
    '-' +
    id.slice(2, 10);
  const data = storyFormSchema.parse({
    ...input,
    slug,
    dek: input.dek || '',
    kicker: input.kicker || '',
    priority: input.priority || 'routine',
    body: '',
  });
  return change(actor, 'story.create', id, (state) => {
    if (state.stories.length >= 10000)
      throw new HttpError(409, 'Story quota reached');
    const now = new Date().toISOString();
    const s: Story = {
      ...data,
      id,
      status: 'drafting',
      authorId: actor.id,
      authorName: actor.name,
      wordCount: 0,
      comments: 0,
      createdAt: now,
      updatedAt: now,
    };
    state.stories.push(s);
    return s;
  });
}
export async function updateStory(
  id: string,
  input: z.infer<typeof storyFormSchema>,
  actor: Actor,
) {
  const data = storyFormSchema.parse(input);
  prioritySchema.parse(data.priority);
  return change(actor, 'story.update', id, (state) => {
    const s = storyIn(state, id);
    assertOwner(actor, s);
    if (s.status === 'published' || s.status === 'killed')
      throw new HttpError(409, 'Story is locked');
    if (
      state.stories.some((other) => other.id !== id && other.slug === data.slug)
    )
      throw new HttpError(409, 'Slug already in use');
    Object.assign(s, data, {
      bodyPreview: data.body.slice(0, 400),
      wordCount: data.body.trim().split(/\s+/).filter(Boolean).length,
      updatedAt: new Date().toISOString(),
    });
    return s;
  });
}
export async function transitionStory(id: string, raw: unknown, actor: Actor) {
  const next = statusSchema.parse(raw);
  return change(actor, 'story.transition.' + next, id, (state) => {
    const s = storyIn(state, id);
    assertTransition(actor, s, next);
    s.status = next;
    s.updatedAt = new Date().toISOString();
    if (next === 'editing') {
      s.editorId = actor.id;
      s.editorName = actor.name;
    }
    return s;
  });
}
export async function publishStory(id: string, actor: Actor) {
  assertActor(actor, 'editor');
  return change(actor, 'story.publish', id, (state) => {
    const s = storyIn(state, id);
    slugSchema.parse(s.slug);
    if (s.status !== 'ready') throw new HttpError(409, 'Story must be ready');
    if (state.stories.some((other) => other.id !== id && other.slug === s.slug))
      throw new HttpError(409, 'Slug collision');
    s.status = 'published';
    s.publishedAt = new Date().toISOString();
    s.updatedAt = s.publishedAt;
    s.editorId = actor.id;
    s.editorName = actor.name;
    return s;
  });
}
export async function deleteStory(id: string, actor: Actor) {
  assertActor(actor, 'admin');
  return change(actor, 'story.delete', id, (state) => {
    storyIn(state, id);
    state.stories = state.stories.filter((s) => s.id !== id);
  });
}
export async function getComments(filter?: {
  status?: Comment['status'];
  flagged?: boolean;
}) {
  let all = (await load()).comments;
  if (filter?.status) all = all.filter((c) => c.status === filter.status);
  if (filter?.flagged) all = all.filter((c) => c.flagged);
  return all;
}
export async function moderateComment(id: string, raw: unknown, actor: Actor) {
  assertActor(actor, 'editor');
  const status = z.enum(['pending', 'approved', 'rejected']).parse(raw);
  return change(actor, 'comment.' + status, id, (state) => {
    const c = state.comments.find((c) => c.id === id);
    if (!c) throw new HttpError(404, 'Comment not found');
    c.status = status;
  });
}
export async function getAssignments(status?: Assignment['status']) {
  const all = (await load()).assignments;
  return status ? all.filter((a) => a.status === status) : all;
}
export async function createAssignment(
  input: { beat: string; summary: string; dueDate?: string },
  actor: Actor,
) {
  const data = z
    .object({
      beat: z.string().trim().min(1).max(80),
      summary: z.string().trim().min(1).max(2000),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .parse(input);
  const id = 'a-' + randomUUID();
  return change(actor, 'assignment.create', id, (state) => {
    const a: Assignment = {
      ...data,
      id,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    state.assignments.push(a);
    return a;
  });
}
export async function claimAssignment(id: string, actor: Actor) {
  return change(actor, 'assignment.claim', id, (state) => {
    const a = state.assignments.find((a) => a.id === id);
    if (!a || a.status !== 'open')
      throw new HttpError(409, 'Assignment unavailable');
    a.status = 'claimed';
    a.reporterId = actor.id;
    a.reporterName = actor.name;
    return a;
  });
}
export async function getMedia() {
  return (await load()).media;
}
export async function getAlerts() {
  return (await load()).alerts;
}
export async function createAlert(
  input: { kind: Alert['kind']; headline: string; body?: string },
  actor: Actor,
) {
  assertActor(actor, 'editor');
  const data = z
    .object({
      kind: z.enum(['breaking', 'correction', 'note']),
      headline: z.string().trim().min(1).max(200),
      body: z.string().max(2000).optional(),
    })
    .parse(input);
  const id = 'al-' + randomUUID();
  return change(actor, 'alert.create', id, (state) => {
    const a: Alert = {
      ...data,
      id,
      live: true,
      createdAt: new Date().toISOString(),
      createdBy: actor.id,
    };
    state.alerts.push(a);
    return a;
  });
}
export async function toggleAlert(id: string, live: boolean, actor: Actor) {
  assertActor(actor, 'editor');
  return change(actor, 'alert.toggle', id, (state) => {
    const a = state.alerts.find((a) => a.id === id);
    if (!a) throw new HttpError(404, 'Alert not found');
    a.live = live;
  });
}
export async function deleteAlert(id: string, actor: Actor) {
  assertActor(actor, 'editor');
  return change(actor, 'alert.delete', id, (state) => {
    state.alerts = state.alerts.filter((a) => a.id !== id);
  });
}
