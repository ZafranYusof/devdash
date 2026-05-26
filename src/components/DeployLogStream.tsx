import { useState, useRef, useEffect } from 'react';

interface LogLine {
  id: string;
  text: string;
  timestamp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  deployId?: string;
  projectName?: string;
}

// Simulated log lines for demo (real streaming would need backend)
const SIMULATED_LOGS = [
  'Cloning repository...',
  'Installing dependencies...',
  'npm warn deprecated inflight@1.0.6',
  'npm warn deprecated glob@7.2.3',
  'added 1247 packages in 32s',
  'Running build script...',
  'vite v5.4.2 building for production...',
  'transforming (1247) src/index.tsx',
  'transforming (1248) src/App.tsx',
  '✓ 1532 modules transformed.',
  'rendering chunks...',
  'computing gzip size...',
  'dist/index.html                  0.46 kB │ gzip:  0.30 kB',
  'dist/assets/index-DiwrgTda.css  28.45 kB │ gzip:  5.12 kB',
  'dist/assets/index-BqeVlSrf.js  142.67 kB │ gzip: 45.23 kB',
  '✓ built in 4.21s',
  'Uploading build output...',
  'Deploying to production...',
  'Assigning domains...',
  '✓ Production deployment ready',
];

export default function DeployLogStream({ open, onClose, deployId, projectName }: Props) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open && lines.length === 0) {
      startStream();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  const startStream = () => {
    setStreaming(true);
    setLines([]);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx >= SIMULATED_LOGS.length) {
        setStreaming(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const text = SIMULATED_LOGS[idx];
      setLines((prev) => [...prev, {
        id: `${Date.now()}-${idx}`,
        text,
        timestamp: Date.now(),
      }]);
      idx++;
    }, 300 + Math.random() * 400);
  };

  const copyLog = () => {
    const text = lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const filteredLines = searchQuery
    ? lines.filter((l) => l.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines;

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal-content w-[640px] max-h-[500px] overflow-hidden rounded-xl border border-[#222] bg-[#111] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-white">Deploy Log</h2>
            {projectName && <span className="text-[10px] text-[#666]">{projectName}</span>}
            {streaming && (
              <span className="flex items-center gap-1 text-[10px] text-[#0070F3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0070F3] animate-pulseSlow" />
                Streaming
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLog} className="btn-soft" title="Copy log">
              Copy
            </button>
            <button onClick={onClose} className="btn-icon">
              <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-[#1a1a1a] px-4 py-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in log..."
            className="w-full bg-transparent text-xs text-white placeholder-[#555] focus:outline-none"
          />
        </div>

        {/* Log output */}
        <div ref={logRef} className="flex-1 overflow-y-auto p-4">
          <div className="log-stream min-h-[200px]">
            {filteredLines.map((line) => (
              <div key={line.id} className="text-[#ccc]">
                <span className="text-[#444] mr-2">
                  {new Date(line.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={line.text.startsWith('✓') ? 'text-[#00C853]' : line.text.includes('warn') ? 'text-[#F5A623]' : ''}>
                  {line.text}
                </span>
              </div>
            ))}
            {streaming && (
              <span className="streaming-dots text-[#0070F3]">
                <span>.</span><span>.</span><span>.</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
