import type { Preview } from '@storybook/react';
import '../src/app/globals.css';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: { appDirectory: true },
    layout: 'centered',
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#faf9f6' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#121212' },
      ],
    },
    a11y: {
      // Optional a11y addon config
      manual: false,
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const dark = context.globals.theme === 'dark';
      React.useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
      }, [dark]);
      return (
        <div
          style={{
            background: dark ? '#121212' : '#faf9f6',
            color: dark ? '#f0ede6' : '#121212',
            padding: '1rem',
            minHeight: '100vh',
            fontFamily: 'Source Sans Pro, Arial, sans-serif',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
