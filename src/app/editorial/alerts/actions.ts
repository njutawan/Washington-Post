'use server';
import { revalidatePath } from 'next/cache';
import {
  createAlert,
  toggleAlert as toggle,
  deleteAlert,
} from '@/lib/editorialStore';
import { actionActor } from '@/lib/action-security';
import { z } from 'zod';
export async function postAlert(fd: FormData): Promise<void> {
  const actor = await actionActor(fd, 'editor');
  await createAlert(
    {
      kind: z.enum(['breaking', 'correction', 'note']).parse(fd.get('kind')),
      headline: String(fd.get('headline') || ''),
      body: String(fd.get('body') || ''),
    },
    actor,
  );
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}
export async function toggleAlert(fd: FormData): Promise<void> {
  const actor = await actionActor(fd, 'editor');
  const live = z.enum(['true', 'false']).parse(fd.get('live')) === 'true';
  await toggle(String(fd.get('id') || ''), live, actor);
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}
export async function removeAlert(fd: FormData): Promise<void> {
  const actor = await actionActor(fd, 'editor');
  await deleteAlert(String(fd.get('id') || ''), actor);
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}
