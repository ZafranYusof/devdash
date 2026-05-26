import { useEffect, useState } from 'react';

interface Hint {
  id: string;
  text: string;
  target: string; // description of where it points
}

const HINTS: Hint[] = [
  { id: 'add-project', text: 'Click here to add your first project', target: 'Add button' },
  { id: 'ctrl-k', text: 'Use Ctrl+K to quickly jump anywhere', target: 'Command palette' },
  { id: 'shortcuts', text: 'Press ? to see all keyboard shortcuts', target: 'Shortcuts' },
];

const STORAGE_KEY = 'devdash-hints-shown';
const HINT_DELAY = 5000;

export default function OnboardingHints() {
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);
  const [shownHints, setShownHints] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    // Find next hint to show
    const remaining = HINTS.filter((h) => !shownHints.has(h.id));
    if (remaining.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentHint(remaining[0]);
    }, HINT_DELAY);

    return () => clearTimeout(timer);
  }, [shownHints]);

  const dismiss = () => {
    if (!currentHint) return;
    const next = new Set(shownHints);
    next.add(currentHint.id);
    setShownHints(next);
    setCurrentHint(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  if (!currentHint) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="hint-card relative rounded-lg border border-[#222] bg-[#1a1a1a] px-4 py-3 shadow-xl max-w-xs">
        <div className="flex items-start gap-3">
          <span className="text-[#0070F3] mt-0.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v4M8 11v0.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="text-xs text-white">{currentHint.text}</div>
            <div className="text-[10px] text-[#555] mt-0.5">{currentHint.target}</div>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-[#555] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
