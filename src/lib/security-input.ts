import { z } from 'zod';
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const statusSchema = z.enum([
  'idea',
  'pitched',
  'assigned',
  'drafting',
  'editing',
  'ready',
  'published',
  'killed',
]);
export const prioritySchema = z.enum(['routine', 'urgent', 'breaking']);
export const newsletterIds = [
  'morning-mix',
  'politics',
  'opinions-today',
  'tech',
  'world',
  'food',
  'wellbeing',
  'sports',
  'business',
  'weekend',
  'evening-update',
  'post-reports',
  'politics-extra',
  'daily-202',
  'travel',
  'tech-friending',
  'book-club',
  'advice',
  'weather',
  'games',
] as const;
// z.object avoids arbitrary keys being interpolated into email / persisted.
export const newsletterSchema = z
  .object({
    preferences: z
      .object(
        Object.fromEntries(
          newsletterIds.map((id) => [id, z.boolean().optional()]),
        ),
      )
      .strict(),
  })
  .strict();
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z
    .string()
    .min(15)
    .max(128)
    .refine(
      (v) =>
        new Set(v.toLowerCase()).size >= 6 &&
        !/^(password|123456|qwerty|letmein|correcthorsebatterystaple)+$/i.test(
          v,
        ),
      'Choose a stronger passphrase',
    ),
  name: z.string().trim().min(1).max(80).optional(),
});
export const storyFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  dek: z.string().max(1000),
  kicker: z.string().max(100),
  category: z.string().trim().min(1).max(80),
  categorySlug: slugSchema,
  priority: prioritySchema,
  body: z.string().max(100000),
});
export function boundedForm(fd: FormData, max = 128 * 1024) {
  let size = 0;
  for (const [key, value] of fd.entries()) {
    if (typeof value !== 'string') throw new Error('File input is not allowed');
    size += Buffer.byteLength(key) + Buffer.byteLength(value);
    if (size > max) throw new Error('Form too large');
  }
}
