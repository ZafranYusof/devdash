import { useState, useEffect, useCallback } from 'react';
import type { ProjectConfig } from '../types';

interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface ScoreHistory {
  date: string;
  scores: LighthouseScores;
}

interface CoreWebVitals {
  lcp: number; // ms
  fid: number; // ms
  cls: number; // score
}

interface ProjectPerformance {
  project: ProjectConfig;
  bundleSize: number | null; // bytes
  prevBundleSize: number | null;
  scores: LighthouseScores | null;
  history: ScoreHistory[];
  vitals: CoreWebVitals | null;
  loading: boolean;
}

const STORAGE_KEY = 'devdash-perf-data';

function loadPersistedData(): Record<string, { scores: LighthouseScores; history: ScoreHistory[]; vitals: CoreWebVitals }> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {};
}

function persistData(data: Record<string, { scores: LighthouseScores; history: ScoreHistory[]; vitals: CoreWebVitals }>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function randomScore(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function generateMockScores(): LighthouseScores {
  return {
    performance: randomScore(45, 99),
    accessibility: randomScore(60, 100),
    bestPractices: randomScore(55, 100),
    seo: randomScore(65, 100),
  };
}

function generateMockVitals(): CoreWebVitals {
  return {
    lcp: Math.round(800 + Math.random() * 3200),
    fid: Math.round(10 + Math.random() * 290),
    cls: Math.round(Math.random() * 50) / 100,
  };
}

function getVitalColor(metric: 'lcp' | 'fid' | 'cls', value: number): string {
  if (metric === 'lcp') return value <= 2500 ? 'text-green-400' : value <= 4000 ? 'text-amber-400' : 'text-red-400';
  if (metric === 'fid') return value <= 100 ? 'text-green-400' : value <= 300 ? 'text-amber-400' : 'text-red-400';
  if (metric === 'cls') return value <= 0.1 ? 'text-green-400' : value <= 0.25 ? 'text-amber-400' : 'text-red-400';
  return 'text-[#666]';
}

function getVitalBg(metric: 'lcp' | 'fid' | 'cls', value: number): string {
  if (metric === 'lcp') return value <= 2500 ? 'bg-green-900/20' : value <= 4000 ? 'bg-amber-900/20' : 'bg-red-900/20';
  if (metric === 'fid') return value <= 100 ? 'bg-green-900/20' : value <= 300 ? 'bg-amber-900/20' : 'bg-red-900/20';
  if (metric === 'cls') return value <= 0.1 ? 'bg-green-900/20' : value <= 0.25 ? 'bg-amber-900/20' : 'bg-red-900/20';
  return 'bg-[#111]';
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="#222" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={radius} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          className="transition-all duration-700"
        />
        <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="11" fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-[9px] text-[#666]">{label}</span>
    </div>
  );
}

function MiniLineChart({ history }: { history: ScoreHistory[] }) {
  if (history.length < 2) return <div className="text-[9px] text-[#444]">Not enough data</div>;

  const scores = history.slice(-5).map(h => h.scores.performance);
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const padding = 4;

  const points = scores.map((s, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - padding * 2);
    const y = height - padding - ((s - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#0070F3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const x = padding + (i / (scores.length - 1)) * (width - padding * 2);
        const y = height - padding - ((s - min) / range) * (height - padding * 2);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#0070F3" />;
      })}
    </svg>
  );
}

export default function PerformanceView() {
  const [projectPerfs, setProjectPerfs] = useState<ProjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await window.devdash.projects.list();
      const persisted = loadPersistedData();

      const perfs: ProjectPerformance[] = await Promise.all(
        projectList.map(async (project) => {
          let bundleSize: number | null = null;
          let prevBundleSize: number | null = null;

          try {
            const bundleHistory = await window.devdash.bundle.history(project.id);
            if (bundleHistory.length > 0) {
              bundleSize = bundleHistory[bundleHistory.length - 1].sizeBytes;
              if (bundleHistory.length > 1) {
                prevBundleSize = bundleHistory[bundleHistory.length - 2].sizeBytes;
              }
            }
          } catch { /* no bundle data */ }

          const saved = persisted[project.id];

          return {
            project,
            bundleSize,
            prevBundleSize,
            scores: saved?.scores || null,
            history: saved?.history || [],
            vitals: saved?.vitals || null,
            loading: false,
          };
        })
      );

      setProjectPerfs(perfs);
    } catch (err) {
      console.error('PerformanceView load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const runAudit = (projectId: string) => {
    setProjectPerfs(prev => prev.map(p =>
      p.project.id === projectId ? { ...p, loading: true } : p
    ));

    // Simulate audit delay
    setTimeout(() => {
      const scores = generateMockScores();
      const vitals = generateMockVitals();
      const historyEntry: ScoreHistory = { date: new Date().toISOString().split('T')[0], scores };

      setProjectPerfs(prev => {
        const updated = prev.map(p => {
          if (p.project.id !== projectId) return p;
          const newHistory = [...p.history, historyEntry].slice(-5);
          return { ...p, scores, vitals, history: newHistory, loading: false };
        });

        // Persist
        const persisted = loadPersistedData();
        const proj = updated.find(p => p.project.id === projectId);
        if (proj && proj.scores && proj.vitals) {
          persisted[projectId] = { scores: proj.scores, history: proj.history, vitals: proj.vitals };
          persistData(persisted);
        }

        return updated;
      });
    }, 1500 + Math.random() * 1000);
  };

  const avgScores = (() => {
    const withScores = projectPerfs.filter(p => p.scores);
    if (withScores.length === 0) return null;
    const sum = { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    withScores.forEach(p => {
      sum.performance += p.scores!.performance;
      sum.accessibility += p.scores!.accessibility;
      sum.bestPractices += p.scores!.bestPractices;
      sum.seo += p.scores!.seo;
    });
    const n = withScores.length;
    return {
      performance: Math.round(sum.performance / n),
      accessibility: Math.round(sum.accessibility / n),
      bestPractices: Math.round(sum.bestPractices / n),
      seo: Math.round(sum.seo / n),
    };
  })();

  const alertProjects = projectPerfs.filter(p => p.scores && (
    p.scores.performance < 50 || p.scores.accessibility < 50 || p.scores.bestPractices < 50 || p.scores.seo < 50
  ));

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#1a1a1a]" />
        <div className="h-32 rounded bg-[#111]" />
        <div className="h-64 rounded bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">Performance Monitor</h1>
        <p className="text-xs text-[#666] mt-0.5">Lighthouse scores, bundle sizes & Core Web Vitals</p>
      </div>

      {/* Overall Summary */}
      {avgScores && (
        <div className="card">
          <div className="text-[10px] text-[#666] font-medium mb-2">AVERAGE SCORES</div>
          <div className="flex items-center gap-6">
            <ScoreCircle score={avgScores.performance} label="Performance" />
            <ScoreCircle score={avgScores.accessibility} label="Accessibility" />
            <ScoreCircle score={avgScores.bestPractices} label="Best Practices" />
            <ScoreCircle score={avgScores.seo} label="SEO" />
          </div>
        </div>
      )}

      {/* Alerts */}
      {alertProjects.length > 0 && (
        <div className="rounded border border-red-900/50 bg-red-900/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1L1 14h14L8 1z" strokeLinejoin="round" />
              <path d="M8 6v3M8 11.5v.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-red-400 font-medium">Performance Alerts</span>
          </div>
          <div className="space-y-1">
            {alertProjects.map(p => (
              <div key={p.project.id} className="text-[10px] text-red-300/80">
                {p.project.name}: {Object.entries(p.scores!).filter(([, v]) => v < 50).map(([k, v]) => `${k} (${v})`).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Cards */}
      {projectPerfs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[#666]">No projects found</p>
          <p className="text-xs text-[#444] mt-1">Add projects to monitor their performance</p>
        </div>
      ) : (
        projectPerfs.map(perf => (
          <div key={perf.project.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">{perf.project.name}</h3>
                {perf.bundleSize && (
                  <span className="text-[10px] text-[#555] bg-[#1a1a1a] px-1.5 py-0.5 rounded font-mono">
                    {(perf.bundleSize / 1024).toFixed(0)} KB
                    {perf.prevBundleSize && (
                      <span className={perf.bundleSize > perf.prevBundleSize ? 'text-red-400 ml-1' : 'text-green-400 ml-1'}>
                        {perf.bundleSize > perf.prevBundleSize ? '↑' : '↓'}
                        {Math.abs(((perf.bundleSize - perf.prevBundleSize) / perf.prevBundleSize) * 100).toFixed(1)}%
                      </span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => runAudit(perf.project.id)}
                disabled={perf.loading}
                className="btn-primary text-[10px] px-2 py-0.5"
              >
                {perf.loading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white/30 border-t-white" />
                    Running...
                  </span>
                ) : 'Run Audit'}
              </button>
            </div>

            {perf.scores ? (
              <div className="flex flex-col gap-3">
                {/* Scores */}
                <div className="flex items-center gap-4">
                  <ScoreCircle score={perf.scores.performance} label="Perf" />
                  <ScoreCircle score={perf.scores.accessibility} label="A11y" />
                  <ScoreCircle score={perf.scores.bestPractices} label="BP" />
                  <ScoreCircle score={perf.scores.seo} label="SEO" />
                  <div className="ml-auto">
                    <div className="text-[9px] text-[#555] mb-1">Score History</div>
                    <MiniLineChart history={perf.history} />
                  </div>
                </div>

                {/* Core Web Vitals */}
                {perf.vitals && (
                  <div className="mt-2">
                    <div className="text-[10px] text-[#666] font-medium mb-1.5">Core Web Vitals</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`rounded p-2 ${getVitalBg('lcp', perf.vitals.lcp)}`}>
                        <div className="text-[9px] text-[#666]">LCP</div>
                        <div className={`text-sm font-mono font-medium ${getVitalColor('lcp', perf.vitals.lcp)}`}>
                          {(perf.vitals.lcp / 1000).toFixed(1)}s
                        </div>
                      </div>
                      <div className={`rounded p-2 ${getVitalBg('fid', perf.vitals.fid)}`}>
                        <div className="text-[9px] text-[#666]">FID</div>
                        <div className={`text-sm font-mono font-medium ${getVitalColor('fid', perf.vitals.fid)}`}>
                          {perf.vitals.fid}ms
                        </div>
                      </div>
                      <div className={`rounded p-2 ${getVitalBg('cls', perf.vitals.cls)}`}>
                        <div className="text-[9px] text-[#666]">CLS</div>
                        <div className={`text-sm font-mono font-medium ${getVitalColor('cls', perf.vitals.cls)}`}>
                          {perf.vitals.cls.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-[#444] text-xs">
                {perf.bundleSize ? 'Click "Run Audit" to get Lighthouse scores' : 'Run build to detect bundle size, then audit'}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
