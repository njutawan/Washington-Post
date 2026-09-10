import type { Meta, StoryObj } from '@storybook/react';
import AdSlot from './AdSlot';

const meta = {
  title: 'Components/Ads/AdSlot',
  component: AdSlot,
  tags: ['autodocs'],
} satisfies Meta<typeof AdSlot>;
export default meta;

export const Leaderboard: StoryObj<typeof AdSlot> = { args: { slot: 'top-banner' } };
export const MPU: StoryObj<typeof AdSlot> = { args: { slot: 'mid-article' } };
export const Sidebar: StoryObj<typeof AdSlot> = { args: { slot: 'sidebar' } };
export const StickySidebar: StoryObj<typeof AdSlot> = { args: { slot: 'sticky-sidebar' } };
