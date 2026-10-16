// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  createStory,
  updateStory,
  transitionStory,
  publishStory,
  deleteStory,
  getStoryById,
  emptyEditorial,
} from '@/lib/editorialStore';
import { mutateDocument } from '@/lib/storage';
import type { Actor } from '@/lib/editorialAuth';
const actor = (
  id: string,
  role: Actor['role'] = 'author',
  tenantId = 'local',
): Actor => ({ id, name: id, email: id + '@example.invalid', role, tenantId });
const a = actor('author-a'),
  b = actor('author-b'),
  editor = actor('editor', 'editor'),
  admin = actor('admin', 'admin');
const draft = () =>
  createStory(
    { title: 'Safe headline', category: 'Test', categorySlug: 'test' },
    a,
  );
const input = {
  title: 'Updated',
  slug: 'safe-slug',
  category: 'Test',
  categorySlug: 'test',
  priority: 'routine' as const,
  body: 'Plain text <script>not executable MDX</script>',
  dek: '',
  kicker: '',
};
describe('CMS server-side invariants', () => {
  it.each([
    '../escape',
    '../../outside',
    '/tmp/a',
    '..\\escape',
    '%2e%2e%2foutside',
    'a/b',
    'a\\b',
    'a..b',
    '',
    'a'.repeat(101),
  ])('rejects slug %s before persistence', async (slug) => {
    const s = await draft();
    await expect(updateStory(s.id, { ...input, slug }, a)).rejects.toThrow();
    expect((await getStoryById(s.id))?.slug).toBe(s.slug);
  });
  it('allows own valid edits, denies other authors and unassigned stories', async () => {
    const s = await draft();
    await expect(updateStory(s.id, input, b)).rejects.toThrow('Not your story');
    await expect(updateStory(s.id, input, a)).resolves.toHaveProperty(
      'slug',
      'safe-slug',
    );
    await mutateDocument('editorial', emptyEditorial(), (db) => {
      delete db.stories.find((x) => x.id === s.id)!.authorId;
    });
    await expect(updateStory(s.id, input, a)).rejects.toThrow('Not your story');
  });
  it('denies reader/foreign tenant, enforces state order, only editor publishes ready', async () => {
    await expect(
      createStory(
        { title: 'x', category: 'x', categorySlug: 'x' },
        actor('reader', 'reader'),
      ),
    ).rejects.toThrow('Forbidden');
    await expect(
      createStory(
        { title: 'x', category: 'x', categorySlug: 'x' },
        actor('foreign', 'admin', 'other'),
      ),
    ).rejects.toThrow('Forbidden');
    const s = await draft();
    await expect(transitionStory(s.id, 'published', a)).rejects.toThrow(
      'publish',
    );
    await expect(transitionStory(s.id, 'made-up', editor)).rejects.toThrow();
    await expect(transitionStory(s.id, 'ready', editor)).rejects.toThrow(
      'Invalid state',
    );
    await expect(publishStory(s.id, editor)).rejects.toThrow('ready');
    await transitionStory(s.id, 'editing', a);
    await expect(transitionStory(s.id, 'ready', a)).rejects.toThrow('Editor');
    await transitionStory(s.id, 'ready', editor);
    await expect(publishStory(s.id, a)).rejects.toThrow('Forbidden');
    const live = await publishStory(s.id, editor);
    expect(live.status).toBe('published');
    await expect(updateStory(s.id, input, editor)).rejects.toThrow('locked');
    await expect(deleteStory(s.id, editor)).rejects.toThrow('Forbidden');
    await deleteStory(s.id, admin);
    expect(await getStoryById(s.id)).toBeNull();
  });
  it('rejects collisions between distinct stories', async () => {
    const x = await draft(),
      y = await draft();
    await updateStory(x.id, { ...input, slug: 'unique' }, a);
    await expect(
      updateStory(y.id, { ...input, slug: 'unique' }, a),
    ).rejects.toThrow('Slug already');
  });
});
