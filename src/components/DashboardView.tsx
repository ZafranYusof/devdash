import { useEffect, useState } from 'react';
import type { ProjectConfig, DeployItem, UptimeSummary } from '../types';
import { useActivityLog } from './ActivityLog';
import WidgetPicker, { useDashboardWidgets } from './WidgetPicker';
import AIChangelog from './AIChangelog';

export default function DashboardView() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [deploys, setDeploys] = useState<DeployItem[]>([]);
  const [uptime, setUptime] = useState<UptimeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);
  const activityEntries = useActivityLog();
  const { widgets, enabledWidgets, toggleWidget, moveWidget, resetWidgets } = useDashboardWidgets();

  useEffect(() => {
    void (async () => {
      try {
        const [pList, dList, uList] = await Promise.all([
          window.devdash.projects.list(),
          window.devdash.deploys.list(),
          window.devdash.uptime.all(),
        ]);
        setProjects(pList);
        setDeploys(dList.items);
        setUptime(uList);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalProjects = projects.length;
  const activeDeploys = deploys.filter((d) => d.status === 'building' || d.status === 'queued').length;
  const avgUptime = uptime.length > 0
    ? Math.round(uptime.reduce((sum, u) => sum + u.uptimePct24h, 0) / uptime.length)
    : 0;
  const recentCommits = deploys.filter((d) => d.commitSha).slice(0, 10).length;

  const deployReady = deploys.filter((d) => d.status === 'ready').length;
  const deployBuilding = deploys.filter((d) => d.status === 'building' || d.status === 'queued').length;
  const deployError = deploys.filter((d) => d.status === 'error').length;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Header with widget picker */}
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setWidgetPickerOpen(true)} className="btn-soft">
          ⚙ Widgets
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Total Projects" value={totalProjects} icon={<FolderIcon />} color="#0070F3" />
        <KPICard label="Active Deploys" value={activeDeploys} icon={<RocketIcon />} color="#F5A623" />
        <KPICard label="Avg Uptime" value={`${avgUptime}%`} icon={<PulseIcon />} color="#00C853" />
        <KPICard label="Recent Commits" value={recentCommits} icon={<CommitIcon />} color="#9333EA" />
      </div>

      {/* Middle: Recent Activity */}
      <div className="card p-4">
        <h3 className="text-xs font-medium text-white mb-3">Recent Activity</h3>
        {activityEntries.length === 0 ? (
          <div className="text-[11px] text-[#555] py-4 text-center">No activity recorded yet</div>
        ) : (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {activityEntries.slice(-10).reverse().map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-[#1a1a1a] last:border-0">
                <span className="text-[#444] font-mono w-14 shrink-0">
                  {new Date(e.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[#0070F3] w-24 shrink-0 truncate">{e.action}</span>
                <span className="text-[#888] truncate">{e.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Deploy status breakdown */}
        <div className="card p-4">
          <h3 className="text-xs font-medium text-white mb-3">Deploy Status</h3>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <StatusBar label="Ready" count={deployReady} total={deploys.length} color="#00C853" />
              <StatusBar label="Building" count={deployBuilding} total={deploys.length} color="#F5A623" />
              <StatusBar label="Error" count={deployError} total={deploys.length} color="#EE0000" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{deploys.length}</div>
              <div className="text-[10px] text-[#666]">total</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-4">
          <h3 className="text-xs font-medium text-white mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction label="Add Project" icon="+" onClick={() => window.dispatchEvent(new CustomEvent('devdash:open-add-project'))} />
            <QuickAction label="Deploy All" icon="▲" onClick={() => window.dispatchEvent(new CustomEvent('devdash:deploy-all'))} />
            <QuickAction label="Check Uptime" icon="♥" onClick={() => void window.devdash.uptime.runNow()} />
            <QuickAction label="Open Chat" icon="💬" onClick={() => window.dispatchEvent(new CustomEvent('devdash:switch-tab', { detail: 'chat' }))} />
          </div>
        </div>
      </div>

      {/* AI Changelog */}
      {deploys.length > 0 && (
        <div className="card p-4">
          <AIChangelog projectName={projects[0]?.name || 'Project'} deploys={deploys.map((d) => ({ commitMessage: d.commitMessage, createdAt: d.createdAt, status: d.status }))} />
        </div>
      )}

      {/* Widget Picker Modal */}
      <WidgetPicker
        open={widgetPickerOpen}
        onClose={() => setWidgetPickerOpen(false)}
        widgets={widgets}
        onToggle={toggleWidget}
        onMove={moveWidget}
        onReset={resetWidgets}
      />
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: string | number; icon: JSX.Element; color: string }) {
  return (
    <div className="card card-interactive p-3 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-[10px] text-[#666]">{label}</div>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#888] w-14">{label}</span>
      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-[#666] w-6 text-right">{count}</span>
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-interactive flex items-center gap-2 rounded-md border border-[#222] bg-[#0A0A0A] px-3 py-2 text-[11px] text-[#888] hover:border-[#333] hover:text-white hover:bg-white/[0.03] transition-all"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 4a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2c0 0 4 2 4 7l-1.5 2H5.5L4 9c0-5 4-7 4-7z" strokeLinejoin="round" />
      <circle cx="8" cy="7" r="1" />
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

function CommitIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v4M8 11v4" strokeLinecap="round" />
    </svg>
  );
}
