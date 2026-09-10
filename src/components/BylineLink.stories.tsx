import type { Meta, StoryObj } from '@storybook/react';
import BylineLink from './BylineLink';

const meta: Meta<typeof BylineLink> = {
  title: 'Components/BylineLink',
  component: BylineLink,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BylineLink>;

export const SingleAuthor: Story = { args: { byline: 'By David Ignatius' } };
export const MultipleAuthors: Story = { args: { byline: 'By Karen Tumulty and Eugene Robinson' } };
export const WireStory: Story = { args: { byline: 'Associated Press' } };
