import type { Meta, StoryObj } from '@storybook/react';
import ArticleImage from './ArticleImage';

const meta = {
  title: 'Components/Media/ArticleImage',
  component: ArticleImage,
  tags: ['autodocs'],
  args: {
    src: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
    alt: 'The U.S. Capitol at dusk',
    width: 640,
    height: 400,
    className: 'object-cover',
  },
} satisfies Meta<typeof ArticleImage>;
export default meta;

export const Default: StoryObj<typeof ArticleImage> = { name: 'Default' };
export const Rounded: StoryObj<typeof ArticleImage> = { args: { rounded: true } };
export const Priority: StoryObj<typeof ArticleImage> = { args: { priority: true } };
