import { useEffect, useMemo, useState } from 'react';
import type { DeployItem, ProjectConfig } from '../types';
import { AIDeploySummary } from './WhyDidThisFail';
import WhyDidThisFail from './WhyDidThisFail';
import DeployLogStream from './DeployLogStream';

type Filter = 'all' | 'ready' | 'error' | 'building';

export default function DeploysView() {
  const [items, setItems] = useState<DeployItem[]>([]);
  const [errors, setErrors] = useState<{ projectId: string; error: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [needsToken, setNeedsToken] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [bulkBusy, setBulkBusy] = useState<'vercel' | 'render' | 'all' | null>(null);
  const [toast, setToast] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    void (async () => {
      const list = await window.devdash.projects.list();
      setProjects(list);
    })();
  }, []);

  const triggerOne = async (projectId: string) => {
    const res = await window.devdash.deploys.trigger(projectId);
    return res;
  };

  const triggerBulk = async (kind: 'vercel' | 'render' | 'all') => {
    const targets = projects.filter((p) => {
      if (!p.deployId) return false;
      if (kind === 'all') return p.deployProvider === 'vercel' || p.deployProvider === 'render';
      return p.deployProvider === kind;
    });
    if (targets.length === 0) {
      setToast({ ok: 0, failed: 0, errors: [`No ${kind === 'all' ? '' : kind + ' '}projects with deploy IDs configured`] });
      return;
    }
    if (!confirm(`Trigger redeploy for ${targets.length} project${targets.length === 1 ? '' : 's'}?`)) return;
    setBulkBusy(kind);
    let ok = 0, failed = 0;
    const errs: string[] = [];
    for (const p of targets) {
      try {
        const res = await triggerOne(p.id);
        if (res.ok) ok++;
        else { failed++; errs.push(`${p.name}: ${res.error || 'unknown'}`); }
      } catch (err: any) {
        failed++;
        errs.push(`${p.name}: ${err?.message || 'failed'}`);
      }
    }
    setBulkBusy(null);
    setToast({ ok, failed, errors: errs });
    void refresh();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await window.devdash.settings.get();
      if (!cancelled) setNeedsToken(!settings.vercelToken && !settings.renderToken);
      const res = await window.devdash.deploys.list();
      if (cancelled) return;
      setItems(res.items);
      setErrors(res.errors);
      setLoading(false);
      if (res.items.length) setLastUpdatedAt(Date.now());
    })();

    const off = window.devdash.deploys.onUpdate((payload) => {
      setItems(payload.items);
      setErrors(payload.errors);
      setLastUpdatedAt(Date.now());
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  // Keyboard shortcuts (Improvement #3)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        void refresh();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await window.devdash.deploys.refresh();
      setItems(res.items);
      setErrors(res.errors);
      setLastUpdatedAt(Date.now());
      const settings = await window.devdash.settings.get();
      setNeedsToken(!settings.vercelToken && !settings.renderToken);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((d) => d.status === filter);
  }, [items, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-dash-text">Deploys</h1>
          <p className="text-xs text-dash-mute">
            {items.length} deployment{items.length === 1 ? '' : 's'} tracked
            {lastUpdatedAt ? ` · updated ${new Date(lastUpdatedAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'ready', 'building', 'error'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-[11px] capitalize transition ${
                filter === f
                  ? 'bg-dash-indigo/20 text-dash-indigoBright'
                  : 'text-dash-mute hover:text-dash-text'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="mx-1 text-dash-line">|</span>
          <button
            onClick={() => triggerBulk('all')}
            disabled={!!bulkBusy}
            className="rounded-md border border-dash-indigo/40 bg-dash-indigo/10 px-2.5 py-1 text-[11px] text-dash-indigoBright hover:bg-dash-indigo/20 disabled:opacity-50"
            title="Redeploy every project that has a deploy ID configured"
          >
            {bulkBusy === 'all' ? 'Triggering…' : 'Redeploy all'}
          </button>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-md bg-dash-indigo px-3 py-1.5 text-xs font-medium text-white hover:bg-dash-indigoBright disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {needsToken && (
        <div className="mb-3 rounded-md border border-dash-warn/40 bg-dash-warn/10 px-3 py-2 text-xs text-dash-text">
          No Vercel or Render token configured. Add one in the Settings tab to see live deploys.
        </div>
      )}

      {toast && (
        <div className={`mb-3 rounded-md border px-3 py-2 text-xs ${toast.failed === 0 ? 'border-dash-ok/40 bg-dash-ok/10 text-dash-ok' : 'border-dash-warn/40 bg-dash-warn/10 text-dash-warn'}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {toast.ok} succeeded · {toast.failed} failed
            </span>
            <button onClick={() => setToast(null)} className="text-[11px] hover:underline">Dismiss</button>
          </div>
          {toast.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {toast.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-3 rounded-md border border-dash-err/40 bg-dash-err/10 px-3 py-2 text-xs text-dash-text">
          <div className="mb-1 font-semibold text-dash-err">Provider errors</div>
          <ul className="ml-4 list-disc text-dash-mute">
            {errors.map((e, i) => (
              <li key={i}>
                {e.projectId}: {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-6 w-16 rounded-md" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-40 mb-1.5" />
                    <div className="skeleton h-3 w-64" />
                    <div className="skeleton h-3 w-32 mt-1" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="skeleton h-6 w-16" />
                    <div className="skeleton h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 16 16" className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <circle cx="8" cy="8" r="3" />
              <path d="M8 8 L12 5" />
            </svg>
            <div className="empty-state-title">
              {items.length === 0 ? 'No deploys tracked' : `No deploys match "${filter}"`}
            </div>
            <div className="empty-state-subtitle">
              {items.length === 0
                ? 'Register a project with a Vercel/Render ID, then refresh'
                : 'Try a different filter'}
            </div>
            {items.length === 0 && (
              <button onClick={refresh} className="btn-primary">Refresh</button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((d) => (
              <DeployRow key={`${d.provider}-${d.id}`} deploy={d} onRedeploy={() => triggerOne(d.projectId).then((r) => setToast({ ok: r.ok ? 1 : 0, failed: r.ok ? 0 : 1, errors: r.ok ? [] : [r.error || 'failed'] }))} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DeployRow({ deploy, onRedeploy }: { deploy: DeployItem; onRedeploy: () => void }) {
  const [logOpen, setLogOpen] = useState(false);
  const open = (url?: string) => {
    if (!url) return;
    void window.devdash.shell.openExternal(url);
  };

  return (
    <li className="card flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between hover:border-[#333]">
      <div className="flex items-start gap-3">
        <StatusBadge status={deploy.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-dash-text">{deploy.projectName}</span>
            <span className="rounded bg-dash-panel2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-dash-mute">
              {deploy.provider}
            </span>
            {deploy.target !== 'unknown' && (
              <span className="rounded bg-dash-panel2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-dash-mute">
                {deploy.target}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-dash-mute">
            {deploy.commitSha && (
              <span className="rounded bg-dash-panel/60 px-1.5 py-0.5 font-mono text-dash-indigoBright">
                {deploy.commitSha.slice(0, 7)}
              </span>
            )}
            {deploy.commitMessage && (
              <span className="max-w-[380px] truncate">{deploy.commitMessage}</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-dash-mute">
            {formatAgo(deploy.createdAt)} · duration {formatDuration(deploy.durationMs)}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {deploy.status === 'error' && (
          <AIDeploySummary projectName={deploy.projectName} />
        )}
        {deploy.status === 'error' && (
          <WhyDidThisFail
            deployId={deploy.id}
            projectName={deploy.projectName}
            onRetry={onRedeploy}
          />
        )}
        <button
          onClick={() => setLogOpen(true)}
          className="rounded-md border border-dash-line bg-dash-panel/60 px-2.5 py-1 text-[11px] text-dash-text hover:border-dash-indigo/60"
          title="View deploy log"
        >
          Log
        </button>
        <button
          onClick={() => {
            if (confirm(`Trigger a new deploy for ${deploy.projectName}?`)) onRedeploy();
          }}
          className="rounded-md border border-dash-indigo/40 bg-dash-indigo/10 px-2.5 py-1 text-[11px] text-dash-indigoBright hover:bg-dash-indigo/20"
          title="Trigger a new deploy on this provider"
        >
          Redeploy
        </button>
        {deploy.url && (
          <button
            onClick={() => open(deploy.url)}
            className="rounded-md border border-dash-line bg-dash-panel/60 px-2.5 py-1 text-[11px] text-dash-text hover:border-dash-indigo/60"
          >
            Preview
          </button>
        )}
        {deploy.dashboardUrl && (
          <button
            onClick={() => open(deploy.dashboardUrl)}
            className="rounded-md border border-dash-line bg-dash-panel/60 px-2.5 py-1 text-[11px] text-dash-text hover:border-dash-indigo/60"
          >
            Dashboard
          </button>
        )}
      </div>
      <DeployLogStream
        open={logOpen}
        onClose={() => setLogOpen(false)}
        deployId={deploy.id}
        projectName={deploy.projectName}
      />
    </li>
  );
}

function StatusBadge({ status }: { status: DeployItem['status'] }) {
  const map: Record<DeployItem['status'], { bg: string; label: string }> = {
    ready: { bg: 'bg-dash-ok/20 text-dash-ok', label: 'Ready' },
    error: { bg: 'bg-dash-err/20 text-dash-err', label: 'Error' },
    building: { bg: 'bg-dash-indigo/20 text-dash-indigoBright animate-pulseSlow', label: 'Building' },
    queued: { bg: 'bg-dash-warn/20 text-dash-warn', label: 'Queued' },
    canceled: { bg: 'bg-dash-mute/20 text-dash-mute', label: 'Canceled' },
    unknown: { bg: 'bg-dash-mute/20 text-dash-mute', label: '…' },
  };
  const entry = map[status];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

function formatAgo(ts: number) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function formatDuration(ms: number | null): string {
  if (!ms || ms < 0) return '—';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m${remSec ? ` ${remSec}s` : ''}`;
}
