'use server';
import { revalidatePath } from 'next/cache';
import { createAssignment, claimAssignment } from '@/lib/editorialStore';
import { actionActor } from '@/lib/action-security';
export async function fileAssignment(fd: FormData): Promise<void> {
  const actor = await actionActor(fd);
  await createAssignment(
    {
      beat: String(fd.get('beat') || ''),
      summary: String(fd.get('summary') || ''),
      dueDate: String(fd.get('dueDate') || '') || undefined,
    },
    actor,
  );
  revalidatePath('/editorial/assignments');
}
export async function claim(fd: FormData): Promise<void> {
  const actor = await actionActor(fd);
  await claimAssignment(String(fd.get('id') || ''), actor);
  revalidatePath('/editorial/assignments');
}
