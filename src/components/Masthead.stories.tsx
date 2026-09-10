import type { Meta, StoryObj } from '@storybook/react';
import Masthead from './Masthead';
import { SessionProvider } from 'next-auth/react';

const meta: Meta<typeof Masthead> = {
  title: 'Components/Masthead',
  component: Masthead,
  decorators: [
    (Story) => (
      <SessionProvider>
        <div className="min-h-[200px] bg-wp-cream">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Masthead>;

export const Default: Story = {};
