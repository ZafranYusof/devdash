import { useState, useEffect, useCallback, useRef } from 'react';

interface PipelineStep {
  id: string;
  name: string;
  type: 'build' | 'test' | 'deploy' | 'script' | 'notify' | 'wait';
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  command?: string;
  duration?: number;
}

interface Pipeline {
  id: string;
  name: string;
  projectId?: string;
  steps: PipelineStep[];
  createdAt: number;
  updatedAt: number;
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: number;
  finishedAt?: number;
  stepResults: { stepId: string; status: string; duration: number }[];
}

const PIPELINES_KEY = 'devdash-pipelines';
const RUNS_KEY = 'devdash-pipeline-runs';

const STEP_TYPES: { id: PipelineStep['type']; label: string; color: string }[] = [
  { id: 'build', label: 'Build', color: '#0070F3' },
  { id: 'test', label: 'Test', color: '#50E3C2' },
  { id: 'deploy', label: 'Deploy', color: '#7928CA' },
  { id: 'script', label: 'Script', color: '#F5A623' },
  { id: 'notify', label: 'Notify', color: '#FF0080' },
  { id: 'wait', label: 'Wait', color: '#888' },
];

const TEMPLATES: { name: string; steps: Omit<PipelineStep, 'id' | 'status'>[] }[] = [
  {
    name: 'Simple Deploy',
    steps: [
      { name: 'Build', type: 'build', command: 'npm run build' },
      { name: 'Deploy', type: 'deploy', command: 'deploy to production' },
    ],
  },
  {
    name: 'Full CI',
    steps: [
      { name: 'Install', type: 'build', command: 'npm ci' },
      { name: 'Lint', type: 'test', command: 'npm run lint' },
      { name: 'Test', type: 'test', command: 'npm test' },
      { name: 'Build', type: 'build', command: 'npm run build' },
      { name: 'Deploy', type: 'deploy', command: 'deploy to production' },
      { name: 'Notify', type: 'notify', command: 'send slack notification' },
    ],
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getStepColor(type: PipelineStep['type']): string {
  return STEP_TYPES.find(t => t.id === type)?.color || '#666';
}

export default function PipelineView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editing, setEditing] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentRunStepIdx, setCurrentRunStepIdx] = useState(-1);
  const [view, setView] = useState<'list' | 'editor' | 'history'>('list');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const runRef = useRef(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PIPELINES_KEY);
      if (p) setPipelines(JSON.parse(p));
      const r = localStorage.getItem(RUNS_KEY);
      if (r) setRuns(JSON.parse(r));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines)); }, [pipelines]);
  useEffect(() => { localStorage.setItem(RUNS_KEY, JSON.stringify(runs)); }, [runs]);

  const createPipeline = (name: string, steps: Omit<PipelineStep, 'id' | 'status'>[]) => {
    const pipeline: Pipeline = {
      id: generateId(),
      name,
      steps: steps.map(s => ({ ...s, id: generateId(), status: 'pending' as const })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPipelines(prev => [...prev, pipeline]);
    setSelectedPipeline(pipeline);
    setView('editor');
  };

  const deletePipeline = (id: string) => {
    setPipelines(prev => prev.filter(p => p.id !== id));
    if (selectedPipeline?.id === id) {
      setSelectedPipeline(null);
      setView('list');
    }
  };

  const addStep = (afterIdx: number) => {
    if (!selectedPipeline) return;
    const newStep: PipelineStep = {
      id: generateId(),
      name: 'New Step',
      type: 'script',
      status: 'pending',
      command: '',
    };
    const updated = { ...selectedPipeline };
    updated.steps = [...updated.steps];
    updated.steps.splice(afterIdx + 1, 0, newStep);
    updated.updatedAt = Date.now();
    setSelectedPipeline(updated);
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const removeStep = (idx: number) => {
    if (!selectedPipeline) return;
    const updated = { ...selectedPipeline };
    updated.steps = updated.steps.filter((_, i) => i !== idx);
    updated.updatedAt = Date.now();
    setSelectedPipeline(updated);
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const updateStep = (idx: number, patch: Partial<PipelineStep>) => {
    if (!selectedPipeline) return;
    const updated = { ...selectedPipeline };
    updated.steps = updated.steps.map((s, i) => i === idx ? { ...s, ...patch } : s);
    updated.updatedAt = Date.now();
    setSelectedPipeline(updated);
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx && selectedPipeline) {
      const updated = { ...selectedPipeline };
      const steps = [...updated.steps];
      const [moved] = steps.splice(dragIdx, 1);
      steps.splice(dragOverIdx, 0, moved);
      updated.steps = steps;
      updated.updatedAt = Date.now();
      setSelectedPipeline(updated);
      setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const runPipeline = useCallback(async () => {
    if (!selectedPipeline || running) return;
    setRunning(true);
    runRef.current = true;

    const run: PipelineRun = {
      id: generateId(),
      pipelineId: selectedPipeline.id,
      pipelineName: selectedPipeline.name,
      status: 'running',
      startedAt: Date.now(),
      stepResults: [],
    };

    // Reset all steps
    const updated = { ...selectedPipeline };
    updated.steps = updated.steps.map(s => ({ ...s, status: 'pending' as const }));
    setSelectedPipeline(updated);

    for (let i = 0; i < updated.steps.length; i++) {
      if (!runRef.current) break;
      setCurrentRunStepIdx(i);

      // Set current step to running
      updated.steps = updated.steps.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s);
      setSelectedPipeline({ ...updated });

      // Simulate execution (500-2000ms)
      const duration = 500 + Math.random() * 1500;
      await new Promise(resolve => setTimeout(resolve, duration));

      if (!runRef.current) break;

      // 90% success rate
      const success = Math.random() > 0.1;
      updated.steps = updated.steps.map((s, idx) =>
        idx === i ? { ...s, status: success ? 'success' as const : 'error' as const, duration: Math.round(duration) } : s
      );
      setSelectedPipeline({ ...updated });

      run.stepResults.push({ stepId: updated.steps[i].id, status: success ? 'success' : 'error', duration: Math.round(duration) });

      if (!success) {
        run.status = 'error';
        run.finishedAt = Date.now();
        setRuns(prev => [run, ...prev].slice(0, 20));
        setRunning(false);
        setCurrentRunStepIdx(-1);
        runRef.current = false;
        setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
        return;
      }
    }

    run.status = 'success';
    run.finishedAt = Date.now();
    setRuns(prev => [run, ...prev].slice(0, 20));
    setRunning(false);
    setCurrentRunStepIdx(-1);
    runRef.current = false;
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, [selectedPipeline, running]);

  const cancelRun = () => {
    runRef.current = false;
    setRunning(false);
    setCurrentRunStepIdx(-1);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  // Pipeline list view
  if (view === 'list') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">CI/CD Pipelines</h2>
            <p className="text-xs text-[#888]">Build, test, and deploy automation</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('history')} className="btn-soft text-xs">Run History</button>
            <button onClick={() => createPipeline('New Pipeline', [{ name: 'Build', type: 'build', command: 'npm run build' }])} className="btn-primary text-xs">
              + New Pipeline
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-[#888] mb-2">Quick Start Templates</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => createPipeline(t.name, t.steps)}
                className="card text-left hover:border-[#0070F3]/50 transition-colors"
              >
                <p className="text-sm text-white mb-1">{t.name}</p>
                <p className="text-xs text-[#666]">{t.steps.length} steps: {t.steps.map(s => s.type).join(' → ')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline list */}
        {pipelines.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-[#666]">No pipelines yet</p>
            <p className="text-xs text-[#444] mt-1">Create one from a template or start from scratch</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pipelines.map(p => (
              <div key={p.id} className="card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-[#666]">{p.steps.length} steps · Updated {formatTime(p.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {p.steps.slice(0, 5).map(s => (
                    <span key={s.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: getStepColor(s.type) }} />
                  ))}
                  {p.steps.length > 5 && <span className="text-[10px] text-[#555]">+{p.steps.length - 5}</span>}
                </div>
                <button
                  onClick={() => { setSelectedPipeline(p); setView('editor'); }}
                  className="btn-soft text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePipeline(p.id)}
                  className="text-xs text-[#666] hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Run history view
  if (view === 'history') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Run History</h2>
            <p className="text-xs text-[#888]">{runs.length} past runs</p>
          </div>
          <button onClick={() => setView('list')} className="btn-soft text-xs">← Back</button>
        </div>

        {runs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-[#666]">No runs yet</p>
            <p className="text-xs text-[#444] mt-1">Run a pipeline to see history here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map(r => (
              <div key={r.id} className="card flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${r.status === 'success' ? 'bg-green-500' : r.status === 'error' ? 'bg-red-500' : r.status === 'running' ? 'bg-yellow-500 animate-pulse' : 'bg-[#444]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{r.pipelineName}</p>
                  <p className="text-xs text-[#666]">
                    {formatTime(r.startedAt)}
                    {r.finishedAt && ` · ${formatDuration(r.finishedAt - r.startedAt)}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'success' ? 'bg-green-500/20 text-green-400' : r.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Editor view
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-xs text-[#666] hover:text-white">← Back</button>
          {editing ? (
            <input
              autoFocus
              value={selectedPipeline?.name || ''}
              onChange={e => {
                if (!selectedPipeline) return;
                const updated = { ...selectedPipeline, name: e.target.value, updatedAt: Date.now() };
                setSelectedPipeline(updated);
                setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
              }}
              onBlur={() => setEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setEditing(false)}
              className="text-lg font-semibold text-white bg-transparent border-b border-[#0070F3] outline-none"
            />
          ) : (
            <h2 className="text-lg font-semibold text-white cursor-pointer" onClick={() => setEditing(true)}>
              {selectedPipeline?.name}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          {running ? (
            <button onClick={cancelRun} className="btn-soft text-xs text-red-400 border-red-400/30">Cancel</button>
          ) : (
            <button onClick={runPipeline} className="btn-primary text-xs">▶ Run Pipeline</button>
          )}
        </div>
      </div>

      {/* Visual pipeline */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex items-center gap-0 min-w-max py-8 px-4">
          {selectedPipeline?.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              {/* Step node */}
              <div
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                onDragEnd={handleDragEnd}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border min-w-[140px] cursor-grab transition-all ${
                  dragOverIdx === idx ? 'border-[#0070F3] bg-[#0070F3]/5' :
                  step.status === 'running' ? 'border-yellow-500/50 bg-yellow-500/5' :
                  step.status === 'success' ? 'border-green-500/50 bg-green-500/5' :
                  step.status === 'error' ? 'border-red-500/50 bg-red-500/5' :
                  'border-[#222] bg-[#111]'
                }`}
              >
                {/* Remove button */}
                <button
                  onClick={() => removeStep(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#222] border border-[#333] text-[10px] text-[#666] hover:text-red-400 hover:border-red-400/50 flex items-center justify-center"
                >
                  ✕
                </button>

                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full ${
                  step.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                  step.status === 'success' ? 'bg-green-500' :
                  step.status === 'error' ? 'bg-red-500' :
                  'bg-[#333]'
                }`} />

                {/* Type badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: getStepColor(step.type) + '20', color: getStepColor(step.type) }}>
                  {step.type}
                </span>

                {/* Name */}
                <input
                  value={step.name}
                  onChange={e => updateStep(idx, { name: e.target.value })}
                  className="text-xs text-white text-center bg-transparent border-none outline-none w-full"
                />

                {/* Type selector */}
                <select
                  value={step.type}
                  onChange={e => updateStep(idx, { type: e.target.value as PipelineStep['type'] })}
                  className="text-[10px] text-[#888] bg-[#0A0A0A] border border-[#333] rounded px-1 py-0.5 outline-none"
                >
                  {STEP_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                {/* Duration */}
                {step.duration && (
                  <span className="text-[10px] text-[#555]">{formatDuration(step.duration)}</span>
                )}
              </div>

              {/* Connector + Add button */}
              {idx < (selectedPipeline?.steps.length || 0) - 1 && (
                <div className="flex items-center mx-1">
                  <div className="w-6 h-px bg-[#333]" />
                  <button
                    onClick={() => addStep(idx)}
                    className="w-5 h-5 rounded-full bg-[#111] border border-[#333] text-[10px] text-[#666] hover:text-[#0070F3] hover:border-[#0070F3]/50 flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                  <div className="w-6 h-px bg-[#333]" />
                </div>
              )}
            </div>
          ))}

          {/* Add step at end */}
          <div className="flex items-center ml-2">
            <div className="w-4 h-px bg-[#333]" />
            <button
              onClick={() => addStep((selectedPipeline?.steps.length || 1) - 1)}
              className="w-8 h-8 rounded-full bg-[#111] border border-dashed border-[#333] text-sm text-[#666] hover:text-[#0070F3] hover:border-[#0070F3]/50 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Step count info */}
      <div className="border-t border-[#222] pt-2 mt-2">
        <p className="text-xs text-[#555]">
          {selectedPipeline?.steps.length} steps · Drag to reorder · Click + to insert
          {running && <span className="ml-2 text-yellow-400">Running step {currentRunStepIdx + 1}/{selectedPipeline?.steps.length}...</span>}
        </p>
      </div>
    </div>
  );
}
