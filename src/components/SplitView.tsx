import { useState, useRef, useCallback, useEffect } from 'react';

type Tab = 'dashboard' | 'projects' | 'deploys' | 'uptime' | 'time' | 'deps' | 'automations' | 'dbhealth' | 'metrics' | 'ports' | 'build' | 'zerolive' | 'aigen' | 'templates' | 'snippets' | 'chat' | 'settings' | 'envmanager' | 'terminal' | 'performance' | 'incidents' | 'analytics' | 'team' | 'pipelines' | 'plugins' | 'mobile' | 'aiassistant';

interface Props {
  leftTab: Tab;
  rightTab: Tab;
  onLeftTabChange: (tab: Tab) => void;
  onRightTabChange: (tab: Tab) => void;
  onClose: () => void;
  children: (tab: Tab) => React.ReactNode;
}

const TAB_OPTIONS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'deploys', label: 'Deploys' },
  { id: 'uptime', label: 'Uptime' },
  { id: 'time', label: 'Time' },
  { id: 'deps', label: 'Deps' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'settings', label: 'Settings' },
];

export default function SplitView({ leftTab, rightTab, onLeftTabChange, onRightTabChange, onClose, children }: Props) {
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, pct)));
    };
    const handleUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Left pane */}
      <div className="flex flex-col overflow-hidden" style={{ width: `${splitRatio}%` }}>
        <div className="flex items-center gap-2 border-b border-[#222] px-2 py-1">
          <select
            value={leftTab}
            onChange={(e) => onLeftTabChange(e.target.value as Tab)}
            className="bg-[#111] border border-[#333] rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
          >
            {TAB_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-auto px-3 py-2">
          {children(leftTab)}
        </div>
      </div>

      {/* Divider */}
      <div className="split-divider" onMouseDown={handleMouseDown} />

      {/* Right pane */}
      <div className="flex flex-col overflow-hidden" style={{ width: `${100 - splitRatio}%` }}>
        <div className="flex items-center justify-between gap-2 border-b border-[#222] px-2 py-1">
          <select
            value={rightTab}
            onChange={(e) => onRightTabChange(e.target.value as Tab)}
            className="bg-[#111] border border-[#333] rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
          >
            {TAB_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button onClick={onClose} className="btn-icon" title="Close split view">
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto px-3 py-2">
          {children(rightTab)}
        </div>
      </div>
    </div>
  );
}
