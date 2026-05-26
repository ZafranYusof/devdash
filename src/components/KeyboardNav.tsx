import { useState, useEffect, useCallback, useRef } from 'react';

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
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

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
          callbacksRef.current.onTop?.();
        }
        return;
      }

      switch (e.key) {
        case 'j':
          e.preventDefault();
          callbacksRef.current.onDown?.();
          break;
        case 'k':
          e.preventDefault();
          callbacksRef.current.onUp?.();
          break;
        case 'h':
          e.preventDefault();
          callbacksRef.current.onLeft?.();
          break;
        case 'l':
          e.preventDefault();
          callbacksRef.current.onRight?.();
          break;
        case 'Enter':
          e.preventDefault();
          callbacksRef.current.onEnter?.();
          break;
        case '/':
          e.preventDefault();
          callbacksRef.current.onSearch?.();
          break;
        case 'q':
          e.preventDefault();
          callbacksRef.current.onClose?.();
          break;
        case 'g':
          e.preventDefault();
          setPendingG(true);
          setTimeout(() => setPendingG(false), 1000);
          break;
        case 'G':
          e.preventDefault();
          callbacksRef.current.onBottom?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, pendingG]);
}
