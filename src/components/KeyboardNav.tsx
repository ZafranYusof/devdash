import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'devdash-keyboard-nav';

export function useKeyboardNav() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { enabled, toggle };
}

interface Props {
  enabled: boolean;
}

export default function KeyboardNavIndicator({ enabled }: Props) {
  if (!enabled) return null;
  return <div className="vim-indicator">VIM</div>;
}

export function useVimBindings(enabled: boolean, callbacks: {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onEnter?: () => void;
  onSearch?: () => void;
  onClose?: () => void;
  onTop?: () => void;
  onBottom?: () => void;
}) {
  const [pendingG, setPendingG] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (inInput) return;

      if (pendingG) {
        setPendingG(false);
        if (e.key === 'g') {
          e.preventDefault();
          callbacks.onTop?.();
        }
        return;
      }

      switch (e.key) {
        case 'j':
          e.preventDefault();
          callbacks.onDown?.();
          break;
        case 'k':
          e.preventDefault();
          callbacks.onUp?.();
          break;
        case 'h':
          e.preventDefault();
          callbacks.onLeft?.();
          break;
        case 'l':
          e.preventDefault();
          callbacks.onRight?.();
          break;
        case 'Enter':
          e.preventDefault();
          callbacks.onEnter?.();
          break;
        case '/':
          e.preventDefault();
          callbacks.onSearch?.();
          break;
        case 'q':
          e.preventDefault();
          callbacks.onClose?.();
          break;
        case 'g':
          e.preventDefault();
          setPendingG(true);
          setTimeout(() => setPendingG(false), 1000);
          break;
        case 'G':
          e.preventDefault();
          callbacks.onBottom?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, callbacks, pendingG]);
}
