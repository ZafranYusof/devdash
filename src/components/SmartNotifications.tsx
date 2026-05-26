import { useState, useEffect } from 'react';
import { useNotifications, type Notification } from './NotificationCenter';

type Priority = 'critical' | 'important' | 'info';

interface SmartNotification extends Notification {
  priority: Priority;
  muted: boolean;
}

const MUTE_RULES_KEY = 'devdash-notification-mute-rules';
const FOCUS_MODE_KEY = 'devdash-notification-focus-mode';

function loadMuteRules(): string[] {
  try {
    const stored = localStorage.getItem(MUTE_RULES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveMuteRules(rules: string[]) {
  localStorage.setItem(MUTE_RULES_KEY, JSON.stringify(rules));
}

function classifyPriority(n: Notification): Priority {
  if (n.type === 'error') return 'critical';
  if (n.title.toLowerCase().includes('down') || n.title.toLowerCase().includes('fail')) return 'critical';
  if (n.type === 'warning' || n.title.toLowerCase().includes('deploy') || n.title.toLowerCase().includes('incident')) return 'important';
  return 'info';
}

export function useSmartNotifications() {
  const { items, unreadCount, markAllRead, clearAll } = useNotifications();
  const [focusMode, setFocusMode] = useState(() => {
    try { return localStorage.getItem(FOCUS_MODE_KEY) === 'true'; } catch { return false; }
  });
  const [muteRules, setMuteRules] = useState<string[]>(loadMuteRules);

  useEffect(() => {
    localStorage.setItem(FOCUS_MODE_KEY, String(focusMode));
  }, [focusMode]);

  useEffect(() => {
    saveMuteRules(muteRules);
  }, [muteRules]);

  const smartItems: SmartNotification[] = items.map((n) => ({
    ...n,
    priority: classifyPriority(n),
    muted: muteRules.some((rule) => n.title.toLowerCase().includes(rule.toLowerCase())),
  }));

  const filteredItems = smartItems.filter((n) => {
    if (n.muted) return false;
    if (focusMode && n.priority === 'info') return false;
    return true;
  });

  const addMuteRule = (rule: string) => {
    setMuteRules((prev) => [...prev, rule]);
  };

  const removeMuteRule = (rule: string) => {
    setMuteRules((prev) => prev.filter((r) => r !== rule));
  };

  const toggleFocusMode = () => setFocusMode((p) => !p);

  const digest = () => {
    const now = Date.now();
    const last24h = smartItems.filter((n) => now - n.timestamp < 86400000);
    const critical = last24h.filter((n) => n.priority === 'critical').length;
    const important = last24h.filter((n) => n.priority === 'important').length;
    const info = last24h.filter((n) => n.priority === 'info').length;
    return { critical, important, info, total: last24h.length };
  };

  return {
    items: filteredItems,
    allItems: smartItems,
    unreadCount,
    markAllRead,
    clearAll,
    focusMode,
    toggleFocusMode,
    muteRules,
    addMuteRule,
    removeMuteRule,
    digest,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SmartNotificationCenter({ open, onClose }: Props) {
  const {
    items, focusMode, toggleFocusMode, muteRules, addMuteRule, removeMuteRule, markAllRead, clearAll, digest,
  } = useSmartNotifications();
  const [showMuteSettings, setShowMuteSettings] = useState(false);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    if (open) markAllRead();
  }, [open]);

  if (!open) return null;

  const summary = digest();

  const priorityIcon = (p: Priority) => {
    switch (p) {
      case 'critical': return <span className="text-[#EE0000]">●</span>;
      case 'important': return <span className="text-[#F5A623]">●</span>;
      default: return <span className="text-[#0070F3]">●</span>;
    }
  };

  const priorityBadge = (p: Priority) => {
    const colors: Record<Priority, string> = {
      critical: 'bg-[#EE0000]/10 text-[#EE0000]',
      important: 'bg-[#F5A623]/10 text-[#F5A623]',
      info: 'bg-[#0070F3]/10 text-[#0070F3]',
    };
    return colors[p];
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="notification-dropdown absolute right-0 top-full mt-1 z-50 w-96 max-h-[480px] overflow-hidden rounded-lg border border-[#222] bg-[#111] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222] px-3 py-2">
          <span className="text-xs font-medium text-white">Smart Notifications</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFocusMode}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${focusMode ? 'bg-[#0070F3]/20 text-[#0070F3]' : 'text-[#666] hover:text-white'}`}
              title="Focus Mode: only show critical"
            >
              Focus {focusMode ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setShowMuteSettings(!showMuteSettings)} className="text-[10px] text-[#666] hover:text-white">
              ⚙
            </button>
            <button onClick={clearAll} className="text-[10px] text-[#666] hover:text-white">
              Clear
            </button>
          </div>
        </div>

        {/* Daily digest */}
        <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-3 py-1.5 text-[10px]">
          <span className="text-[#666]">24h:</span>
          <span className="text-[#EE0000]">{summary.critical} critical</span>
          <span className="text-[#F5A623]">{summary.important} important</span>
          <span className="text-[#0070F3]">{summary.info} info</span>
        </div>

        {/* Mute settings */}
        {showMuteSettings && (
          <div className="border-b border-[#1a1a1a] px-3 py-2">
            <div className="text-[10px] text-[#666] mb-1">Mute Rules (hide notifications containing):</div>
            <div className="flex flex-wrap gap-1 mb-1">
              {muteRules.map((rule) => (
                <span key={rule} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#888]">
                  {rule}
                  <button onClick={() => removeMuteRule(rule)} className="text-[#555] hover:text-[#EE0000]">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Add mute keyword..."
                className="flex-1 bg-transparent border border-[#333] rounded px-2 py-0.5 text-[10px] text-white focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRule.trim()) {
                    addMuteRule(newRule.trim());
                    setNewRule('');
                  }
                }}
              />
              <button
                onClick={() => { if (newRule.trim()) { addMuteRule(newRule.trim()); setNewRule(''); } }}
                className="btn-soft"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-[#555]">
              {focusMode ? 'No critical notifications' : 'No notifications'}
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex items-start gap-2 border-b border-[#1a1a1a] px-3 py-2 hover:bg-white/[0.02]">
                <span className="mt-0.5 text-xs">{priorityIcon(n.priority)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white truncate">{n.title}</span>
                    <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${priorityBadge(n.priority)}`}>
                      {n.priority}
                    </span>
                  </div>
                  {n.body && <div className="text-[10px] text-[#666] mt-0.5 truncate">{n.body}</div>}
                  <div className="text-[9px] text-[#444] mt-0.5">
                    {formatTime(n.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
