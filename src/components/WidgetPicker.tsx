import { useState, useEffect, useRef, useCallback } from 'react';

interface DashboardWidget {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'deploy-status', label: 'Deploy Status', enabled: true, order: 0 },
  { id: 'uptime-summary', label: 'Uptime Summary', enabled: true, order: 1 },
  { id: 'recent-activity', label: 'Recent Activity', enabled: true, order: 2 },
  { id: 'incidents', label: 'Incidents', enabled: true, order: 3 },
  { id: 'quick-actions', label: 'Quick Actions', enabled: true, order: 4 },
  { id: 'performance', label: 'Performance Scores', enabled: false, order: 5 },
  { id: 'cost-estimate', label: 'Cost Estimate', enabled: false, order: 6 },
];

const STORAGE_KEY = 'devdash-dashboard-widgets';

function loadWidgets(): DashboardWidget[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS;
}

function saveWidgets(widgets: DashboardWidget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadWidgets);

  useEffect(() => {
    saveWidgets(widgets);
  }, [widgets]);

  const toggleWidget = (id: string) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      if (newIdx === idx) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((w, i) => ({ ...w, order: i }));
    });
  };

  const reorderWidget = (fromIndex: number, toIndex: number) => {
    setWidgets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((w, i) => ({ ...w, order: i }));
    });
  };

  const resetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);

  return { widgets, enabledWidgets, toggleWidget, moveWidget, reorderWidget, resetWidgets };
}

interface WidgetPickerProps {
  open: boolean;
  onClose: () => void;
  widgets: DashboardWidget[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

export default function WidgetPicker({ open, onClose, widgets, onToggle, onMove, onReorder, onReset }: WidgetPickerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const draggedIdx = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    draggedIdx.current = index;
    setDragIndex(index);
    setDropIndex(null);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const items = containerRef.current.querySelectorAll('[data-widget-index]');
      let closest: number | null = null;
      let closestDist = Infinity;
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(ev.clientY - midY);
        if (dist < closestDist) {
          closestDist = dist;
          const idx = parseInt(el.getAttribute('data-widget-index') || '0');
          closest = ev.clientY > midY ? idx + 1 : idx;
        }
      });
      setDropIndex(closest);
    };

    const handleMouseUp = () => {
      if (dragging.current && draggedIdx.current !== null && dropIndex !== null) {
        let targetIdx = dropIndex;
        if (targetIdx > draggedIdx.current) targetIdx--;
        if (targetIdx !== draggedIdx.current) {
          onReorder(draggedIdx.current, targetIdx);
        }
      }
      dragging.current = false;
      draggedIdx.current = null;
      setDragIndex(null);
      setDropIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dropIndex, onReorder]);

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal-content w-[400px] overflow-hidden rounded-xl border border-[#222] bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
          <h2 className="text-sm font-medium text-white">Dashboard Widgets</h2>
          <button onClick={onClose} className="btn-icon">
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div ref={containerRef} className="p-4 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
          {widgets.map((widget, idx) => (
            <div key={widget.id} data-widget-index={idx} className="relative">
              {/* Drop indicator line */}
              {dropIndex === idx && dragIndex !== null && dragIndex !== idx && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[#0070F3] rounded" />
              )}
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  dragIndex === idx ? 'opacity-50 border-[#0070F3]' : 'border-[#1a1a1a] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Drag handle */}
                  <span
                    onMouseDown={(e) => handleMouseDown(e, idx)}
                    className="cursor-grab active:cursor-grabbing text-[#555] hover:text-white px-0.5 select-none"
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>
                  <input
                    type="checkbox"
                    checked={widget.enabled}
                    onChange={() => onToggle(widget.id)}
                    className="rounded border-[#333]"
                  />
                  <span className="text-xs text-white">{widget.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onMove(widget.id, 'up')} className="btn-ghost text-[10px]">↑</button>
                  <button onClick={() => onMove(widget.id, 'down')} className="btn-ghost text-[10px]">↓</button>
                </div>
              </div>
            </div>
          ))}
          {/* Drop indicator at the end */}
          {dropIndex === widgets.length && dragIndex !== null && (
            <div className="h-0.5 bg-[#0070F3] rounded" />
          )}
        </div>
        <div className="border-t border-[#222] px-4 py-2 flex justify-end">
          <button onClick={onReset} className="btn-soft">Reset Layout</button>
        </div>
      </div>
    </div>
  );
}
