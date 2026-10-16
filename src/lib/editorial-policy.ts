import { atLeast, type Actor } from './editorialAuth';
import { tenantId } from './security-config';
import { HttpError } from './http-security';
import type { Story, StoryStatus } from './editorialStore';
export function assertActor(
  actor: Actor,
  min: 'author' | 'editor' | 'admin' = 'author',
) {
  if (actor.tenantId !== tenantId() || !atLeast(actor.role, min))
    throw new HttpError(403, 'Forbidden');
}
export function assertOwner(actor: Actor, story: Story) {
  assertActor(actor);
  if (actor.role === 'author' && story.authorId !== actor.id)
    throw new HttpError(403, 'Not your story');
}
export function assertTransition(
  actor: Actor,
  story: Story,
  next: StoryStatus,
) {
  assertOwner(actor, story);
  // Publishing has exactly one path: publishStory checks editor + ready state.
  if (next === 'published') throw new HttpError(403, 'Use the publish action');
  const transitions: Record<StoryStatus, StoryStatus[]> = {
    idea: ['pitched'],
    pitched: ['assigned', 'drafting', 'killed'],
    assigned: ['drafting'],
    drafting: ['editing', 'killed'],
    editing: ['ready', 'drafting'],
    ready: ['editing'],
    published: [],
    killed: ['idea'],
  };
  if (!transitions[story.status]?.includes(next))
    throw new HttpError(409, 'Invalid state transition');
  if (story.status === 'killed') assertActor(actor, 'admin');
  if (
    actor.role === 'author' &&
    ![
      'idea:pitched',
      'pitched:drafting',
      'assigned:drafting',
      'drafting:editing',
    ].includes(story.status + ':' + next)
  ) {
    throw new HttpError(403, 'Editor approval required');
  }
}
