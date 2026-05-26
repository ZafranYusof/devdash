import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  body?: string;
  timestamp: number;
  read: boolean;
}

let notificationListeners: Array<(n: Notification) => void> = [];
let notifications: Notification[] = [];

export function pushNotification(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const entry: Notification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    read: false,
  };
  notifications = [entry, ...notifications].slice(0, 50);
  notificationListeners.forEach((cb) => cb(entry));
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>(notifications);

  useEffect(() => {
    const handler = () => setItems([...notifications]);
    notificationListeners.push(handler);
    return () => {
      notificationListeners = notificationListeners.filter((h) => h !== handler);
    };
  }, []);

  const markAllRead = () => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    setItems([...notifications]);
  };

  const clearAll = () => {
    notifications = [];
    setItems([]);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, unreadCount, markAllRead, clearAll };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ open, onClose }: Props) {
  const { items, unreadCount, markAllRead, clearAll } = useNotifications();

  useEffect(() => {
    if (open) markAllRead();
  }, [open]);

  if (!open) return null;

  const typeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <span className="text-[#00C853]">●</span>;
      case 'error': return <span className="text-[#EE0000]">●</span>;
      case 'warning': return <span className="text-[#F5A623]">●</span>;
      default: return <span className="text-[#0070F3]">●</span>;
    }
  };

  const typeBadge = (type: Notification['type']) => {
    const colors: Record<string, string> = {
      success: 'bg-[#00C853]/10 text-[#00C853]',
      error: 'bg-[#EE0000]/10 text-[#EE0000]',
      warning: 'bg-[#F5A623]/10 text-[#F5A623]',
      info: 'bg-[#0070F3]/10 text-[#0070F3]',
    };
    return colors[type] || colors.info;
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="notification-dropdown absolute right-0 top-full mt-1 z-50 w-80 max-h-[420px] overflow-hidden rounded-lg border border-[#222] bg-[#111] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[#222] px-3 py-2">
          <span className="text-xs font-medium text-white">Notifications</span>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-[#666] hover:text-white transition-colors">
                Clear all
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-[#555]">No notifications</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex items-start gap-2 border-b border-[#1a1a1a] px-3 py-2 hover:bg-white/[0.02]">
                <span className="mt-0.5 text-xs">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white truncate">{n.title}</span>
                    <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${typeBadge(n.type)}`}>
                      {n.type}
                    </span>
                  </div>
                  {n.body && <div className="text-[10px] text-[#666] mt-0.5 truncate">{n.body}</div>}
                  <div className="text-[9px] text-[#444] mt-0.5">{formatTime(n.timestamp)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
