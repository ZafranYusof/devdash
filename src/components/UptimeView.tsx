import { useEffect, useState } from 'react';
import type { UptimeSummary, ProjectConfig } from '../types';

interface Props {
  onOpenProject: (id: string) => void;
}

export default function UptimeView({ onOpenProject }: Props) {
  const [summaries, setSummaries] = useState<UptimeSummary[]>([]);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    const [sums, prjs] = await Promise.all([
      window.devdash.uptime.all(),
      window.devdash.projects.list(),
    ]);
    setSummaries(sums);
    setProjects(prjs);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      const sums = await window.devdash.uptime.runNow();
      setSummaries(sums);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-dash-text">Uptime</h1>
          <p className="text-xs text-dash-mute">
            Live URLs monitored {summaries.length === 1 ? '' : '·'} scheduled checks run in the background
          </p>
        </div>
        <button onClick={runNow} disabled={running} className="btn-primary">
          {running ? 'Checking…' : 'Run checks now'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-2 w-2 rounded-full" />
                    <div className="skeleton h-4 w-28" />
                  </div>
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-3 w-48 mb-2" />
                <div className="skeleton h-10 w-full mb-2" />
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 16 16" className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 8h3l2-4 3 8 2-4h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="empty-state-title">No uptime monitors</div>
            <div className="empty-state-subtitle">Add a live URL to a project to start monitoring</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {summaries.map((s) => {
              const project = projects.find((p) => p.id === s.projectId);
              if (!project) return null;
              return (
                <div
                  key={s.projectId}
                  onClick={() => onOpenProject(s.projectId)}
                  className={`card cursor-pointer p-4 ${s.latestOk === false ? 'card-status-err' : s.latestOk === true ? 'card-status-ok' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          s.latestOk === true
                            ? 'bg-dash-ok animate-pulse'
                            : s.latestOk === false
                            ? 'bg-dash-err'
                            : 'bg-dash-mute'
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-dash-text">{project.name}</h3>
                    </div>
                    <span className={`text-sm font-bold ${
                      (s.uptimePct24h ?? 0) >= 99 ? 'text-dash-ok' : (s.uptimePct24h ?? 0) >= 95 ? 'text-dash-warn' : 'text-dash-err'
                    }`}>{s.uptimePct24h}%</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-dash-indigoBright">{s.url ?? '—'}</p>
                  <Sparkline
                    points={s.samples.map((x) => x.latencyMs)}
                    fails={s.samples.map((x) => x.ok === 0)}
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-dash-mute">
                    <span className={`font-mono ${
                      (s.avgLatencyMs ?? 0) < 200 ? 'text-dash-ok' : (s.avgLatencyMs ?? 0) < 500 ? 'text-dash-warn' : 'text-dash-err'
                    }`}>{s.avgLatencyMs ?? '—'}ms</span>
                    <span>
                      {s.latestCheckedAt ? new Date(s.latestCheckedAt).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkline({ points, fails }: { points: number[]; fails: boolean[] }) {
  if (points.length === 0) return <div className="h-10 text-[10px] text-dash-mute">no samples</div>;
  const max = Math.max(1, ...points);
  const min = Math.min(...points);
  const w = 300;
  const h = 40;
  const step = w / Math.max(points.length - 1, 1);
  const pts = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / Math.max(1, max - min)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-10 w-full">
      <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="1.5" />
      {fails.map((f, i) =>
        f ? <circle key={i} cx={(i * step).toFixed(1)} cy={h - 2} r="1.8" fill="#ef4444" /> : null
      )}
    </svg>
  );
}
