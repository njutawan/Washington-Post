'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getStoryById, upsertStory, deleteStory, publishStory } from '@/lib/editorialStore';
import { requireActor } from '@/lib/editorialAuth.server';

export async function saveStory(_prev: unknown, fd: FormData) {
  const actor = await requireActor();
  const id = String(fd.get('id') || '');
  const existing = getStoryById(id);
  if (!existing) return { error: 'Story not found' };
  const updated = { ...existing };
  const title = String(fd.get('title') || '').trim();
  if (!title) return { error: 'Headline is required' };
  updated.title = title;
  updated.dek = String(fd.get('dek') || '') || undefined;
  updated.kicker = String(fd.get('kicker') || '') || undefined;
  updated.category = String(fd.get('category') || existing.category);
  updated.categorySlug = String(fd.get('categorySlug') || existing.categorySlug);
  updated.slug = String(fd.get('slug') || existing.slug);
  updated.priority = String(fd.get('priority') || 'routine') as any;
  const body = String(fd.get('body') || '');
  updated.wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  updated.bodyPreview = body.slice(0, 400);
  if (actor.role === 'author' && existing.authorId && existing.authorId !== actor.id) {
    return { error: 'You can only edit your own stories.' };
  }
  upsertStory(updated);
  revalidatePath('/editorial', 'layout');
  return { ok: true };
}

export async function transitionStatus(fd: FormData) {
  const actor = await requireActor();
  const id = String(fd.get('id') || '');
  const next = String(fd.get('status') || '') as any;
  const s = getStoryById(id);
  if (!s) return;
  if (actor.role === 'author' && s.authorId && s.authorId !== actor.id) return;
  if (next === 'editing' && actor.role === 'author') return;
  s.status = next;
  if (s.status === 'editing' && !s.editorId) { s.editorId = actor.id; s.editorName = actor.name; }
  if ((s.status === 'drafting' || s.status === 'pitched') && !s.authorId) { s.authorId = actor.id; s.authorName = actor.name; }
  upsertStory(s);
  revalidatePath('/editorial', 'layout');
  redirect(`/editorial/stories/${id}`);
}

export async function publish(fd: FormData) {
  const actor = await requireActor('editor');
  const id = String(fd.get('id') || '');
  publishStory(id, actor);
  revalidatePath('/editorial', 'layout');
  revalidatePath('/');
  redirect(`/article/${getStoryById(id)?.slug || id}`);
}

export async function removeStory(fd: FormData) {
  const actor = await requireActor('admin');
  const id = String(fd.get('id') || '');
  deleteStory(id);
  revalidatePath('/editorial', 'layout');
  redirect('/editorial/stories?status=killed');
}
