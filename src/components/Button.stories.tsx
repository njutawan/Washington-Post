import type { Meta, StoryObj } from '@storybook/react';
import BookmarkButton from './BookmarkButton';
import ShareSheet from './ShareSheet';
import ThemeToggle from './ThemeToggle';

/**
 * Design-system stories. Rendered by `npm run storybook`.
 */
const meta = {
  title: 'Components/Buttons',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

export const BookmarkDefault: StoryObj<typeof BookmarkButton> = {
  render: () => <BookmarkButton slug="demo-article" />,
  name: 'BookmarkButton (default)',
};

export const BookmarkActive: StoryObj<typeof BookmarkButton> = {
  render: () => {
    // Pre-set localStorage to show the filled state
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wapo:bookmarks', JSON.stringify(['demo-article']));
    }
    return <BookmarkButton slug="demo-article" />;
  },
  name: 'BookmarkButton (bookmarked)',
};

export const ShareButton: StoryObj<typeof ShareSheet> = {
  render: () => <ShareSheet url="https://wapo.example.com/article/demo" title="Demo article" />,
  name: 'ShareSheet',
};

export const ThemeToggleButton: StoryObj<typeof ThemeToggle> = {
  render: () => <ThemeToggle />,
  name: 'ThemeToggle (light/dark)',
};
