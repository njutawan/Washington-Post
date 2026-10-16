// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), identity: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mocks.session }));
vi.mock('@/lib/db', () => ({ getStaffIdentity: mocks.identity }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw Error('REDIRECT');
  }),
}));
import * as story from '@/app/editorial/stories/[id]/actions';
import { create } from '@/app/editorial/stories/new/actions';
import * as alerts from '@/app/editorial/alerts/actions';
import * as assignments from '@/app/editorial/assignments/actions';
import { moderate } from '@/app/editorial/comments/actions';
import { requireActor } from '@/lib/editorialAuth.server';
import { GET as stats } from '@/app/api/analytics/stats/route';
const fd = () => {
  const form = new FormData();
  form.set('id', 'story-id');
  form.set('headline', 'Test');
  form.set('kind', 'breaking');
  form.set('live', 'true');
  return form;
};
const exportedActions: Record<string, () => Promise<unknown>> = {
  save: () => story.saveStory(null, fd()),
  transition: () => story.transitionStatus(fd()),
  publish: () => story.publish(fd()),
  remove: () => story.removeStory(fd()),
  create: () => create(fd()),
  postAlert: () => alerts.postAlert(fd()),
  toggleAlert: () => alerts.toggleAlert(fd()),
  removeAlert: () => alerts.removeAlert(fd()),
  fileAssignment: () => assignments.fileAssignment(fd()),
  claim: () => assignments.claim(fd()),
  moderate: () => moderate(fd()),
};
beforeEach(() => {
  mocks.session.mockReset();
  mocks.identity.mockReset();
  mocks.session.mockResolvedValue(null);
});
describe('all CMS action entry points enforce auth without UI/layout', () => {
  it.each(Object.keys(exportedActions))(
    'anonymous cannot call %s',
    async (name) => {
      await expect(exportedActions[name]()).rejects.toMatchObject({
        status: 401,
      });
    },
  );
  it.each(Object.keys(exportedActions))(
    'reader cannot call %s',
    async (name) => {
      mocks.session.mockResolvedValue({
        user: { id: 'reader', tenantId: 'local' },
      });
      mocks.identity.mockResolvedValue({ id: 'reader', role: 'reader' });
      await expect(exportedActions[name]()).rejects.toMatchObject({
        status: 403,
      });
    },
  );
  it('provider failure does not fall back or authorize', async () => {
    mocks.session.mockRejectedValue(Error('provider outage'));
    await expect(requireActor()).rejects.toThrow('outage');
  });
  it('foreign tenant session is denied even with a privileged DB identity', async () => {
    mocks.session.mockResolvedValue({
      user: { id: 'staff', tenantId: 'foreign' },
    });
    mocks.identity.mockResolvedValue({ id: 'staff', role: 'admin' });
    await expect(requireActor()).rejects.toMatchObject({ status: 401 });
    expect(mocks.identity).not.toHaveBeenCalled();
  });
  it('revoked role is re-read even with an existing session', async () => {
    mocks.session.mockResolvedValue({
      user: { id: 'staff', tenantId: 'local' },
    });
    mocks.identity.mockResolvedValue({ id: 'staff', role: 'admin' });
    await expect(requireActor('admin')).resolves.toHaveProperty(
      'role',
      'admin',
    );
    mocks.identity.mockResolvedValue({ id: 'staff', role: 'reader' });
    await expect(requireActor('admin')).rejects.toMatchObject({ status: 403 });
  });
  it('analytics returns 401/403/200 according to the server role', async () => {
    const req = new Request('http://localhost:3000/api/analytics/stats');
    expect((await stats(req, undefined)).status).toBe(401);
    mocks.session.mockResolvedValue({
      user: { id: 'staff', tenantId: 'local' },
    });
    mocks.identity.mockResolvedValue({ id: 'staff', role: 'reader' });
    expect((await stats(req, undefined)).status).toBe(403);
    mocks.identity.mockResolvedValue({ id: 'staff', role: 'editor' });
    const res = await stats(req, undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});
