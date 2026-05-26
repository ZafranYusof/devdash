import { useState, useEffect, useRef } from 'react';

export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

let activityEntries: ActivityEntry[] = [];
let activityListeners: Array<() => void> = [];

export function logActivity(action: string, details: string) {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    action,
    details,
  };
  activityEntries = [...activityEntries, entry].slice(-100);
  activityListeners.forEach((cb) => cb());
}

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(activityEntries);

  useEffect(() => {
    const handler = () => setEntries([...activityEntries]);
    activityListeners.push(handler);
    return () => {
      activityListeners = activityListeners.filter((h) => h !== handler);
    };
  }, []);

  return entries;
}

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function ActivityLog({ open, onToggle }: Props) {
  const entries = useActivityLog();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length, open]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`border-t border-[#222] bg-[#0A0A0A] transition-all duration-200 ${open ? 'h-48' : 'h-7'}`}>
      {/* Toggle bar */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-1 text-[10px] text-[#666] hover:text-white hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 13V2M2 13h12" strokeLinecap="round" />
            <path d="M5 11V7M8 11V4M11 11V9" strokeLinecap="round" />
          </svg>
          Activity Log
          {entries.length > 0 && <span className="text-[#444]">({entries.length})</span>}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-[#333] bg-[#111] px-1 py-0.5 font-mono text-[9px] text-[#555]">Ctrl+`</kbd>
          <svg viewBox="0 0 16 16" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Log content */}
      {open && (
        <div className="activity-log-panel h-[calc(100%-28px)] overflow-y-auto px-1">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[11px] text-[#444]">
              No activity yet
            </div>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="log-entry">
                <span className="shrink-0 text-[#444] w-16">{formatTime(e.timestamp)}</span>
                <span className="shrink-0 text-[#0070F3] w-28 truncate">{e.action}</span>
                <span className="text-[#888] truncate">{e.details}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
