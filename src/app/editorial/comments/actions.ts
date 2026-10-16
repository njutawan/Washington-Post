'use server';
import { revalidatePath } from 'next/cache';
import { moderateComment } from '@/lib/editorialStore';
import { actionActor } from '@/lib/action-security';
export async function moderate(fd: FormData): Promise<void> {
  const actor = await actionActor(fd, 'editor');
  await moderateComment(String(fd.get('id') || ''), fd.get('status'), actor);
  revalidatePath('/editorial/comments');
}
