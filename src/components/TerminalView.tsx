import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProjectConfig } from '../types';

interface TerminalSession {
  id: string;
  label: string;
  projectId: string | null;
  history: string[];
  historyIndex: number;
  output: OutputLine[];
}

interface OutputLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  ts: number;
}

const COMMON_COMMANDS = ['cd', 'npm', 'npx', 'git', 'node', 'pnpm', 'yarn', 'ls', 'dir', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv', 'clear', 'pwd'];
const QUICK_COMMANDS = [
  { label: 'npm run dev', cmd: 'npm run dev' },
  { label: 'npm run build', cmd: 'npm run build' },
  { label: 'git status', cmd: 'git status' },
  { label: 'git pull', cmd: 'git pull' },
];

const SIMULATED_RESPONSES: Record<string, string> = {
  'help': 'Available commands: help, clear, echo, pwd, whoami, date, node --version, npm --version, git --version',
  'whoami': 'devdash-user',
  'pwd': 'C:\\Users\\devdash\\projects',
  'date': new Date().toLocaleString(),
  'node --version': 'v20.11.0',
  'npm --version': '10.2.4',
  'git --version': 'git version 2.43.0',
  'echo hello': 'hello',
};

export default function TerminalView() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', label: 'Terminal 1', projectId: null, history: [], historyIndex: -1, output: [{ type: 'system', text: 'DevDash Terminal v1.0 — Type "help" for available commands', ts: Date.now() }] }
  ]);
  const [activeSession, setActiveSession] = useState('1');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionCounter = useRef(1);

  const currentSession = sessions.find(s => s.id === activeSession) || sessions[0];

  useEffect(() => {
    window.devdash.projects.list().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [currentSession?.output]);

  const updateSession = useCallback((id: string, patch: Partial<TerminalSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const session = sessions.find(s => s.id === activeSession);
    if (!session) return;

    // Add to history
    const newHistory = [...session.history, trimmed];
    const inputLine: OutputLine = { type: 'input', text: `$ ${trimmed}`, ts: Date.now() };

    if (trimmed === 'clear') {
      updateSession(activeSession, { output: [], history: newHistory, historyIndex: -1 });
      return;
    }

    const newOutput = [...session.output, inputLine];
    updateSession(activeSession, { output: newOutput, history: newHistory, historyIndex: -1 });

    // Try real shell exec first
    if (window.devdash?.shell && 'exec' in (window.devdash.shell as Record<string, unknown>)) {
      try {
        const result = await (window.devdash.shell as unknown as { exec: (cmd: string) => Promise<{ stdout: string; stderr: string; code: number }> }).exec(trimmed);
        const lines: OutputLine[] = [];
        if (result.stdout) {
          result.stdout.split('\n').forEach(line => {
            lines.push({ type: 'output', text: line, ts: Date.now() });
          });
        }
        if (result.stderr) {
          result.stderr.split('\n').forEach(line => {
            lines.push({ type: 'error', text: line, ts: Date.now() });
          });
        }
        if (lines.length === 0) {
          lines.push({ type: 'system', text: `Process exited with code ${result.code}`, ts: Date.now() });
        }
        updateSession(activeSession, { output: [...newOutput, ...lines] });
        return;
      } catch { /* fallback to simulation */ }
    }

    // Simulate response
    const simKey = trimmed.toLowerCase();
    if (SIMULATED_RESPONSES[simKey]) {
      updateSession(activeSession, {
        output: [...newOutput, { type: 'output', text: SIMULATED_RESPONSES[simKey], ts: Date.now() }]
      });
    } else if (simKey.startsWith('echo ')) {
      updateSession(activeSession, {
        output: [...newOutput, { type: 'output', text: trimmed.slice(5), ts: Date.now() }]
      });
    } else {
      updateSession(activeSession, {
        output: [...newOutput, { type: 'system', text: `Command simulated: "${trimmed}" (shell.exec not available)`, ts: Date.now() }]
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void executeCommand(input);
      setInput('');
      setSuggestions([]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const session = sessions.find(s => s.id === activeSession);
      if (session && session.history.length > 0) {
        const newIdx = session.historyIndex < 0
          ? session.history.length - 1
          : Math.max(0, session.historyIndex - 1);
        updateSession(activeSession, { historyIndex: newIdx });
        setInput(session.history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const session = sessions.find(s => s.id === activeSession);
      if (session && session.historyIndex >= 0) {
        const newIdx = session.historyIndex + 1;
        if (newIdx >= session.history.length) {
          updateSession(activeSession, { historyIndex: -1 });
          setInput('');
        } else {
          updateSession(activeSession, { historyIndex: newIdx });
          setInput(session.history[newIdx]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setSuggestions([]);
      } else {
        const matches = COMMON_COMMANDS.filter(c => c.startsWith(input.toLowerCase()));
        if (matches.length === 1) {
          setInput(matches[0]);
        } else if (matches.length > 1) {
          setSuggestions(matches.slice(0, 5));
        }
      }
    } else {
      setSuggestions([]);
    }
  };

  const addSession = () => {
    sessionCounter.current++;
    const id = String(sessionCounter.current);
    setSessions(prev => [...prev, {
      id,
      label: `Terminal ${sessionCounter.current}`,
      projectId: null,
      history: [],
      historyIndex: -1,
      output: [{ type: 'system', text: 'New terminal session', ts: Date.now() }]
    }]);
    setActiveSession(id);
  };

  const closeSession = (id: string) => {
    if (sessions.length <= 1) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession === id) {
      setActiveSession(sessions.find(s => s.id !== id)?.id || sessions[0].id);
    }
  };

  const handleCopyOutput = () => {
    const text = currentSession.output.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleProjectChange = (projectId: string) => {
    updateSession(activeSession, { projectId: projectId || null });
    if (projectId) {
      const proj = projects.find(p => p.id === projectId);
      if (proj) {
        const line: OutputLine = { type: 'system', text: `Changed directory to: ${proj.path}`, ts: Date.now() };
        updateSession(activeSession, { output: [...currentSession.output, line], projectId });
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white">Terminal</h1>
          <select
            value={currentSession.projectId || ''}
            onChange={e => handleProjectChange(e.target.value)}
            className="rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] text-[#999] focus:border-[#333] focus:outline-none"
          >
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleCopyOutput} className="btn-soft text-[10px] px-2 py-0.5">Copy</button>
          <button onClick={() => updateSession(activeSession, { output: [] })} className="btn-soft text-[10px] px-2 py-0.5">Clear</button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="flex gap-1.5 mb-2">
        {QUICK_COMMANDS.map(qc => (
          <button
            key={qc.cmd}
            onClick={() => { void executeCommand(qc.cmd); }}
            className="rounded border border-[#222] bg-[#111] px-2 py-0.5 text-[10px] text-[#888] hover:text-white hover:border-[#333] transition-colors font-mono"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-0.5 mb-1">
        {sessions.map(s => (
          <div
            key={s.id}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-t text-[10px] cursor-pointer transition-colors ${
              s.id === activeSession ? 'bg-black text-white border border-b-0 border-[#333]' : 'bg-[#111] text-[#666] hover:text-[#999]'
            }`}
            onClick={() => setActiveSession(s.id)}
          >
            <span>{s.label}</span>
            {sessions.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}
                className="text-[#555] hover:text-red-400 ml-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addSession}
          className="px-1.5 py-0.5 text-[10px] text-[#555] hover:text-white transition-colors"
          title="New terminal"
        >
          +
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto rounded-t border border-[#222] bg-black p-3 font-mono text-xs leading-relaxed min-h-0 cursor-text"
      >
        {currentSession.output.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-all ${
              line.type === 'input' ? 'text-white' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'system' ? 'text-[#555] italic' :
              'text-green-400'
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 bg-[#111] border-x border-[#222] px-3 py-1">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus(); }}
              className="text-[10px] font-mono text-[#0070F3] hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center border border-t-0 border-[#222] bg-black rounded-b px-3 py-2">
        <span className="text-green-400 font-mono text-xs mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-white font-mono text-xs placeholder-[#333] focus:outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
