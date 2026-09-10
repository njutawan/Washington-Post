'use server';

import { revalidatePath } from 'next/cache';
import { createAssignment, claimAssignment } from '@/lib/editorialStore';
import { requireActor } from '@/lib/editorialAuth.server';

export async function fileAssignment(fd: FormData): Promise<void> {
  const actor = await requireActor();
  const beat = String(fd.get('beat') || '').trim();
  const summary = String(fd.get('summary') || '').trim();
  if (!beat || !summary) return;
  createAssignment({ beat, summary, dueDate: String(fd.get('dueDate') || '') || undefined }, actor);
  revalidatePath('/editorial/assignments');
}

export async function claim(fd: FormData): Promise<void> {
  const actor = await requireActor();
  claimAssignment(String(fd.get('id') || ''), actor);
  revalidatePath('/editorial/assignments');
}
