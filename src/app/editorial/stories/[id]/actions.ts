'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  updateStory,
  deleteStory,
  publishStory,
  transitionStory,
} from '@/lib/editorialStore';
import { actionActor } from '@/lib/action-security';
import { storyFormSchema, idSchema } from '@/lib/security-input';
export async function saveStory(_prev: unknown, fd: FormData) {
  const actor = await actionActor(fd);
  const input = storyFormSchema.safeParse(
    Object.fromEntries(
      [
        'title',
        'slug',
        'dek',
        'kicker',
        'category',
        'categorySlug',
        'priority',
        'body',
      ].map((k) => [k, fd.get(k) || '']),
    ),
  );
  if (!input.success) return { error: 'Invalid story fields' };
  await updateStory(idSchema.parse(fd.get('id')), input.data, actor);
  revalidatePath('/editorial', 'layout');
  return { ok: true };
}
export async function transitionStatus(fd: FormData) {
  const actor = await actionActor(fd);
  const id = idSchema.parse(fd.get('id'));
  await transitionStory(id, fd.get('status'), actor);
  revalidatePath('/editorial', 'layout');
  redirect(`/editorial/stories/${id}`);
}
export async function publish(fd: FormData) {
  const actor = await actionActor(fd, 'editor');
  const story = await publishStory(idSchema.parse(fd.get('id')), actor);
  revalidatePath('/editorial', 'layout');
  revalidatePath(`/article/${story.slug}`);
  revalidatePath('/');
  redirect(`/article/${story.slug}`);
}
export async function removeStory(fd: FormData) {
  const actor = await actionActor(fd, 'admin');
  await deleteStory(idSchema.parse(fd.get('id')), actor);
  revalidatePath('/editorial', 'layout');
  redirect('/editorial/stories');
}
