'use server';

import { revalidatePath } from 'next/cache';
import { moderateComment } from '@/lib/editorialStore';
import { requireActor } from '@/lib/editorialAuth.server';

export async function moderate(fd: FormData): Promise<void> {
  await requireActor('editor');
  const id = String(fd.get('id') || '');
  const status = String(fd.get('status') || 'pending') as any;
  moderateComment(id, status);
  revalidatePath('/editorial/comments');
}
