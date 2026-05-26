import { useState, useEffect } from 'react';
import type { Tab } from '../types';

interface PinnedTab {
  id: string;
  label: string;
}

const PINNED_KEY = 'devdash-pinned-tabs';

function loadPinned(): string[] {
  try {
    const stored = localStorage.getItem(PINNED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function savePinned(pinned: string[]) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
}

export function usePinnedTabs() {
  const [pinned, setPinned] = useState<string[]>(loadPinned);

  useEffect(() => {
    savePinned(pinned);
  }, [pinned]);

  const pin = (tabId: string) => {
    setPinned((prev) => prev.includes(tabId) ? prev : [...prev, tabId]);
  };

  const unpin = (tabId: string) => {
    setPinned((prev) => prev.filter((id) => id !== tabId));
  };

  const isPinned = (tabId: string) => pinned.includes(tabId);

  const togglePin = (tabId: string) => {
    if (isPinned(tabId)) unpin(tabId);
    else pin(tabId);
  };

  return { pinned, pin, unpin, isPinned, togglePin };
}

interface ContextMenuProps {
  x: number;
  y: number;
  tabId: string;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onClose: () => void;
}

export function SidebarContextMenu({ x, y, tabId, isPinned, onPin, onUnpin, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 min-w-[140px] rounded-lg border border-[#222] bg-[#111] shadow-xl py-1"
      style={{ left: x, top: y }}
    >
      {isPinned ? (
        <button
          onClick={onUnpin}
          className="w-full text-left px-3 py-1.5 text-[11px] text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          Unpin
        </button>
      ) : (
        <button
          onClick={onPin}
          className="w-full text-left px-3 py-1.5 text-[11px] text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          📌 Pin to top
        </button>
      )}
    </div>
  );
}
