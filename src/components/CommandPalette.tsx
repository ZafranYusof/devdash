import { useEffect, useMemo, useState } from 'react';
import type { ProjectConfig, Tab } from '../types';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  run: () => void | Promise<unknown>;
  score?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projects: ProjectConfig[];
  onOpenProject: (id: string, tab?: 'overview' | 'logs' | 'env' | 'time' | 'deps' | 'heatmap' | 'screenshots' | 'release') => void;
  onSwitchTab: (tab: Tab) => void;
}

const RECENT_SEARCHES_KEY = 'devdash-recent-searches';

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  try {
    let recent = getRecentSearches();
    recent = [query, ...recent.filter((r) => r !== query)].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch { /* ignore */ }
}

function fuzzy(query: string, candidate: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (c.includes(q)) return 10 + (q.length / c.length);
  // sequential char match
  let i = 0;
  let matches = 0;
  for (const ch of c) {
    if (ch === q[i]) {
      matches++;
      i++;
      if (i >= q.length) break;
    }
  }
  if (matches === q.length) return 1 + matches / c.length;
  return 0;
}

export default function CommandPalette({ open, onClose, projects, onOpenProject, onSwitchTab }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [deploys, setDeploys] = useState<Array<{ projectName: string; status: string; id: string }>>([]);
  const [snippets, setSnippets] = useState<Array<{ id: string; title: string }>>([]);
  const [automations, setAutomations] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    setRecentSearches(getRecentSearches());
    // Load deploys, snippets, automations for enhanced search
    void (async () => {
      try {
        const [dList, sList, aList] = await Promise.all([
          window.devdash.deploys.list(),
          window.devdash.snippets.list(),
          window.devdash.automations.list(),
        ]);
        setDeploys(dList.items.map((d) => ({ projectName: d.projectName, status: d.status, id: d.id })));
        setSnippets(sList.map((s) => ({ id: s.id, title: s.title })));
        setAutomations(aList.map((a) => ({ id: a.id, name: `${a.kind}:${a.projectId}` })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  const actions: PaletteAction[] = useMemo(() => {
    const acts: PaletteAction[] = [];
    // Global tab navigation
    const tabs: Array<{ id: Tab; label: string }> = [
      { id: 'dashboard', label: 'Go: Dashboard' },
      { id: 'projects', label: 'Go: Projects' },
      { id: 'deploys', label: 'Go: Deploys' },
      { id: 'uptime', label: 'Go: Uptime' },
      { id: 'time', label: 'Go: Time' },
      { id: 'deps', label: 'Go: Deps' },
      { id: 'automations', label: 'Go: Automations' },
      { id: 'dbhealth', label: 'Go: DB Health' },
      { id: 'metrics', label: 'Go: Metrics' },
      { id: 'chat', label: 'Go: Chat' },
      { id: 'settings', label: 'Go: Settings' },
    ];
    for (const t of tabs) {
      acts.push({ id: `go:${t.id}`, label: t.label, hint: 'Tab', run: () => onSwitchTab(t.id) });
    }

    // Project actions
    for (const p of projects) {
      acts.push({
        id: `open:${p.id}`,
        label: `${p.name}: Open detail`,
        run: () => onOpenProject(p.id, 'overview'),
      });
      acts.push({
        id: `dev:${p.id}`,
        label: `${p.name}: Run dev server (managed)`,
        run: async () => {
          await window.devdash.devserver.start(p.id);
          onOpenProject(p.id, 'logs');
        },
      });
      acts.push({
        id: `logs:${p.id}`,
        label: `${p.name}: Open logs`,
        run: () => onOpenProject(p.id, 'logs'),
      });
      acts.push({
        id: `env:${p.id}`,
        label: `${p.name}: Open env`,
        run: () => onOpenProject(p.id, 'env'),
      });
      acts.push({
        id: `folder:${p.id}`,
        label: `${p.name}: Open folder`,
        run: () => window.devdash.projects.openFolder(p.path),
      });
      acts.push({
        id: `vscode:${p.id}`,
        label: `${p.name}: Open in VS Code`,
        run: () => window.devdash.projects.openInVSCode(p.path),
      });
      if (p.githubUrl) {
        acts.push({
          id: `gh:${p.id}`,
          label: `${p.name}: Open GitHub`,
          run: () => window.devdash.shell.openExternal(p.githubUrl!),
        });
      }
      if (p.liveUrl) {
        acts.push({
          id: `live:${p.id}`,
          label: `${p.name}: Open live URL`,
          run: () => window.devdash.shell.openExternal(p.liveUrl!),
        });
      }
      acts.push({
        id: `pull:${p.id}`,
        label: `${p.name}: Git pull`,
        run: async () => {
          await window.devdash.projects.pull(p.id);
        },
      });
      acts.push({
        id: `release:${p.id}`,
        label: `${p.name}: Release`,
        run: () => onOpenProject(p.id, 'release'),
      });
      acts.push({
        id: `deps:${p.id}`,
        label: `${p.name}: Run deps check`,
        run: async () => {
          await window.devdash.deps.runNow(p.id);
          onOpenProject(p.id, 'deps');
        },
      });
      acts.push({
        id: `heatmap:${p.id}`,
        label: `${p.name}: Commit heatmap`,
        run: () => onOpenProject(p.id, 'heatmap'),
      });
    }

    // Enhanced search: Deploy entries (Improvement #4)
    for (const d of deploys) {
      acts.push({
        id: `deploy:${d.id}`,
        label: `Deploy: ${d.projectName} (${d.status})`,
        hint: 'Deploy',
        run: () => onSwitchTab('deploys'),
      });
    }

    // Enhanced search: Snippets
    for (const s of snippets) {
      acts.push({
        id: `snippet:${s.id}`,
        label: `Snippet: ${s.title}`,
        hint: 'Snippet',
        run: () => onSwitchTab('snippets'),
      });
    }

    // Enhanced search: Automations
    for (const a of automations) {
      acts.push({
        id: `automation:${a.id}`,
        label: `Automation: ${a.name}`,
        hint: 'Automation',
        run: () => onSwitchTab('automations'),
      });
    }

    return acts;
  }, [projects, onOpenProject, onSwitchTab, deploys, snippets, automations]);

  const results = useMemo(() => {
    const scored = actions.map((a) => ({ a, score: fuzzy(query.trim(), a.label) }));
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((s) => s.a);
  }, [actions, query]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    if (!open) return;
    const h = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = results[index];
        if (pick) {
          if (query.trim()) saveRecentSearch(query.trim());
          onClose();
          await pick.run();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, results, index, onClose, query]);

  if (!open) return null;

  const showRecent = !query.trim() && recentSearches.length > 0;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-start justify-center bg-black/70 pt-24 backdrop-blur-sm">
      <div className="modal-content w-[520px] overflow-hidden rounded-xl border border-[#222] bg-[#111] shadow-2xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type project + action, e.g. 'scoreku dev'"
          className="w-full border-b border-[#222] bg-transparent px-4 py-3 text-sm text-white placeholder-[#666] focus:outline-none"
        />
        {/* Recent searches section */}
        {showRecent && (
          <div className="border-b border-[#1a1a1a] px-4 py-2">
            <div className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Recent</div>
            {recentSearches.map((r, i) => (
              <button
                key={i}
                onClick={() => setQuery(r)}
                className="block w-full text-left px-2 py-1 text-xs text-[#888] hover:text-white hover:bg-white/[0.03] rounded transition-colors"
              >
                <span className="text-[#555] mr-2">↩</span>{r}
              </button>
            ))}
          </div>
        )}
        <ul className="max-h-[360px] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-4 py-3 text-xs text-[#666]">No actions match.</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              onMouseEnter={() => setIndex(i)}
              onClick={async () => {
                if (query.trim()) saveRecentSearch(query.trim());
                onClose();
                await r.run();
              }}
              className={`cursor-pointer px-4 py-2 text-sm transition-colors duration-150 ${
                i === index
                  ? 'bg-white/[0.06] text-white'
                  : 'text-[#888] hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{r.label}</span>
                {r.hint && (
                  <span className="text-[10px] uppercase tracking-wider text-[#444]">
                    {r.hint}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-[#222] px-4 py-2 text-[10px] text-[#444]">
          ↑/↓ navigate · Enter run · Esc close
        </div>
      </div>
    </div>
  );
}
