import type { Meta, StoryObj } from '@storybook/react';
import { ArticleCard } from './ArticleCard';
import { getAllArticles } from '@/lib/data';

const meta: Meta<typeof ArticleCard> = {
  title: 'Components/ArticleCard',
  component: ArticleCard,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof ArticleCard>;

const article = getAllArticles()[0];
const articleNoImg = getAllArticles().find((a) => !a.image) || article;

export const LargeWithImage: Story = { args: { article: article!, variant: 'large' } };
export const SmallNoImage: Story = { args: { article: articleNoImg!, variant: 'small' } };
