import type { Meta, StoryObj } from '@storybook/react';
import NewsletterSignup from './NewsletterSignup';

const meta: Meta<typeof NewsletterSignup> = {
  title: 'Components/NewsletterSignup',
  component: NewsletterSignup,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof NewsletterSignup>;

export const Default: Story = {};
export const Large: Story = { args: { variant: 'large' } };
