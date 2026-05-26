import { useState } from 'react';

type Tab = 'projects' | 'deploys' | 'uptime' | 'time' | 'deps' | 'automations' | 'dbhealth' | 'metrics' | 'ports' | 'build' | 'zerolive' | 'aigen' | 'templates' | 'snippets' | 'chat' | 'settings';

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

interface SidebarSection {
  label: string;
  items: { id: Tab; label: string; icon: JSX.Element }[];
}

export default function Sidebar({ tab, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const sections: SidebarSection[] = [
    {
      label: 'MAIN',
      items: [
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
      ],
    },
    {
      label: 'BUILD',
      items: [
        { id: 'build', label: 'Build Code', icon: <BuildIcon /> },
        { id: 'zerolive', label: 'Zero to Live', icon: <RocketIcon /> },
        { id: 'aigen', label: 'AI Code Gen', icon: <SparkleIcon /> },
        { id: 'templates', label: 'Templates', icon: <LayersIcon /> },
        { id: 'snippets', label: 'Snippets', icon: <SnippetIcon /> },
      ],
    },
    {
      label: 'OTHER',
      items: [
        { id: 'automations', label: 'Automations', icon: <BoltIcon /> },
        { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
        { id: 'settings', label: 'Settings', icon: <GearIcon /> },
      ],
    },
  ];

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
              {section.items.map((it) => {
                const active = it.id === tab;
                return (
                  <button
                    key={it.id}
                    onClick={() => onChange(it.id)}
                    title={collapsed ? it.label : undefined}
                    className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
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
            <p className="mt-1.5">
              <kbd className="rounded border border-[#333] bg-[#111] px-1 py-0.5 font-mono text-[10px] text-[#666]">Ctrl</kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border border-[#333] bg-[#111] px-1 py-0.5 font-mono text-[10px] text-[#666]">K</kbd>
              <span className="ml-1">palette</span>
            </p>
          </div>
        ) : (
          <div className="text-[9px] text-[#333] font-mono text-center">0.25</div>
        )}
      </div>
    </aside>
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
