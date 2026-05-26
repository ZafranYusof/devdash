import { useState, useEffect } from 'react';

interface WebhookEvent {
  id: string;
  source: 'github' | 'vercel' | 'render' | 'unknown';
  event: string;
  payload: string;
  timestamp: number;
  isError: boolean;
}

const STORAGE_KEY = 'devdash-webhook-events';

function loadEvents(): WebhookEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveEvents(events: WebhookEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 100)));
}

// Simulate some webhook events for demo
function generateMockEvents(): WebhookEvent[] {
  const sources: WebhookEvent['source'][] = ['github', 'vercel', 'render'];
  const events = ['push', 'deployment', 'deployment_status', 'pull_request', 'check_run'];
  const now = Date.now();
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `wh-${now}-${i}`,
    source: sources[i % 3],
    event: events[i % 5],
    payload: JSON.stringify({ action: 'completed', ref: 'refs/heads/main', status: i % 4 === 0 ? 'failure' : 'success' }),
    timestamp: now - i * 300000,
    isError: i % 4 === 0,
  }));
}

export default function WebhookReceiver() {
  const [events, setEvents] = useState<WebhookEvent[]>(() => {
    const stored = loadEvents();
    return stored.length > 0 ? stored : generateMockEvents();
  });
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const filteredEvents = filterSource === 'all'
    ? events
    : events.filter((e) => e.source === filterSource);

  const clearEvents = () => {
    setEvents([]);
  };

  const sourceColor = (source: string) => {
    switch (source) {
      case 'github': return 'text-[#9333EA]';
      case 'vercel': return 'text-white';
      case 'render': return 'text-[#00C853]';
      default: return 'text-[#666]';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white">Webhook Events</h3>
        <div className="flex items-center gap-2">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-[#111] border border-[#333] rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="github">GitHub</option>
            <option value="vercel">Vercel</option>
            <option value="render">Render</option>
          </select>
          <button onClick={clearEvents} className="btn-soft">Clear</button>
        </div>
      </div>

      {/* Webhook URL display */}
      <div className="card p-3">
        <div className="text-[10px] text-[#555] mb-1">Webhook URL (concept)</div>
        <div className="flex items-center gap-2">
          <code className="text-[11px] text-[#888] bg-[#0A0A0A] px-2 py-1 rounded flex-1 truncate">
            http://localhost:4829/webhooks/receive
          </code>
          <button
            onClick={() => navigator.clipboard.writeText('http://localhost:4829/webhooks/receive')}
            className="btn-soft"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Event log */}
      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#555]">No webhook events received</div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="card p-2 flex items-center gap-2">
              <span className={`text-[10px] font-mono w-14 shrink-0 ${sourceColor(event.source)}`}>
                {event.source}
              </span>
              <span className="text-[11px] text-[#888] flex-1 truncate">{event.event}</span>
              {event.isError && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EE0000]/10 text-[#EE0000]">error</span>
              )}
              <span className="text-[10px] text-[#444] shrink-0">
                {new Date(event.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
