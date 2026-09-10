import type { Meta, StoryObj } from '@storybook/react';
import PodcastMiniPlayer from './PodcastMiniPlayer';
import PodcastPlayer from './PodcastPlayer';
import { PodcastProvider } from './PodcastProvider';

const withProvider = (Story: React.FC) => (
  <PodcastProvider>
    <div style={{ paddingBottom: 80 }}>
      <Story />
    </div>
    <PodcastMiniPlayer />
  </PodcastProvider>
);

const meta = {
  title: 'Components/Podcast',
  tags: ['autodocs'],
  decorators: [withProvider as any],
} satisfies Meta;
export default meta;

export const SidebarCard: StoryObj = {
  render: () => <PodcastPlayer />,
  name: 'Sidebar card + mini player',
};
