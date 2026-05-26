import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ProjectsView from './components/ProjectsView';
import DeploysView from './components/DeploysView';
import SettingsView from './components/SettingsView';
import UptimeView from './components/UptimeView';
import TimeView from './components/TimeView';
import DepsView from './components/DepsView';
import PortsView from './components/PortsView';
import CommandPalette from './components/CommandPalette';
import OnboardingWizard from './components/OnboardingWizard';
import ShortcutsOverlay from './components/ShortcutsOverlay';
import Toasts from './components/Toasts';
import AutomationsView from './components/AutomationsView';
import DbHealthView from './components/DbHealthView';
import MetricsView from './components/MetricsView';
import OfflineIndicator from './components/OfflineIndicator';
import ActivityLog from './components/ActivityLog';
import DashboardView from './components/DashboardView';
import OnboardingHints from './components/OnboardingHints';
import type { ProjectConfig } from './types';

// Lazy-loaded heavy components (Improvement #1)
const ChatView = lazy(() => import('./components/ChatView'));
const BuildCodeView = lazy(() => import('./components/BuildCodeView'));
const TemplateEditor = lazy(() => import('./components/TemplateEditor'));
const SnippetLibrary = lazy(() => import('./components/SnippetLibrary'));
const AICodeGen = lazy(() => import('./components/AICodeGen'));
const ZeroToLive = lazy(() => import('./components/ZeroToLive'));
const ProjectDetail = lazy(() => import('./components/ProjectDetail'));
const TemplateUpdates = lazy(() => import('./components/TemplateUpdates'));
const TemplateTest = lazy(() => import('./components/TemplateTest'));
const TemplateAnalytics = lazy(() => import('./components/TemplateAnalytics'));
const EnvManager = lazy(() => import('./components/EnvManager'));
const TerminalView = lazy(() => import('./components/TerminalView'));
const PerformanceView = lazy(() => import('./components/PerformanceView'));
const IncidentsView = lazy(() => import('./components/IncidentsView'));
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));
const TeamView = lazy(() => import('./components/TeamView'));
const PipelineView = lazy(() => import('./components/PipelineView'));
const PluginsView = lazy(() => import('./components/PluginsView'));
const MobileCompanion = lazy(() => import('./components/MobileCompanion'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#0070F3]" />
        <span className="text-xs text-[#666]">Loading...</span>
      </div>
    </div>
  );
}

type Tab = 'dashboard' | 'projects' | 'deploys' | 'uptime' | 'time' | 'deps' | 'automations' | 'dbhealth' | 'metrics' | 'ports' | 'build' | 'zerolive' | 'aigen' | 'templates' | 'snippets' | 'chat' | 'settings' | 'envmanager' | 'terminal' | 'performance' | 'incidents' | 'analytics' | 'team' | 'pipelines' | 'plugins' | 'mobile' | 'aiassistant';
type DetailTab = 'overview' | 'logs' | 'env' | 'time' | 'deps' | 'heatmap' | 'screenshots' | 'release';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [detail, setDetail] = useState<{ project: ProjectConfig; initialTab?: DetailTab } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [tabFade, setTabFade] = useState(true);

  const loadProjects = async () => {
    setProjects(await window.devdash.projects.list());
  };

  useEffect(() => {
    void loadProjects();
    void (async () => {
      const s = await window.devdash.settings.get();
      if (!s.onboardingComplete) setShowOnboarding(true);
    })();
    const h = () => setShowOnboarding(true);
    window.addEventListener('devdash:restart-onboarding', h);
    return () => window.removeEventListener('devdash:restart-onboarding', h);
  }, []);

  // Listen for custom tab switch events (from DashboardView quick actions)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setTab(detail as Tab);
    };
    window.addEventListener('devdash:switch-tab', handler);
    return () => window.removeEventListener('devdash:switch-tab', handler);
  }, []);

  // Apply theme from settings
  useEffect(() => {
    const applyTheme = async () => {
      const s = await window.devdash.settings.get();
      const pref = s.theme || 'dark';
      let effective: 'dark' | 'light';
      if (pref === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } else {
        effective = pref as 'dark' | 'light';
      }
      document.documentElement.setAttribute('data-theme', effective);
    };
    void applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const listener = () => void applyTheme();
    mq.addEventListener('change', listener);
    window.addEventListener('devdash:theme-changed', listener);
    return () => {
      mq.removeEventListener('change', listener);
      window.removeEventListener('devdash:theme-changed', listener);
    };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
      if (e.key === '?' && !paletteOpen) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const inInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
        if (!inInput) {
          e.preventDefault();
          setShortcutsOpen((p) => !p);
        }
      }
      // Ctrl+` toggle activity log
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setActivityLogOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [paletteOpen]);

  // Tab fade transition (Improvement #16)
  const handleTabChange = useCallback((newTab: Tab) => {
    setTabFade(false);
    setTimeout(() => {
      setTab(newTab);
      setTabFade(true);
    }, 100);
  }, []);

  const openProject = async (id: string, detailTab: DetailTab = 'overview') => {
    const list = await window.devdash.projects.list();
    setProjects(list);
    const project = list.find((p) => p.id === id);
    if (project) setDetail({ project, initialTab: detailTab });
  };

  return (
    <div className="relative flex h-screen w-screen flex-col bg-dash-bg text-dash-text">
      <TitleBar
        onMinimize={() => window.devdash.window.minimize()}
        onMaximize={() => window.devdash.window.maximizeToggle()}
        onClose={() => window.devdash.window.close()}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar tab={tab} onChange={handleTabChange} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className={`no-drag flex min-w-0 flex-1 flex-col overflow-hidden px-5 py-4 ${tabFade ? 'tab-fade-active' : 'tab-fade-enter'}`}>
            <OfflineIndicator />
            <Suspense fallback={<LazyFallback />}>
              {tab === 'dashboard' && <DashboardView />}
              {tab === 'projects' && <ProjectsView onOpenProject={openProject} />}
              {tab === 'deploys' && <DeploysView />}
              {tab === 'uptime' && <UptimeView onOpenProject={(id) => openProject(id, 'overview')} />}
              {tab === 'time' && <TimeView onOpenProject={(id) => openProject(id, 'time')} />}
              {tab === 'deps' && <DepsView onOpenProject={(id) => openProject(id, 'deps')} />}
              {tab === 'automations' && <AutomationsView />}
              {tab === 'dbhealth' && <DbHealthView />}
              {tab === 'metrics' && <MetricsView />}
              {tab === 'ports' && <PortsView onOpenProject={(id) => openProject(id, 'overview')} />}
              {tab === 'build' && <BuildCodeView onProjectCreated={() => void loadProjects()} />}
              {tab === 'zerolive' && <ZeroToLive onProjectCreated={() => void loadProjects()} />}
              {tab === 'aigen' && <AICodeGen />}
              {tab === 'templates' && (
                <div className="flex flex-col gap-6 overflow-y-auto">
                  <TemplateUpdates />
                  <TemplateTest />
                  <TemplateAnalytics />
                </div>
              )}
              {tab === 'snippets' && <SnippetLibrary />}
              {tab === 'envmanager' && <EnvManager />}
              {tab === 'terminal' && <TerminalView />}
              {tab === 'performance' && <PerformanceView />}
              {tab === 'incidents' && <IncidentsView />}
              {tab === 'analytics' && <AnalyticsView />}
              {tab === 'team' && <TeamView />}
              {tab === 'pipelines' && <PipelineView />}
              {tab === 'plugins' && <PluginsView />}
              {tab === 'mobile' && <MobileCompanion />}
              {tab === 'aiassistant' && <AIAssistant />}
              {tab === 'chat' && <ChatView />}
              {tab === 'settings' && <SettingsView />}
            </Suspense>
          </main>
          <ActivityLog open={activityLogOpen} onToggle={() => setActivityLogOpen((p) => !p)} />
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        projects={projects}
        onOpenProject={openProject}
        onSwitchTab={handleTabChange}
      />
      {detail && (
        <Suspense fallback={<LazyFallback />}>
          <ProjectDetail
            project={detail.project}
            initialTab={detail.initialTab}
            allProjects={projects}
            onClose={() => {
              setDetail(null);
              void loadProjects();
            }}
          />
        </Suspense>
      )}
      <Toasts />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            void loadProjects();
          }}
        />
      )}
      <OnboardingHints />
    </div>
  );
}
