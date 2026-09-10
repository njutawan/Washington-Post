'use server';

import { revalidatePath } from 'next/cache';
import { createAlert, getAlerts, upsertAlert, deleteAlert } from '@/lib/editorialStore';
import { requireActor } from '@/lib/editorialAuth.server';

export async function postAlert(fd: FormData): Promise<void> {
  const u = await requireActor('editor');
  const headline = String(fd.get('headline') || '').trim();
  if (!headline) return;
  createAlert({ kind: String(fd.get('kind') || 'breaking') as any, headline, body: String(fd.get('body') || '') || undefined }, u);
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}

export async function toggleAlert(fd: FormData): Promise<void> {
  await requireActor('editor');
  const id = String(fd.get('id') || '');
  const live = String(fd.get('live')) === 'true';
  const list = getAlerts();
  const a = list.find((x) => x.id === id);
  if (a) { a.live = live; upsertAlert(a); }
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}

export async function removeAlert(fd: FormData): Promise<void> {
  await requireActor('editor');
  deleteAlert(String(fd.get('id') || ''));
  revalidatePath('/editorial/alerts');
  revalidatePath('/');
}
