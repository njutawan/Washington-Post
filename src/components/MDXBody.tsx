/**
 * Server-side MDX renderer. With `@next/mdx` Next auto-discovers
 * `src/mdx-components.tsx` and applies the useMDXComponents mapping at
 * render time — no client-side MDXProvider needed. Content is compiled as a
 * server component so we simply render it here.
 */
export default function MDXBody({ Content }: { Content: React.ComponentType }) {
  return <Content />;
}
