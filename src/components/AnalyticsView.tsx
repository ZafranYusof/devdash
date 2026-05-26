import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProjectConfig, DeployItem } from '../types';

type TimeRange = '7d' | '30d' | '90d';

interface ProjectHealth {
  project: ProjectConfig;
  uptimePct: number;
  deploySuccessRate: number;
  lastActivity: number | null;
  score: 'healthy' | 'warning' | 'critical';
}

const STORAGE_KEY = 'devdash-incidents';

function loadIncidents(): Array<{ createdAt: number; resolvedAt: number | null }> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function getDaysInRange(range: TimeRange): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 90;
}

export default function AnalyticsView() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [deploys, setDeploys] = useState<DeployItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [healthData, setHealthData] = useState<ProjectHealth[]>([]);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectList, deployResult] = await Promise.all([
        window.devdash.projects.list(),
        window.devdash.deploys.list(),
      ]);
      setProjects(projectList);
      setDeploys(deployResult.items);

      // Build heatmap from deploy timestamps
      const heatmap: Record<string, number> = {};
      deployResult.items.forEach(d => {
        const date = new Date(d.createdAt).toISOString().split('T')[0];
        heatmap[date] = (heatmap[date] || 0) + 1;
      });
      setHeatmapData(heatmap);

      // Build health data
      const uptimeData = await window.devdash.uptime.all().catch(() => []);
      const health: ProjectHealth[] = projectList.map(project => {
        const projectDeploys = deployResult.items.filter(d => d.projectId === project.id);
        const successDeploys = projectDeploys.filter(d => d.status === 'ready');
        const deploySuccessRate = projectDeploys.length > 0 ? (successDeploys.length / projectDeploys.length) * 100 : 100;
        const uptime = uptimeData.find(u => u.projectId === project.id);
        const uptimePct = uptime?.uptimePct24h ?? 100;
        const lastDeploy = projectDeploys.sort((a, b) => b.createdAt - a.createdAt)[0];
        const lastActivity = lastDeploy?.createdAt || null;

        let score: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (uptimePct < 95 || deploySuccessRate < 70) score = 'critical';
        else if (uptimePct < 99 || deploySuccessRate < 90) score = 'warning';

        return { project, uptimePct, deploySuccessRate, lastActivity, score };
      });
      setHealthData(health);
    } catch (err) {
      console.error('AnalyticsView load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Heatmap grid (52 weeks × 7 days)
  const heatmapGrid = useMemo(() => {
    const today = new Date();
    const grid: Array<{ date: string; count: number; weekIdx: number; dayIdx: number }> = [];
    for (let w = 51; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().split('T')[0];
        grid.push({ date: dateStr, count: heatmapData[dateStr] || 0, weekIdx: 51 - w, dayIdx: d });
      }
    }
    return grid;
  }, [heatmapData]);

  const maxCount = Math.max(...Object.values(heatmapData), 1);

  function getHeatColor(count: number): string {
    if (count === 0) return '#161b22';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return '#0e4429';
    if (intensity <= 0.5) return '#006d32';
    if (intensity <= 0.75) return '#26a641';
    return '#39d353';
  }

  // Deploy frequency (last 12 weeks)
  const deployFrequency = useMemo(() => {
    const days = getDaysInRange(timeRange);
    const weeks = Math.min(Math.ceil(days / 7), 12);
    const result: Array<{ week: string; success: number; error: number; total: number }> = [];
    const now = Date.now();

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = now - (w + 1) * 7 * 86400000;
      const weekEnd = now - w * 7 * 86400000;
      const weekDeploys = deploys.filter(d => d.createdAt >= weekStart && d.createdAt < weekEnd);
      const startDate = new Date(weekStart);
      result.push({
        week: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
        success: weekDeploys.filter(d => d.status === 'ready').length,
        error: weekDeploys.filter(d => d.status === 'error').length,
        total: weekDeploys.length,
      });
    }
    return result;
  }, [deploys, timeRange]);

  const maxDeploys = Math.max(...deployFrequency.map(w => w.total), 1);

  // MTTR from incidents
  const incidents = loadIncidents();
  const resolvedIncidents = incidents.filter(i => i.resolvedAt);
  const mttr = resolvedIncidents.length > 0
    ? Math.round(resolvedIncidents.reduce((sum, i) => sum + (i.resolvedAt! - i.createdAt), 0) / resolvedIncidents.length)
    : null;

  // Cost estimation
  const totalDeploys30d = deploys.filter(d => d.createdAt > Date.now() - 30 * 86400000).length;
  const vercelDeploys = deploys.filter(d => d.provider === 'vercel' && d.createdAt > Date.now() - 30 * 86400000).length;
  const renderServices = projects.filter(p => p.deployProvider === 'render').length;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#1a1a1a]" />
        <div className="h-32 rounded bg-[#111]" />
        <div className="h-48 rounded bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          <p className="text-xs text-[#666] mt-0.5">Git activity, deploy frequency & project health</p>
        </div>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                timeRange === r ? 'bg-[#222] text-white' : 'text-[#666] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Git Activity Heatmap */}
      <div className="card">
        <div className="text-[10px] text-[#666] font-medium mb-2">GIT ACTIVITY (52 weeks)</div>
        <div className="relative overflow-x-auto">
          <svg width={52 * 13 + 20} height={7 * 13 + 20} className="block">
            {/* Day labels */}
            {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((label, i) => (
              <text key={i} x="0" y={i * 13 + 18} fontSize="9" fill="#444" textAnchor="start">{label}</text>
            ))}
            {/* Cells */}
            {heatmapGrid.map((cell, idx) => (
              <rect
                key={idx}
                x={cell.weekIdx * 13 + 28}
                y={cell.dayIdx * 13 + 8}
                width="10"
                height="10"
                rx="2"
                fill={getHeatColor(cell.count)}
                className="transition-colors"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setHoveredDay({ date: cell.date, count: cell.count, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setHoveredDay(null)}
              />
            ))}
          </svg>
          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 text-[9px] text-[#555]">
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: getHeatColor(intensity * maxCount) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 rounded bg-[#1a1a1a] border border-[#333] px-2 py-1 text-[10px] text-white shadow-lg pointer-events-none"
            style={{ left: hoveredDay.x, top: hoveredDay.y - 30 }}
          >
            {hoveredDay.count} deploys on {hoveredDay.date}
          </div>
        )}
      </div>

      {/* Deploy Frequency Chart */}
      <div className="card">
        <div className="text-[10px] text-[#666] font-medium mb-2">DEPLOY FREQUENCY (last {deployFrequency.length} weeks)</div>
        <div className="flex items-end gap-1 h-32">
          {deployFrequency.map((week, i) => {
            const successHeight = (week.success / maxDeploys) * 100;
            const errorHeight = (week.error / maxDeploys) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col items-center justify-end h-24 relative">
                  {week.error > 0 && (
                    <div
                      className="w-full max-w-[16px] rounded-t bg-red-500/80"
                      style={{ height: `${errorHeight}%`, minHeight: week.error > 0 ? '3px' : '0' }}
                    />
                  )}
                  <div
                    className="w-full max-w-[16px] rounded-t bg-green-500/80"
                    style={{ height: `${successHeight}%`, minHeight: week.success > 0 ? '3px' : '0' }}
                  />
                </div>
                <span className="text-[8px] text-[#444]">{week.week}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[9px] text-[#555]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/80" /> Success</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/80" /> Error</span>
          <span className="ml-auto">{totalDeploys30d} deploys (30d)</span>
        </div>
      </div>

      {/* MTTR & Cost Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* MTTR */}
        <div className="card">
          <div className="text-[10px] text-[#666] font-medium mb-1">MEAN TIME TO RESOLVE</div>
          {mttr ? (
            <div className="text-xl font-bold text-white">
              {Math.floor(mttr / 60000) < 60
                ? `${Math.floor(mttr / 60000)}m`
                : `${Math.floor(mttr / 3600000)}h ${Math.floor((mttr % 3600000) / 60000)}m`}
            </div>
          ) : (
            <div className="text-sm text-[#555]">No incidents resolved yet</div>
          )}
          <div className="text-[9px] text-[#444] mt-1">{resolvedIncidents.length} incidents resolved</div>
        </div>

        {/* Cost Estimation */}
        <div className="card">
          <div className="text-[10px] text-[#666] font-medium mb-1">COST ESTIMATION</div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#999]">Vercel (free tier)</span>
                <span className="text-white font-mono">{Math.min(Math.round((vercelDeploys / 3000) * 100), 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a1a1a] mt-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0070F3] transition-all"
                  style={{ width: `${Math.min((vercelDeploys / 3000) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[8px] text-[#444] mt-0.5">{vercelDeploys}/3000 deploys/month</div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#999]">Render (free tier)</span>
                <span className="text-white font-mono">{renderServices} services</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a1a1a] mt-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${Math.min((renderServices / 5) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[8px] text-[#444] mt-0.5">750 free hours/month shared</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Health Scores */}
      <div className="card">
        <div className="text-[10px] text-[#666] font-medium mb-2">PROJECT HEALTH</div>
        {healthData.length === 0 ? (
          <p className="text-xs text-[#555]">No projects to analyze</p>
        ) : (
          <div className="space-y-1.5">
            {healthData.map(h => {
              const scoreColor = h.score === 'healthy' ? 'text-green-400' : h.score === 'warning' ? 'text-amber-400' : 'text-red-400';
              const scoreBg = h.score === 'healthy' ? 'bg-green-900/20' : h.score === 'warning' ? 'bg-amber-900/20' : 'bg-red-900/20';
              return (
                <div key={h.project.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-[#111] transition-colors">
                  <div className={`h-2 w-2 rounded-full ${h.score === 'healthy' ? 'bg-green-500' : h.score === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-white flex-1 truncate">{h.project.name}</span>
                  <span className="text-[9px] text-[#666] font-mono w-16 text-right">{h.uptimePct.toFixed(1)}% up</span>
                  <span className="text-[9px] text-[#666] font-mono w-20 text-right">{h.deploySuccessRate.toFixed(0)}% deploys</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${scoreBg} ${scoreColor}`}>
                    {h.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
