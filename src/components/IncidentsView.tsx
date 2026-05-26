import { useState, useEffect, useCallback } from 'react';
import type { ProjectConfig } from '../types';

type IncidentStatus = 'detected' | 'acknowledged' | 'investigating' | 'resolved';
type IncidentType = 'downtime' | 'deploy-fail' | 'performance';

interface TimelineEntry {
  status: IncidentStatus;
  ts: number;
  note?: string;
}

interface Incident {
  id: string;
  projectId: string;
  projectName: string;
  type: IncidentType;
  title: string;
  status: IncidentStatus;
  timeline: TimelineEntry[];
  createdAt: number;
  resolvedAt: number | null;
  postMortem: string;
}

const STORAGE_KEY = 'devdash-incidents';

function loadIncidents(): Incident[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveIncidents(incidents: Incident[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch { /* ignore */ }
}

function genId(): string {
  return `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<IncidentStatus, { bg: string; text: string; dot: string }> = {
  detected: { bg: 'bg-red-900/20', text: 'text-red-400', dot: 'bg-red-500' },
  acknowledged: { bg: 'bg-amber-900/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  investigating: { bg: 'bg-blue-900/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  resolved: { bg: 'bg-green-900/20', text: 'text-green-400', dot: 'bg-green-500' },
};

const TYPE_LABELS: Record<IncidentType, string> = {
  'downtime': '🔴 Downtime',
  'deploy-fail': '🟠 Deploy Failure',
  'performance': '🟡 Performance',
};

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<Incident[]>(loadIncidents);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newType, setNewType] = useState<IncidentType>('downtime');
  const [noteText, setNoteText] = useState('');
  const [postMortemText, setPostMortemText] = useState('');

  useEffect(() => {
    window.devdash.projects.list().then(setProjects).catch(() => {});
  }, []);

  const persist = useCallback((updated: Incident[]) => {
    setIncidents(updated);
    saveIncidents(updated);
  }, []);

  const createIncident = () => {
    if (!newTitle.trim() || !newProject) return;
    const proj = projects.find(p => p.id === newProject);
    const incident: Incident = {
      id: genId(),
      projectId: newProject,
      projectName: proj?.name || 'Unknown',
      type: newType,
      title: newTitle.trim(),
      status: 'detected',
      timeline: [{ status: 'detected', ts: Date.now() }],
      createdAt: Date.now(),
      resolvedAt: null,
      postMortem: '',
    };
    persist([incident, ...incidents]);
    setNewTitle('');
    setNewProject('');
    setShowCreate(false);
  };

  const updateStatus = (id: string, newStatus: IncidentStatus) => {
    persist(incidents.map(inc => {
      if (inc.id !== id) return inc;
      const entry: TimelineEntry = { status: newStatus, ts: Date.now() };
      return {
        ...inc,
        status: newStatus,
        timeline: [...inc.timeline, entry],
        resolvedAt: newStatus === 'resolved' ? Date.now() : inc.resolvedAt,
      };
    }));
  };

  const addNote = (id: string) => {
    if (!noteText.trim()) return;
    persist(incidents.map(inc => {
      if (inc.id !== id) return inc;
      const entry: TimelineEntry = { status: inc.status, ts: Date.now(), note: noteText.trim() };
      return { ...inc, timeline: [...inc.timeline, entry] };
    }));
    setNoteText('');
  };

  const updatePostMortem = (id: string) => {
    persist(incidents.map(inc => inc.id === id ? { ...inc, postMortem: postMortemText } : inc));
  };

  const deleteIncident = (id: string) => {
    persist(incidents.filter(inc => inc.id !== id));
    if (selectedIncident === id) setSelectedIncident(null);
  };

  const generateStatusPage = () => {
    const open = incidents.filter(i => i.status !== 'resolved');
    const resolved = incidents.filter(i => i.status === 'resolved').slice(0, 5);
    let html = `<!DOCTYPE html><html><head><title>Status Page</title><style>body{font-family:system-ui;max-width:600px;margin:40px auto;padding:20px;background:#0a0a0a;color:#eee}h1{font-size:1.5rem}.incident{border:1px solid #222;border-radius:8px;padding:12px;margin:8px 0}.status-ok{color:#22c55e}.status-issue{color:#ef4444}</style></head><body>`;
    html += `<h1>Service Status</h1>`;
    if (open.length === 0) {
      html += `<p class="status-ok">✓ All systems operational</p>`;
    } else {
      html += `<p class="status-issue">⚠ ${open.length} active incident(s)</p>`;
      open.forEach(i => {
        html += `<div class="incident"><strong>${i.title}</strong><br><small>${i.projectName} · ${i.type} · ${i.status}</small></div>`;
      });
    }
    if (resolved.length > 0) {
      html += `<h2 style="font-size:1rem;margin-top:24px">Recent Resolved</h2>`;
      resolved.forEach(i => {
        html += `<div class="incident"><strong>${i.title}</strong><br><small>${i.projectName} · Resolved ${formatTime(i.resolvedAt!)}</small></div>`;
      });
    }
    html += `<p style="margin-top:24px;font-size:0.75rem;color:#666">Generated by DevDash · ${new Date().toLocaleString()}</p></body></html>`;
    navigator.clipboard.writeText(html);
  };

  // Stats
  const openCount = incidents.filter(i => i.status !== 'resolved').length;
  const thisMonth = incidents.filter(i => {
    const d = new Date(i.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const resolvedWithTime = incidents.filter(i => i.resolvedAt);
  const mttr = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((sum, i) => sum + (i.resolvedAt! - i.createdAt), 0) / resolvedWithTime.length)
    : null;

  const detail = selectedIncident ? incidents.find(i => i.id === selectedIncident) : null;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Incidents</h1>
          <p className="text-xs text-[#666] mt-0.5">Track and manage service incidents</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={generateStatusPage} className="btn-soft text-xs">
            Create Status Page
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs">
            + New Incident
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <div className={`text-xl font-bold ${openCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{openCount}</div>
          <div className="text-[10px] text-[#666]">Open Incidents</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-white">{mttr ? formatDuration(mttr) : '—'}</div>
          <div className="text-[10px] text-[#666]">MTTR</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-white">{thisMonth}</div>
          <div className="text-[10px] text-[#666]">This Month</div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card border-[#333]">
          <div className="text-xs text-[#666] font-medium mb-2">New Incident</div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Incident title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="rounded border border-[#222] bg-[#0a0a0a] px-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#333] focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={newProject}
                onChange={e => setNewProject(e.target.value)}
                className="flex-1 rounded border border-[#222] bg-[#0a0a0a] px-2 py-1.5 text-sm text-white focus:border-[#333] focus:outline-none"
              >
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as IncidentType)}
                className="rounded border border-[#222] bg-[#0a0a0a] px-2 py-1.5 text-sm text-white focus:border-[#333] focus:outline-none"
              >
                <option value="downtime">Downtime</option>
                <option value="deploy-fail">Deploy Failure</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <button onClick={createIncident} className="btn-primary text-xs self-end px-4 py-1.5">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Incident List & Detail */}
      <div className="flex gap-4 min-h-0">
        {/* List */}
        <div className="flex-1 flex flex-col gap-2">
          {incidents.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#333] mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
              <p className="text-sm text-[#666]">No incidents recorded</p>
              <p className="text-xs text-[#444] mt-1">All systems operational</p>
            </div>
          ) : (
            incidents.map(inc => {
              const colors = STATUS_COLORS[inc.status];
              const duration = inc.resolvedAt
                ? formatDuration(inc.resolvedAt - inc.createdAt)
                : formatDuration(Date.now() - inc.createdAt);
              return (
                <div
                  key={inc.id}
                  onClick={() => { setSelectedIncident(inc.id); setPostMortemText(inc.postMortem); }}
                  className={`card cursor-pointer transition-colors hover:border-[#333] ${selectedIncident === inc.id ? 'border-[#444]' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      <h3 className="text-sm font-medium text-white">{inc.title}</h3>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#555]">
                    <span>{inc.projectName}</span>
                    <span>{TYPE_LABELS[inc.type]}</span>
                    <span>⏱ {duration}</span>
                    <span>{formatTime(inc.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div className="w-80 flex flex-col gap-3 overflow-y-auto">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">{detail.title}</h3>
                <button onClick={() => deleteIncident(detail.id)} className="text-[10px] text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
              <div className="text-[10px] text-[#555] mb-3">
                {detail.projectName} · {TYPE_LABELS[detail.type]}
              </div>

              {/* Status Actions */}
              <div className="flex gap-1 mb-3">
                {detail.status === 'detected' && (
                  <button onClick={() => updateStatus(detail.id, 'acknowledged')} className="btn-soft text-[10px] px-2 py-0.5">
                    Acknowledge
                  </button>
                )}
                {(detail.status === 'detected' || detail.status === 'acknowledged') && (
                  <button onClick={() => updateStatus(detail.id, 'investigating')} className="btn-soft text-[10px] px-2 py-0.5">
                    Investigate
                  </button>
                )}
                {detail.status !== 'resolved' && (
                  <button onClick={() => updateStatus(detail.id, 'resolved')} className="btn-primary text-[10px] px-2 py-0.5">
                    Resolve
                  </button>
                )}
              </div>

              {/* Timeline */}
              <div className="text-[10px] text-[#666] font-medium mb-1.5">Timeline</div>
              <div className="space-y-2 mb-3">
                {detail.timeline.map((entry, i) => {
                  const colors = STATUS_COLORS[entry.status];
                  return (
                    <div key={i} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className={`h-2 w-2 rounded-full ${colors.dot} mt-1`} />
                        {i < detail.timeline.length - 1 && <div className="w-px flex-1 bg-[#222] mt-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${colors.text}`}>{entry.status}</span>
                          <span className="text-[9px] text-[#444]">{formatTime(entry.ts)}</span>
                        </div>
                        {entry.note && <p className="text-[10px] text-[#888] mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Note */}
              {detail.status !== 'resolved' && (
                <div className="flex gap-1.5 mb-3">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addNote(detail.id); }}
                    className="flex-1 rounded border border-[#222] bg-[#0a0a0a] px-2 py-1 text-[10px] text-white placeholder-[#555] focus:border-[#333] focus:outline-none"
                  />
                  <button onClick={() => addNote(detail.id)} className="btn-soft text-[10px] px-2 py-0.5">
                    Add
                  </button>
                </div>
              )}

              {/* Post-Mortem */}
              {detail.status === 'resolved' && (
                <div>
                  <div className="text-[10px] text-[#666] font-medium mb-1.5">Post-Mortem</div>
                  <textarea
                    value={postMortemText}
                    onChange={e => setPostMortemText(e.target.value)}
                    placeholder="What happened? What was the root cause? How do we prevent this?"
                    className="w-full rounded border border-[#222] bg-[#0a0a0a] px-2 py-1.5 text-[10px] text-white placeholder-[#555] focus:border-[#333] focus:outline-none resize-none h-24"
                  />
                  <button onClick={() => updatePostMortem(detail.id)} className="btn-soft text-[10px] px-2 py-0.5 mt-1">
                    Save Post-Mortem
                  </button>
                </div>
              )}

              {/* Duration */}
              <div className="mt-3 pt-2 border-t border-[#1a1a1a]">
                <div className="text-[10px] text-[#555]">
                  Duration: {detail.resolvedAt
                    ? formatDuration(detail.resolvedAt - detail.createdAt)
                    : formatDuration(Date.now() - detail.createdAt) + ' (ongoing)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
