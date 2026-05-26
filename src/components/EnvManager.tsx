import { useState, useEffect, useCallback } from 'react';
import type { ProjectConfig, EnvEntry } from '../types';

interface EnvProject {
  project: ProjectConfig;
  files: { file: string; path: string; exists: boolean; varCount: number }[];
  entries: Record<string, EnvEntry[]>;
}

interface CompareItem {
  key: string;
  localValue: string | null;
  remoteValue: string | null;
  status: 'only-local' | 'only-remote' | 'match' | 'differ';
}

export default function EnvManager() {
  const [projects, setProjects] = useState<EnvProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [compareData, setCompareData] = useState<{ projectId: string; items: CompareItem[] } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [newVarProject, setNewVarProject] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await window.devdash.projects.list();
      const envProjects: EnvProject[] = [];

      for (const project of projectList) {
        try {
          const files = await window.devdash.env.scan(project.id);
          const entries: Record<string, EnvEntry[]> = {};
          for (const f of files) {
            if (f.exists) {
              try {
                const detail = await window.devdash.env.read(project.id, f.file);
                entries[f.file] = detail.entries;
              } catch { entries[f.file] = []; }
            }
          }
          if (files.length > 0) {
            envProjects.push({ project, files, entries });
          }
        } catch { /* skip */ }
      }

      setProjects(envProjects);
    } catch (err) {
      console.error('EnvManager load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCompare = async (projectId: string) => {
    setCompareLoading(true);
    try {
      const result = await window.devdash.env.syncCompare(projectId);
      if (result.ok) {
        setCompareData({ projectId, items: result.items });
      } else {
        showToast(result.error || 'Compare failed');
      }
    } catch {
      showToast('Compare not available');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSync = async (projectId: string) => {
    try {
      if (!compareData || compareData.projectId !== projectId) {
        showToast('Run Compare first');
        return;
      }
      const keysToSync = compareData.items
        .filter(i => i.status === 'only-local' || i.status === 'differ')
        .map(i => i.key);
      if (keysToSync.length === 0) {
        showToast('Nothing to sync');
        return;
      }
      const result = await window.devdash.env.syncPush(projectId, keysToSync);
      if (result.ok) {
        showToast(`Synced ${result.pushed.length} vars to cloud`);
      } else {
        showToast(result.error || 'Sync failed');
      }
    } catch {
      showToast('Sync coming soon');
    }
  };

  const handleGenerateExample = (projectId: string) => {
    const proj = projects.find(p => p.project.id === projectId);
    if (!proj) return;
    const allKeys = new Set<string>();
    Object.values(proj.entries).forEach(entries => {
      entries.forEach(e => allKeys.add(e.key));
    });
    const content = Array.from(allKeys).sort().map(k => `${k}=`).join('\n');
    navigator.clipboard.writeText(content);
    showToast('Copied .env.example to clipboard');
  };

  const handleExportJson = () => {
    const data: Record<string, Record<string, Record<string, string>>> = {};
    for (const proj of filteredProjects) {
      data[proj.project.name] = {};
      for (const [file, entries] of Object.entries(proj.entries)) {
        data[proj.project.name][file] = {};
        entries.forEach(e => {
          data[proj.project.name][file][e.key] = e.value;
        });
      }
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Exported JSON to clipboard');
  };

  const handleAddVar = async (projectId: string) => {
    if (!newKey.trim()) return;
    const proj = projects.find(p => p.project.id === projectId);
    if (!proj) return;
    const firstFile = proj.files.find(f => f.exists)?.file || '.env';
    const existing = proj.entries[firstFile] || [];
    const updated = [...existing, { key: newKey.trim(), value: newValue }];
    try {
      await window.devdash.env.write(projectId, firstFile, updated);
      showToast(`Added ${newKey.trim()}`);
      setNewKey('');
      setNewValue('');
      setNewVarProject(null);
      void loadData();
    } catch {
      showToast('Failed to add variable');
    }
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const maskValue = (value: string, key: string) => {
    if (revealedKeys.has(key)) return value;
    if (value.length <= 4) return '••••';
    return value.slice(0, 2) + '•'.repeat(Math.min(value.length - 4, 20)) + value.slice(-2);
  };

  const filteredProjects = projects.filter(p => {
    if (selectedProject && p.project.id !== selectedProject) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    if (p.project.name.toLowerCase().includes(q)) return true;
    for (const entries of Object.values(p.entries)) {
      if (entries.some(e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q))) return true;
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#1a1a1a]" />
        <div className="h-64 rounded bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Environment Manager</h1>
          <p className="text-xs text-[#666] mt-0.5">{projects.length} projects with env files</p>
        </div>
        <button onClick={handleExportJson} className="btn-soft text-xs">
          Export JSON
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search env vars across all projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded border border-[#222] bg-[#0a0a0a] px-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#333] focus:outline-none"
        />
        <select
          value={selectedProject || ''}
          onChange={e => setSelectedProject(e.target.value || null)}
          className="rounded border border-[#222] bg-[#0a0a0a] px-2 py-1.5 text-sm text-white focus:border-[#333] focus:outline-none"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.project.id} value={p.project.id}>{p.project.name}</option>
          ))}
        </select>
      </div>

      {/* Project Cards */}
      {filteredProjects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#333] mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6M12 9v6M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="text-sm text-[#666]">No env files found</p>
          <p className="text-xs text-[#444] mt-1">Add projects with .env files to manage them here</p>
        </div>
      ) : (
        filteredProjects.map(proj => (
          <div key={proj.project.id} className="card">
            {/* Project Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h3 className="text-sm font-medium text-white">{proj.project.name}</h3>
                <span className="text-[10px] text-[#555] bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                  {Object.values(proj.entries).flat().length} vars
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleCompare(proj.project.id)}
                  disabled={compareLoading}
                  className="btn-soft text-[10px] px-2 py-0.5"
                >
                  {compareLoading && compareData?.projectId === proj.project.id ? 'Comparing...' : 'Compare'}
                </button>
                <button
                  onClick={() => handleSync(proj.project.id)}
                  className="btn-soft text-[10px] px-2 py-0.5"
                >
                  Sync to Cloud
                </button>
                <button
                  onClick={() => handleGenerateExample(proj.project.id)}
                  className="btn-soft text-[10px] px-2 py-0.5"
                >
                  .env.example
                </button>
                <button
                  onClick={() => setNewVarProject(newVarProject === proj.project.id ? null : proj.project.id)}
                  className="btn-soft text-[10px] px-2 py-0.5"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Add new var inline */}
            {newVarProject === proj.project.id && (
              <div className="flex gap-2 mb-3 p-2 rounded bg-[#0a0a0a] border border-[#222]">
                <input
                  type="text"
                  placeholder="KEY"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value.toUpperCase())}
                  className="flex-1 rounded border border-[#222] bg-[#111] px-2 py-1 text-xs text-white font-mono placeholder-[#555] focus:border-[#333] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="flex-1 rounded border border-[#222] bg-[#111] px-2 py-1 text-xs text-white font-mono placeholder-[#555] focus:border-[#333] focus:outline-none"
                />
                <button onClick={() => handleAddVar(proj.project.id)} className="btn-primary text-[10px] px-2 py-1">
                  Save
                </button>
              </div>
            )}

            {/* Env var table per file */}
            {Object.entries(proj.entries).map(([file, entries]) => (
              <div key={file} className="mb-2">
                <div className="text-[10px] text-[#555] font-mono mb-1 px-1">{file}</div>
                <div className="rounded border border-[#1a1a1a] overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#0a0a0a] text-[#666]">
                        <th className="text-left px-2 py-1 font-medium w-1/3">Key</th>
                        <th className="text-left px-2 py-1 font-medium">Value</th>
                        <th className="text-right px-2 py-1 font-medium w-16">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries
                        .filter(e => !search || e.key.toLowerCase().includes(search.toLowerCase()) || e.value.toLowerCase().includes(search.toLowerCase()))
                        .map(entry => {
                          const uniqueKey = `${proj.project.id}:${file}:${entry.key}`;
                          return (
                            <tr key={uniqueKey} className="border-t border-[#1a1a1a] hover:bg-[#111]">
                              <td className="px-2 py-1 font-mono text-[#0070F3]">{entry.key}</td>
                              <td className="px-2 py-1 font-mono text-[#999]">
                                <span
                                  className="cursor-pointer hover:text-white transition-colors"
                                  onClick={() => toggleReveal(uniqueKey)}
                                  title={revealedKeys.has(uniqueKey) ? 'Click to hide' : 'Click to reveal'}
                                >
                                  {maskValue(entry.value, uniqueKey)}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-right text-[#444]">{file}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Compare results */}
            {compareData && compareData.projectId === proj.project.id && (
              <div className="mt-3 p-2 rounded bg-[#0a0a0a] border border-[#222]">
                <div className="text-[10px] text-[#666] font-medium mb-2">Cloud Comparison</div>
                <div className="space-y-1">
                  {compareData.items.map(item => (
                    <div key={item.key} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className={`px-1 py-0.5 rounded text-[9px] ${
                        item.status === 'match' ? 'bg-green-900/30 text-green-400' :
                        item.status === 'differ' ? 'bg-amber-900/30 text-amber-400' :
                        item.status === 'only-local' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[#999]">{item.key}</span>
                    </div>
                  ))}
                  {compareData.items.length === 0 && (
                    <p className="text-[10px] text-[#555]">No differences found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Secret Vault Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Secret Vault</h3>
            <p className="text-[10px] text-[#555] mt-0.5">Toggle visibility of all secret values</p>
          </div>
          <button
            onClick={() => {
              if (revealedKeys.size > 0) {
                setRevealedKeys(new Set());
              } else {
                const allKeys = new Set<string>();
                filteredProjects.forEach(proj => {
                  Object.entries(proj.entries).forEach(([file, entries]) => {
                    entries.forEach(e => allKeys.add(`${proj.project.id}:${file}:${e.key}`));
                  });
                });
                setRevealedKeys(allKeys);
              }
            }}
            className="btn-soft text-xs"
          >
            {revealedKeys.size > 0 ? '🔒 Hide All' : '👁 Reveal All'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded bg-[#1a1a1a] border border-[#333] px-4 py-2 text-sm text-white shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
