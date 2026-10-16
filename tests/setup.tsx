import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
  usePathname: () => '/',
  notFound: vi.fn(),
}));

// Stub next/image for jsdom tests
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Stub next/font
vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-sans', className: 'font-inter' }),
  Playfair_Display: () => ({ variable: '--font-serif-display', className: 'font-playfair' }),
}));
vi.mock('next/font/local', () => ({
  default: () => ({ variable: '--font-local', className: 'font-local' }),
}));

// Test storage must never touch a developer's accounts/editorial data.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'vitest';
const testData = mkdtempSync(join(tmpdir(), 'wp-unit-'));
vi.stubEnv('LOCAL_DATA_DIR', testData);
vi.stubEnv('APP_TENANT_ID', 'local');
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
vi.stubEnv('DATABASE_URL', '');
afterAll(() => { rmSync(testData, { recursive: true, force: true }); });
