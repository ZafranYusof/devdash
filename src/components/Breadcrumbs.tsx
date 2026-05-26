import { useMemo } from 'react';

type Tab = 'dashboard' | 'projects' | 'deploys' | 'uptime' | 'time' | 'deps' | 'automations' | 'dbhealth' | 'metrics' | 'ports' | 'build' | 'zerolive' | 'aigen' | 'templates' | 'snippets' | 'chat' | 'settings' | 'envmanager' | 'terminal' | 'performance' | 'incidents' | 'analytics' | 'team' | 'pipelines' | 'plugins' | 'mobile' | 'aiassistant';

interface BreadcrumbSegment {
  label: string;
  action?: () => void;
}

interface Props {
  tab: Tab;
  subView?: string;
  onNavigate: (tab: Tab) => void;
}

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  deploys: 'Deploys',
  uptime: 'Uptime',
  time: 'Time',
  deps: 'Deps',
  automations: 'Automations',
  dbhealth: 'DB Health',
  metrics: 'Metrics',
  ports: 'Ports',
  build: 'Build Code',
  zerolive: 'Zero to Live',
  aigen: 'AI Code Gen',
  templates: 'Templates',
  snippets: 'Snippets',
  chat: 'Chat',
  settings: 'Settings',
  envmanager: 'Env Manager',
  terminal: 'Terminal',
  performance: 'Performance',
  incidents: 'Incidents',
  analytics: 'Analytics',
  team: 'Team',
  pipelines: 'Pipelines',
  plugins: 'Plugins',
  mobile: 'Mobile',
  aiassistant: 'AI Assistant',
};

export default function Breadcrumbs({ tab, subView, onNavigate }: Props) {
  const segments = useMemo<BreadcrumbSegment[]>(() => {
    const segs: BreadcrumbSegment[] = [
      { label: 'Home', action: () => onNavigate('dashboard') },
    ];
    if (tab !== 'dashboard') {
      segs.push({
        label: TAB_LABELS[tab] || tab,
        action: subView ? () => onNavigate(tab) : undefined,
      });
    }
    if (subView) {
      segs.push({ label: subView });
    }
    return segs;
  }, [tab, subView, onNavigate]);

  // Only show when depth > 1
  if (segments.length <= 1) return null;

  return (
    <div className="breadcrumb-bar">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {seg.action ? (
            <button onClick={seg.action} className="hover:underline">
              {seg.label}
            </button>
          ) : (
            <span className="text-[#999]">{seg.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
