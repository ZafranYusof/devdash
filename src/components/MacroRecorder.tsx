import { useState, useEffect, useCallback } from 'react';

interface MacroStep {
  id: string;
  type: 'navigate' | 'action';
  label: string;
  payload: string;
}

interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
  createdAt: number;
}

const STORAGE_KEY = 'devdash-macros';
const RECORDING_KEY = 'devdash-macro-recording';

function loadMacros(): Macro[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveMacros(macros: Macro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(macros));
}

export function useMacroRecorder() {
  const [recording, setRecording] = useState(false);
  const [steps, setSteps] = useState<MacroStep[]>([]);

  const startRecording = useCallback(() => {
    setRecording(true);
    setSteps([]);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    return steps;
  }, [steps]);

  const recordStep = useCallback((step: Omit<MacroStep, 'id'>) => {
    if (!recording) return;
    setSteps((prev) => [...prev, { ...step, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  }, [recording]);

  return { recording, steps, startRecording, stopRecording, recordStep };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onReplay: (steps: MacroStep[]) => void;
}

export default function MacroRecorder({ open, onClose, onReplay }: Props) {
  const [macros, setMacros] = useState<Macro[]>(loadMacros);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    saveMacros(macros);
  }, [macros]);

  const deleteMacro = (id: string) => {
    setMacros((prev) => prev.filter((m) => m.id !== id));
  };

  const renameMacro = (id: string, name: string) => {
    setMacros((prev) => prev.map((m) => m.id === id ? { ...m, name } : m));
    setEditingId(null);
  };

  const removeStep = (macroId: string, stepId: string) => {
    setMacros((prev) => prev.map((m) =>
      m.id === macroId ? { ...m, steps: m.steps.filter((s) => s.id !== stepId) } : m
    ));
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal-content w-[480px] max-h-[500px] overflow-hidden rounded-xl border border-[#222] bg-[#111] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
          <h2 className="text-sm font-medium text-white">Macro Recorder</h2>
          <button onClick={onClose} className="btn-icon">
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {macros.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#555]">
              No macros saved yet. Record actions to create macros.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {macros.map((macro) => (
                <div key={macro.id} className="card p-3">
                  <div className="flex items-center justify-between mb-2">
                    {editingId === macro.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => renameMacro(macro.id, editName)}
                        onKeyDown={(e) => e.key === 'Enter' && renameMacro(macro.id, editName)}
                        className="bg-transparent border border-[#333] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span
                        className="text-xs font-medium text-white cursor-pointer hover:text-[#0070F3]"
                        onClick={() => { setEditingId(macro.id); setEditName(macro.name); }}
                      >
                        {macro.name}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onReplay(macro.steps)}
                        className="btn-soft"
                        title="Replay macro"
                      >
                        ▶ Play
                      </button>
                      <button
                        onClick={() => deleteMacro(macro.id)}
                        className="btn-ghost text-[#EE0000]"
                        title="Delete macro"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {macro.steps.map((step) => (
                      <div key={step.id} className="macro-step">
                        <span className="text-[10px] uppercase text-[#555] w-14 shrink-0">{step.type}</span>
                        <span className="text-[#888] flex-1 truncate">{step.label}</span>
                        <button
                          onClick={() => removeStep(macro.id, step.id)}
                          className="text-[#555] hover:text-[#EE0000] text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-[#444] mt-2">
                    {macro.steps.length} steps · {new Date(macro.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function saveMacro(name: string, steps: MacroStep[]) {
  const macros = loadMacros();
  const macro: Macro = {
    id: `macro-${Date.now()}`,
    name,
    steps,
    createdAt: Date.now(),
  };
  macros.push(macro);
  saveMacros(macros);
  return macro;
}
