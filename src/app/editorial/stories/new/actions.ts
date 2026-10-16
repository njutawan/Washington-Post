'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createStory } from '@/lib/editorialStore';
import { actionActor } from '@/lib/action-security';
import { prioritySchema } from '@/lib/security-input';
export async function create(fd: FormData) {
  const actor = await actionActor(fd);
  const s = await createStory(
    {
      title: String(fd.get('title') || ''),
      category: String(fd.get('category') || ''),
      categorySlug: String(fd.get('categorySlug') || ''),
      dek: String(fd.get('dek') || ''),
      kicker: String(fd.get('kicker') || ''),
      priority: prioritySchema.parse(fd.get('priority') || 'routine'),
    },
    actor,
  );
  revalidatePath('/editorial', 'layout');
  redirect(`/editorial/stories/${s.id}`);
}
