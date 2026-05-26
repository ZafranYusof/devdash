import { useState, useEffect } from 'react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: 'integration' | 'monitoring' | 'utility' | 'theme';
  hooks: string[];
  changelog: string[];
  settings: { key: string; label: string; type: 'text' | 'toggle'; default: string | boolean }[];
}

interface EventLogEntry {
  id: string;
  hook: string;
  pluginId: string;
  pluginName: string;
  timestamp: number;
  payload: string;
}

const INSTALLED_KEY = 'devdash-plugins-installed';
const EVENTS_KEY = 'devdash-plugins-events';

const PLUGIN_REGISTRY: Plugin[] = [
  {
    id: 'github-notifications',
    name: 'GitHub Notifications',
    description: 'Shows GitHub notifications directly in DevDash. Get notified about PRs, issues, and mentions without leaving your dashboard.',
    author: 'DevDash Team',
    version: '1.2.0',
    category: 'integration',
    hooks: ['onCommit', 'onError'],
    changelog: ['1.2.0 - Added mention filtering', '1.1.0 - PR review notifications', '1.0.0 - Initial release'],
    settings: [
      { key: 'token', label: 'GitHub Token', type: 'text', default: '' },
      { key: 'showDrafts', label: 'Show Draft PRs', type: 'toggle', default: false },
    ],
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    description: 'Post deploy status, uptime alerts, and build results to your Slack channels automatically.',
    author: 'DevDash Team',
    version: '2.0.1',
    category: 'integration',
    hooks: ['onDeploy', 'onUptimeChange', 'onError'],
    changelog: ['2.0.1 - Fixed webhook retry', '2.0.0 - Thread support', '1.0.0 - Initial release'],
    settings: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', default: '' },
      { key: 'channel', label: 'Channel', type: 'text', default: '#deploys' },
      { key: 'mentionOnError', label: 'Mention on Error', type: 'toggle', default: true },
    ],
  },
  {
    id: 'docker-monitor',
    name: 'Docker Monitor',
    description: 'Monitor Docker container status, resource usage, and health checks from your DevDash dashboard.',
    author: 'Community',
    version: '0.9.0',
    category: 'monitoring',
    hooks: ['onError', 'onUptimeChange'],
    changelog: ['0.9.0 - Beta release', '0.8.0 - Added health checks', '0.7.0 - Resource graphs'],
    settings: [
      { key: 'socketPath', label: 'Docker Socket', type: 'text', default: '/var/run/docker.sock' },
      { key: 'autoRestart', label: 'Auto-restart unhealthy', type: 'toggle', default: false },
    ],
  },
  {
    id: 'custom-scripts',
    name: 'Custom Scripts',
    description: 'Run user-defined scripts on events like deploys, errors, or uptime changes. Automate your workflow.',
    author: 'DevDash Team',
    version: '1.1.0',
    category: 'utility',
    hooks: ['onDeploy', 'onUptimeChange', 'onCommit', 'onError'],
    changelog: ['1.1.0 - Added script timeout', '1.0.0 - Initial release'],
    settings: [
      { key: 'scriptsDir', label: 'Scripts Directory', type: 'text', default: './scripts' },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'text', default: '30' },
    ],
  },
  {
    id: 'theme-pack',
    name: 'Theme Pack',
    description: 'Additional themes for DevDash including Dracula, Nord, Solarized, Monokai, and more.',
    author: 'Community',
    version: '1.3.0',
    category: 'theme',
    hooks: [],
    changelog: ['1.3.0 - Added Catppuccin', '1.2.0 - Added Gruvbox', '1.1.0 - Added Nord', '1.0.0 - Dracula & Solarized'],
    settings: [
      { key: 'activeTheme', label: 'Active Theme', type: 'text', default: 'dracula' },
    ],
  },
];

const HOOK_DESCRIPTIONS: Record<string, string> = {
  onDeploy: 'Fires when a deployment completes (success or failure)',
  onUptimeChange: 'Fires when uptime status changes (up → down or down → up)',
  onCommit: 'Fires when a new commit is pushed to a tracked project',
  onError: 'Fires when an error threshold is exceeded',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PluginsView() {
  const [installed, setInstalled] = useState<string[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [view, setView] = useState<'registry' | 'installed' | 'detail' | 'create' | 'events'>('registry');

  useEffect(() => {
    try {
      const i = localStorage.getItem(INSTALLED_KEY);
      if (i) setInstalled(JSON.parse(i));
      const e = localStorage.getItem(EVENTS_KEY);
      if (e) setEvents(JSON.parse(e));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed)); }, [installed]);
  useEffect(() => { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); }, [events]);

  const toggleInstall = (pluginId: string) => {
    const plugin = PLUGIN_REGISTRY.find(p => p.id === pluginId);
    if (installed.includes(pluginId)) {
      setInstalled(prev => prev.filter(id => id !== pluginId));
      if (plugin) {
        addEvent('uninstall', pluginId, plugin.name, `Uninstalled ${plugin.name}`);
      }
    } else {
      setInstalled(prev => [...prev, pluginId]);
      if (plugin) {
        addEvent('install', pluginId, plugin.name, `Installed ${plugin.name} v${plugin.version}`);
      }
    }
  };

  const addEvent = (hook: string, pluginId: string, pluginName: string, payload: string) => {
    const entry: EventLogEntry = {
      id: generateId(),
      hook,
      pluginId,
      pluginName,
      timestamp: Date.now(),
      payload,
    };
    setEvents(prev => [entry, ...prev].slice(0, 100));
  };

  const simulateHook = (hook: string) => {
    const affectedPlugins = PLUGIN_REGISTRY.filter(p => installed.includes(p.id) && p.hooks.includes(hook));
    affectedPlugins.forEach(p => {
      addEvent(hook, p.id, p.name, `${hook} triggered for ${p.name}`);
    });
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getCategoryColor = (cat: Plugin['category']) => {
    switch (cat) {
      case 'integration': return '#0070F3';
      case 'monitoring': return '#50E3C2';
      case 'utility': return '#F5A623';
      case 'theme': return '#7928CA';
    }
  };

  // Plugin detail view
  if (view === 'detail' && selectedPlugin) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView('registry')} className="text-xs text-[#666] hover:text-white">← Back</button>
          <h2 className="text-lg font-semibold text-white">{selectedPlugin.name}</h2>
          <span className="text-xs text-[#555]">v{selectedPlugin.version}</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: getCategoryColor(selectedPlugin.category) + '20', color: getCategoryColor(selectedPlugin.category) }}>
                  {selectedPlugin.category}
                </span>
                <span className="text-xs text-[#666] ml-2">by {selectedPlugin.author}</span>
              </div>
              <button
                onClick={() => toggleInstall(selectedPlugin.id)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${installed.includes(selectedPlugin.id) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'btn-primary'}`}
              >
                {installed.includes(selectedPlugin.id) ? 'Uninstall' : 'Install'}
              </button>
            </div>
            <p className="text-sm text-[#ccc]">{selectedPlugin.description}</p>
          </div>

          {/* Hooks */}
          {selectedPlugin.hooks.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-medium text-[#888] mb-2">Hooks</h3>
              <div className="flex flex-col gap-1">
                {selectedPlugin.hooks.map(h => (
                  <div key={h} className="flex items-center gap-2 p-2 rounded bg-[#0A0A0A] border border-[#222]">
                    <span className="text-xs text-[#0070F3] font-mono">{h}</span>
                    <span className="text-[10px] text-[#555]">{HOOK_DESCRIPTIONS[h]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changelog */}
          <div className="card">
            <h3 className="text-xs font-medium text-[#888] mb-2">Changelog</h3>
            <div className="flex flex-col gap-1">
              {selectedPlugin.changelog.map((entry, idx) => (
                <p key={idx} className="text-xs text-[#ccc]">{entry}</p>
              ))}
            </div>
          </div>

          {/* Settings */}
          {selectedPlugin.settings.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-medium text-[#888] mb-2">Settings</h3>
              <div className="flex flex-col gap-2">
                {selectedPlugin.settings.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <label className="text-xs text-[#ccc]">{s.label}</label>
                    {s.type === 'toggle' ? (
                      <div className="w-8 h-4 rounded-full bg-[#333] relative cursor-pointer">
                        <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-[#666]" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={String(s.default)}
                        className="w-48 rounded border border-[#333] bg-[#0A0A0A] px-2 py-1 text-xs text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create plugin docs view
  if (view === 'create') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView('registry')} className="text-xs text-[#666] hover:text-white">← Back</button>
          <h2 className="text-lg font-semibold text-white">Create a Plugin</h2>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-white mb-3">Plugin API Documentation</h3>
          <div className="text-xs text-[#ccc] space-y-3 font-mono">
            <div className="p-3 rounded bg-[#0A0A0A] border border-[#222]">
              <p className="text-[#0070F3] mb-1">// Plugin manifest (plugin.json)</p>
              <pre className="text-[#ccc] whitespace-pre-wrap">{`{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "What it does",
  "hooks": ["onDeploy", "onError"],
  "settings": [
    { "key": "apiKey", "label": "API Key", "type": "text" }
  ]
}`}</pre>
            </div>

            <div className="p-3 rounded bg-[#0A0A0A] border border-[#222]">
              <p className="text-[#0070F3] mb-1">// Plugin entry (index.ts)</p>
              <pre className="text-[#ccc] whitespace-pre-wrap">{`import { DevDashPlugin } from '@devdash/sdk';

export default class MyPlugin extends DevDashPlugin {
  onDeploy(event) {
    // Called when a deploy completes
    console.log('Deploy:', event.status);
  }

  onError(event) {
    // Called when error threshold exceeded
    this.notify('Error in ' + event.project);
  }
}`}</pre>
            </div>

            <div className="p-3 rounded bg-[#0A0A0A] border border-[#222]">
              <p className="text-[#0070F3] mb-1">// Available hooks</p>
              {Object.entries(HOOK_DESCRIPTIONS).map(([hook, desc]) => (
                <p key={hook} className="text-[#ccc]"><span className="text-[#50E3C2]">{hook}</span>: {desc}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Events log view
  if (view === 'events') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('registry')} className="text-xs text-[#666] hover:text-white">← Back</button>
            <h2 className="text-lg font-semibold text-white">Event Log</h2>
          </div>
          <div className="flex gap-2">
            {Object.keys(HOOK_DESCRIPTIONS).map(hook => (
              <button key={hook} onClick={() => simulateHook(hook)} className="btn-soft text-[10px]">
                Fire {hook}
              </button>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-[#666]">No events yet</p>
            <p className="text-xs text-[#444] mt-1">Install plugins and trigger hooks to see events</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {events.map(e => (
              <div key={e.id} className="card flex items-center gap-3 py-2">
                <span className="text-[10px] font-mono text-[#0070F3] w-24 shrink-0">{e.hook}</span>
                <span className="text-xs text-white flex-1 truncate">{e.payload}</span>
                <span className="text-[10px] text-[#555] shrink-0">{formatTime(e.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main registry / installed view
  const displayPlugins = view === 'installed'
    ? PLUGIN_REGISTRY.filter(p => installed.includes(p.id))
    : PLUGIN_REGISTRY;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Plugins</h2>
          <p className="text-xs text-[#888]">{installed.length} installed · {PLUGIN_REGISTRY.length} available</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('events')} className="btn-soft text-xs">Event Log</button>
          <button onClick={() => setView('create')} className="btn-soft text-xs">Create Plugin</button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 mb-4 border-b border-[#222] pb-2">
        <button
          onClick={() => setView('registry')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${view === 'registry' ? 'bg-[#0070F3] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
        >
          All Plugins
        </button>
        <button
          onClick={() => setView('installed')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${view === 'installed' ? 'bg-[#0070F3] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
        >
          Installed ({installed.length})
        </button>
      </div>

      {/* Plugin grid */}
      {displayPlugins.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-[#666]">No plugins installed</p>
          <p className="text-xs text-[#444] mt-1">Browse the registry to install plugins</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayPlugins.map(plugin => (
            <div key={plugin.id} className="card flex flex-col gap-2 hover:border-[#333] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white truncate">{plugin.name}</h3>
                    <span className="text-[10px] text-[#555]">v{plugin.version}</span>
                  </div>
                  <p className="text-xs text-[#666] mt-0.5">by {plugin.author}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(plugin.category) + '20', color: getCategoryColor(plugin.category) }}>
                  {plugin.category}
                </span>
              </div>

              <p className="text-xs text-[#888] line-clamp-2">{plugin.description}</p>

              {plugin.hooks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {plugin.hooks.map(h => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#666] font-mono">{h}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#1a1a1a]">
                <button
                  onClick={() => { setSelectedPlugin(plugin); setView('detail'); }}
                  className="text-xs text-[#666] hover:text-white"
                >
                  Details
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => toggleInstall(plugin.id)}
                  className={`text-xs px-3 py-1 rounded transition-colors ${installed.includes(plugin.id) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-[#0070F3]/20 text-[#0070F3] hover:bg-[#0070F3]/30'}`}
                >
                  {installed.includes(plugin.id) ? 'Uninstall' : 'Install'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
