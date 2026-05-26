import { useState, useRef, useEffect, useCallback } from 'react';

type Tab = 'dashboard' | 'projects' | 'deploys' | 'uptime' | 'time' | 'deps' | 'automations' | 'dbhealth' | 'metrics' | 'ports' | 'build' | 'zerolive' | 'aigen' | 'templates' | 'snippets' | 'chat' | 'settings' | 'envmanager' | 'terminal' | 'performance' | 'incidents' | 'analytics' | 'team' | 'pipelines' | 'plugins' | 'mobile' | 'aiassistant';

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

interface NavItem {
  id: Tab;
  label: string;
  icon: JSX.Element;
}

interface SidebarSection {
  label: string;
  items: NavItem[];
}

const DEFAULT_SECTIONS: SidebarSection[] = [
  {
    label: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <DashIcon /> },
      { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
      { id: 'deploys', label: 'Deploys', icon: <RadarIcon /> },
      { id: 'uptime', label: 'Uptime', icon: <PulseIcon /> },
    ],
  },
  {
    label: 'MONITORING',
    items: [
      { id: 'time', label: 'Time', icon: <ClockIcon /> },
      { id: 'deps', label: 'Deps', icon: <BoxIcon /> },
      { id: 'ports', label: 'Ports', icon: <PortIcon /> },
      { id: 'dbhealth', label: 'DB Health', icon: <DbIcon /> },
      { id: 'metrics', label: 'Metrics', icon: <ChartIcon /> },
      { id: 'envmanager', label: 'Env Manager', icon: <EnvIcon /> },
      { id: 'performance', label: 'Performance', icon: <GaugeIcon /> },
      { id: 'incidents', label: 'Incidents', icon: <AlertIcon /> },
      { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    ],
  },
  {
    label: 'BUILD',
    items: [
      { id: 'build', label: 'Build Code', icon: <BuildIcon /> },
      { id: 'zerolive', label: 'Zero to Live', icon: <RocketIcon /> },
      { id: 'aigen', label: 'AI Code Gen', icon: <SparkleIcon /> },
      { id: 'pipelines', label: 'Pipelines', icon: <PipelineIcon /> },
      { id: 'aiassistant', label: 'AI Assistant', icon: <BrainIcon /> },
      { id: 'templates', label: 'Templates', icon: <LayersIcon /> },
      { id: 'snippets', label: 'Snippets', icon: <SnippetIcon /> },
      { id: 'terminal', label: 'Terminal', icon: <TerminalIcon /> },
    ],
  },
  {
    label: 'OTHER',
    items: [
      { id: 'automations', label: 'Automations', icon: <BoltIcon /> },
      { id: 'team', label: 'Team', icon: <TeamIcon /> },
      { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
      { id: 'mobile', label: 'Mobile', icon: <MobileIcon /> },
      { id: 'settings', label: 'Settings', icon: <GearIcon /> },
      { id: 'plugins', label: 'Plugins', icon: <PluginIcon /> },
    ],
  },
];

const STORAGE_KEY = 'devdash-sidebar-order';

function loadOrder(): Tab[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function saveOrder(order: Tab[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch { /* ignore */ }
}

function getAllItems(): NavItem[] {
  return DEFAULT_SECTIONS.flatMap((s) => s.items);
}

function reorderSections(customOrder: Tab[] | null): SidebarSection[] {
  if (!customOrder) return DEFAULT_SECTIONS;
  const allItems = getAllItems();
  const itemMap = new Map(allItems.map((it) => [it.id, it]));
  // Rebuild sections preserving section structure but reordering items within
  // For simplicity, flatten all items and reorder, then re-group into original sections
  const orderedItems: NavItem[] = [];
  for (const id of customOrder) {
    const item = itemMap.get(id);
    if (item) orderedItems.push(item);
  }
  // Add any missing items at the end
  for (const item of allItems) {
    if (!customOrder.includes(item.id)) orderedItems.push(item);
  }
  // Re-group into sections based on original section membership
  const sectionMap = new Map<string, Set<Tab>>();
  for (const s of DEFAULT_SECTIONS) {
    sectionMap.set(s.label, new Set(s.items.map((i) => i.id)));
  }
  const result: SidebarSection[] = DEFAULT_SECTIONS.map((s) => ({ label: s.label, items: [] }));
  for (const item of orderedItems) {
    for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
      if (sectionMap.get(DEFAULT_SECTIONS[i].label)?.has(item.id)) {
        result[i].items.push(item);
        break;
      }
    }
  }
  return result;
}

export default function Sidebar({ tab, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [customOrder, setCustomOrder] = useState<Tab[] | null>(loadOrder);
  const [dragItem, setDragItem] = useState<Tab | null>(null);
  const [dropTarget, setDropTarget] = useState<{ section: number; index: number } | null>(null);
  const dragRef = useRef<{ startY: number; itemId: Tab } | null>(null);

  const sections = reorderSections(customOrder);

  const handleDragStart = useCallback((e: React.MouseEvent, itemId: Tab) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, itemId };
    setDragItem(itemId);

    const handleMove = (ev: MouseEvent) => {
      // Find drop target based on mouse position
      const elements = document.querySelectorAll('[data-sidebar-item]');
      let closest: { section: number; index: number } | null = null;
      let closestDist = Infinity;
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(ev.clientY - midY);
        if (dist < closestDist) {
          closestDist = dist;
          const s = parseInt(el.getAttribute('data-section') || '0');
          const i = parseInt(el.getAttribute('data-index') || '0');
          closest = { section: s, index: ev.clientY > midY ? i + 1 : i };
        }
      });
      setDropTarget(closest);
    };

    const handleUp = () => {
      if (dragRef.current && dropTarget !== null) {
        // Apply reorder
        const allItems = sections.flatMap((s) => s.items.map((i) => i.id));
        const fromIdx = allItems.indexOf(dragRef.current.itemId);
        if (fromIdx >= 0) {
          const newOrder = [...allItems];
          newOrder.splice(fromIdx, 1);
          // Calculate flat target index
          let flatTarget = 0;
          for (let s = 0; s < dropTarget.section; s++) {
            flatTarget += sections[s].items.length;
          }
          flatTarget += dropTarget.index;
          if (flatTarget > fromIdx) flatTarget--;
          newOrder.splice(Math.max(0, flatTarget), 0, dragRef.current.itemId);
          setCustomOrder(newOrder);
          saveOrder(newOrder);
        }
      }
      setDragItem(null);
      setDropTarget(null);
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [sections, dropTarget]);

  const resetOrder = () => {
    setCustomOrder(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <aside className={`no-drag flex flex-col border-r border-[#222] bg-[#0A0A0A] py-3 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 pb-3 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <span className="text-sm font-semibold text-white tracking-tight">DevDash</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      <div className="h-px bg-[#222] mx-2 mb-1" />

      {/* Navigation */}
      <nav className="flex flex-col flex-1 overflow-y-auto px-1.5">
        {sections.map((section, sIdx) => (
          <div key={section.label}>
            {sIdx > 0 && <div className="h-px bg-[#1a1a1a] mx-2 my-1.5" />}
            {!collapsed && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((it, iIdx) => {
                const active = it.id === tab;
                const isDragging = dragItem === it.id;
                return (
                  <button
                    key={it.id}
                    data-sidebar-item
                    data-section={sIdx}
                    data-index={iIdx}
                    onClick={() => onChange(it.id)}
                    onMouseDown={(e) => {
                      if (e.button === 0 && !collapsed) handleDragStart(e, it.id);
                    }}
                    title={collapsed ? it.label : undefined}
                    className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''} ${isDragging ? 'sidebar-item-dragging' : ''}`}
                  >
                    <span className={`sidebar-icon flex h-4 w-4 shrink-0 items-center justify-center ${active ? 'text-white' : 'text-[#666]'}`}>
                      {it.icon}
                    </span>
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="h-px bg-[#222] mx-2 mt-1.5 mb-2" />
      <div className={`px-3 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div className="text-[10px] leading-relaxed text-[#444]">
            <p className="flex items-center justify-between">
              <span>Solo dev companion</span>
              <span className="font-mono text-[#333]">v0.25.1</span>
            </p>
            <p className="mt-1.5 flex items-center justify-between">
              <span>
                <kbd className="rounded border border-[#333] bg-[#111] px-1 py-0.5 font-mono text-[10px] text-[#666]">Ctrl</kbd>
                <span className="mx-0.5">+</span>
                <kbd className="rounded border border-[#333] bg-[#111] px-1 py-0.5 font-mono text-[10px] text-[#666]">K</kbd>
                <span className="ml-1">palette</span>
              </span>
              {customOrder && (
                <button onClick={resetOrder} className="text-[9px] text-[#555] hover:text-white transition-colors" title="Reset sidebar order">
                  ↺
                </button>
              )}
            </p>
          </div>
        ) : (
          <div className="text-[9px] text-[#333] font-mono text-center">0.25</div>
        )}
      </div>
    </aside>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="3" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="7" width="5" height="7" rx="1" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 4a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <path d="M8 8 L12 5" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8h3l2-4 3 8 2-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 2" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" strokeLinejoin="round" />
      <path d="M2 5l6 3 6-3M8 8v7" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V12H3a1 1 0 01-1-1V4z" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" strokeLinejoin="round" />
    </svg>
  );
}

function DbIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="3.5" rx="5" ry="1.75" />
      <path d="M3 3.5v9c0 0.97 2.24 1.75 5 1.75s5-0.78 5-1.75v-9" />
      <path d="M3 8c0 0.97 2.24 1.75 5 1.75s5-0.78 5-1.75" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 13V2M2 13h12" strokeLinecap="round" />
      <path d="M5 11V7M8 11V4M11 11V9" strokeLinecap="round" />
    </svg>
  );
}

function PortIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="12" height="6" rx="1.5" />
      <path d="M5 5V3M11 5V3" strokeLinecap="round" />
      <circle cx="5.5" cy="8" r="0.6" fill="currentColor" />
      <circle cx="8" cy="8" r="0.6" fill="currentColor" />
      <circle cx="10.5" cy="8" r="0.6" fill="currentColor" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12l3-3 2 2 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6h3v3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2c0 0 4 2 4 7l-1.5 2H5.5L4 9c0-5 4-7 4-7z" strokeLinejoin="round" />
      <circle cx="8" cy="7" r="1" />
      <path d="M5.5 11l-1 3M10.5 11l1 3" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M12.5 3.5l-1.5 1.5M5 11l-1.5 1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2L2 5.5 8 9l6-3.5L8 2z" strokeLinejoin="round" />
      <path d="M2 8l6 3.5L14 8" strokeLinejoin="round" />
      <path d="M2 11l6 3.5 6-3.5" strokeLinejoin="round" />
    </svg>
  );
}

function SnippetIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 4l-3 4 3 4M11 4l3 4-3 4M9 2l-2 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EnvIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 6h6M5 8h4M5 10h5" strokeLinecap="round" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4 7l2.5 2L4 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 11H12" strokeLinecap="round" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10a6 6 0 1112 0" strokeLinecap="round" />
      <path d="M8 10l2-4" strokeLinecap="round" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1L1 14h14L8 1z" strokeLinejoin="round" />
      <path d="M8 6v3.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 13h12" strokeLinecap="round" />
      <path d="M3 10l3-3 2 2 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="2.5" />
      <path d="M3 14c0-2.5 2.2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
      <circle cx="12.5" cy="4.5" r="1.5" />
      <path d="M14 10.5c0-1-.8-1.8-1.5-2.2" strokeLinecap="round" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
      <path d="M4.5 8h2M9.5 8h2" strokeLinecap="round" />
      <path d="M2 4h12M2 12h12" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

function PluginIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="10" height="8" rx="1.5" />
      <path d="M6 6V4.5a2 2 0 014 0V6" />
      <circle cx="8" cy="10.5" r="1.5" />
      <path d="M8 12v1" strokeLinecap="round" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="1.5" width="8" height="13" rx="1.5" />
      <path d="M7 12.5h2" strokeLinecap="round" />
      <path d="M4 3.5h8M4 11h8" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 14V8" strokeLinecap="round" />
      <path d="M5.5 3.5a2.5 2.5 0 015 0" />
      <path d="M4 6.5a2 2 0 00-.5 3.5c.5.5 1.5.5 2.5.5" strokeLinecap="round" />
      <path d="M12 6.5a2 2 0 01.5 3.5c-.5.5-1.5.5-2.5.5" strokeLinecap="round" />
      <path d="M5 5c-.8 0-1.5.5-1.8 1.2" strokeLinecap="round" />
      <path d="M11 5c.8 0 1.5.5 1.8 1.2" strokeLinecap="round" />
    </svg>
  );
}
