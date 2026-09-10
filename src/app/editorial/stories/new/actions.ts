'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createStory } from '@/lib/editorialStore';
import { requireActor } from '@/lib/editorialAuth.server';

export async function create(fd: FormData) {
  const actor = await requireActor();
  const title = String(fd.get('title') || '').trim();
  if (!title) return { error: 'Headline required' };
  const category = String(fd.get('category') || 'Politics');
  const categorySlug = String(fd.get('categorySlug') || category.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  const s = createStory(
    { title, category, categorySlug, kicker: String(fd.get('kicker') || '') || undefined, dek: String(fd.get('dek') || '') || undefined, priority: String(fd.get('priority') || 'routine') as any, status: 'drafting' },
    actor,
  );
  revalidatePath('/editorial', 'layout');
  redirect(`/editorial/stories/${s.id}`);
}
