import { useEffect, useState } from 'react';
import type { Toast } from '../types';
import { pushNotification } from './NotificationCenter';
import { logActivity } from './ActivityLog';

export function showError(title: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const event = new CustomEvent('devdash:toast', {
    detail: { type: 'error', title, body: message },
  });
  window.dispatchEvent(event);
}

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const off = window.devdash.deploys.onToast((payload) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const toast: Toast = {
        id,
        type: payload.type,
        title: payload.title,
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
      // Push to notification center and activity log
      pushNotification({ type: payload.type, title: payload.title });
      logActivity('deploy-toast', `${payload.title} (${payload.projectId})`);
    });
    return () => off();
  }, []);

  // Listen for custom toast events (from showError helper)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: Toast['type']; title: string; body?: string };
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const toast: Toast = { id, type: detail.type, title: detail.title, body: detail.body };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
      pushNotification({ type: detail.type, title: detail.title, body: detail.body });
      logActivity('toast', detail.title);
    };
    window.addEventListener('devdash:toast', handler);
    return () => window.removeEventListener('devdash:toast', handler);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const borderColor =
          t.type === 'error'
            ? 'border-l-[#EE0000]'
            : t.type === 'success'
            ? 'border-l-[#00C853]'
            : t.type === 'warning'
            ? 'border-l-[#F5A623]'
            : 'border-l-[#0070F3]';

        const progressColor =
          t.type === 'error'
            ? 'bg-[#EE0000]'
            : t.type === 'success'
            ? 'bg-[#00C853]'
            : t.type === 'warning'
            ? 'bg-[#F5A623]'
            : 'bg-[#0070F3]';

        return (
          <div
            key={t.id}
            className={`toast pointer-events-auto relative min-w-[260px] max-w-sm overflow-hidden rounded-lg border border-[#222] border-l-4 ${borderColor} bg-[#111] px-3.5 py-2.5 text-xs shadow-xl`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {t.type === 'error' && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-[#EE0000]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v4M8 11v0.5" strokeLinecap="round" />
                    </svg>
                  )}
                  <span className="font-medium text-white">{t.title}</span>
                </div>
                {t.body && <div className="mt-0.5 text-[11px] text-[#888]">{t.body}</div>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-[#555] hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a1a]">
              <div className={`toast-progress h-full ${progressColor} opacity-60`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
