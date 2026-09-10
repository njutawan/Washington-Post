'use client';

import { useEffect, useRef } from 'react';

/**
 * Minimal keyboard-focus trap that:
 *  - Focuses the first focusable element when active
 *  - Loops Tab/Shift+Tab within the container
 *  - Calls onClose on Escape
 *  - Returns focus to the previously-focused element on unmount
 *
 * Wrap any modal/dialog/lightbox with this. Renders a <div> so it can take a
 * ref without requiring forwardRef on your children.
 */
export default function FocusTrap({
  active,
  onClose,
  children,
  className = '',
  initialFocus,
}: {
  active: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const el = containerRef.current;
    if (!el) return;
    const node: HTMLElement = el;

    const focusables = node.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const desired = initialFocus?.current || first;
    desired?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (activeEl === first || !activeEl || !node.contains(activeEl)) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (activeEl === last || !activeEl || !node.contains(activeEl)) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore focus
      previouslyFocused.current?.focus?.();
    };
  }, [active, onClose, initialFocus]);

  if (!active) return <>{children}</>;
  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
