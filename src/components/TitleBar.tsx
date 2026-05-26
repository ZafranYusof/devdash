import { useState } from 'react';
import NotificationCenter, { useNotifications } from './NotificationCenter';

interface Props {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export default function TitleBar({ onMinimize, onMaximize, onClose }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <header className="drag flex h-9 items-center justify-between border-b border-[#1a1a1a] bg-[#0A0A0A] px-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex h-4 w-4 items-center justify-center">
          <LogoMark />
        </span>
        <span className="font-semibold tracking-tight text-white">DevDash</span>
        <span className="text-[10px] font-mono text-[#333]">v0.25.1</span>
      </div>
      <div className="no-drag flex items-center gap-0.5">
        {/* Notification bell */}
        <div className="relative">
          <button
            title="Notifications"
            onClick={() => setNotifOpen((p) => !p)}
            className="rounded px-2.5 py-1 text-[#555] hover:bg-white/[0.06] hover:text-white transition-all duration-150 active:scale-[0.95] relative"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M8 1.5a4 4 0 014 4v3l1.5 2H2.5L4 8.5v-3a4 4 0 014-4z" strokeLinejoin="round" />
              <path d="M6.5 12.5a1.5 1.5 0 003 0" strokeLinecap="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0070F3] text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
          )}
        </div>

        <button
          title="Minimize"
          onClick={onMinimize}
          className="rounded px-2.5 py-1 text-[#555] hover:bg-white/[0.06] hover:text-white transition-all duration-150 active:scale-[0.95]"
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="currentColor">
            <rect x="0" y="4.5" width="10" height="1" rx="0.5" />
          </svg>
        </button>
        <button
          title="Maximize / restore"
          onClick={onMaximize}
          className="rounded px-2.5 py-1 text-[#555] hover:bg-white/[0.06] hover:text-white transition-all duration-150 active:scale-[0.95]"
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="1" width="8" height="8" rx="1" />
          </svg>
        </button>
        <button
          title="Close"
          onClick={onClose}
          className="rounded px-2.5 py-1 text-[#555] hover:bg-[#EE0000]/80 hover:text-white transition-all duration-150 active:scale-[0.95]"
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <rect x="1" y="3" width="10" height="2.2" rx="1" fill="#EDEDED" />
      <rect x="1" y="6.9" width="7" height="2.2" rx="1" fill="#888" />
      <rect x="1" y="10.8" width="12" height="2.2" rx="1" fill="#0070F3" />
    </svg>
  );
}
