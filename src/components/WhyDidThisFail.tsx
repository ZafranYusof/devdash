import { useState } from 'react';

interface Props {
  deployId: string;
  projectName: string;
  errorLog?: string;
  onRetry?: () => void;
}

const COMMON_ERRORS: Array<{ pattern: RegExp; cause: string; suggestion: string }> = [
  { pattern: /npm (ERR!|error).*install/i, cause: 'npm install failed', suggestion: 'Check package.json for invalid dependencies or try clearing node_modules and package-lock.json' },
  { pattern: /typescript|ts\(\d+\)/i, cause: 'TypeScript compilation error', suggestion: 'Fix type errors in the indicated files. Run `tsc --noEmit` locally to see all errors.' },
  { pattern: /timeout|ETIMEDOUT/i, cause: 'Build timeout', suggestion: 'Optimize build time by reducing bundle size or increasing timeout limits in deploy settings.' },
  { pattern: /out of memory|heap|OOM/i, cause: 'Out of memory', suggestion: 'Reduce memory usage during build. Try setting NODE_OPTIONS=--max-old-space-size=4096' },
  { pattern: /EADDRINUSE|port.*in use/i, cause: 'Port conflict', suggestion: 'Another process is using the required port. Check your start script port configuration.' },
  { pattern: /MODULE_NOT_FOUND|Cannot find module/i, cause: 'Missing dependency', suggestion: 'A required module is not installed. Check imports and ensure all dependencies are in package.json.' },
  { pattern: /ENOENT|no such file/i, cause: 'File not found', suggestion: 'A referenced file or directory does not exist. Check file paths and build output directory settings.' },
  { pattern: /permission denied|EACCES/i, cause: 'Permission denied', suggestion: 'File permission issue. Check that build scripts have execute permissions.' },
];

function analyzeError(log: string): { cause: string; suggestion: string } | null {
  for (const err of COMMON_ERRORS) {
    if (err.pattern.test(log)) {
      return { cause: err.cause, suggestion: err.suggestion };
    }
  }
  return null;
}

export default function WhyDidThisFail({ deployId, projectName, errorLog, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const log = errorLog || 'Error: Build failed\nnpm ERR! install failed\nnpm ERR! peer dep missing';
  const lastLines = log.split('\n').slice(-20).join('\n');
  const patternMatch = analyzeError(log);

  const runAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await window.devdash.ai.chat([
        { role: 'system', content: 'You are a deployment error analyst. Analyze the error log and provide a brief explanation of what went wrong and how to fix it.' },
        { role: 'user', content: `Analyze this deploy error for project "${projectName}":\n\n${lastLines}` },
      ]);
      if (result.ok) {
        setAiAnalysis(result.content);
      } else {
        setAiAnalysis(null);
      }
    } catch {
      setAiAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-soft text-[#EE0000]">
        Why did this fail?
      </button>
    );
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal-content w-[540px] max-h-[500px] overflow-hidden rounded-xl border border-[#222] bg-[#111] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
          <h2 className="text-sm font-medium text-white">Why did this fail?</h2>
          <button onClick={() => setOpen(false)} className="btn-icon">
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Error context */}
          <div>
            <h3 className="text-[11px] font-medium text-[#888] mb-2">Error Context (last 20 lines)</h3>
            <div className="log-stream max-h-[120px] overflow-y-auto text-[11px]">
              {lastLines}
            </div>
          </div>

          {/* Pattern match analysis */}
          {patternMatch && (
            <div className="card p-3 border-l-4 border-l-[#F5A623]">
              <div className="text-[11px] font-medium text-white mb-1">Likely Cause: {patternMatch.cause}</div>
              <div className="text-[11px] text-[#888]">{patternMatch.suggestion}</div>
            </div>
          )}

          {/* AI Analysis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-[#888]">AI Analysis</h3>
              {!aiAnalysis && (
                <button onClick={runAiAnalysis} className="btn-soft" disabled={analyzing}>
                  {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                </button>
              )}
            </div>
            {aiAnalysis && (
              <div className="card p-3 text-[11px] text-[#ccc] whitespace-pre-wrap">{aiAnalysis}</div>
            )}
          </div>

          {/* Common causes checklist */}
          <div>
            <h3 className="text-[11px] font-medium text-[#888] mb-2">Common Causes Checklist</h3>
            <div className="flex flex-col gap-1">
              {['Dependencies installed correctly?', 'Environment variables set?', 'Build command correct?', 'Node.js version compatible?', 'No TypeScript errors?', 'Output directory correct?'].map((item) => (
                <label key={item} className="flex items-center gap-2 text-[11px] text-[#888]">
                  <input type="checkbox" className="rounded border-[#333]" />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#222] px-4 py-3 flex justify-end gap-2">
          {onRetry && (
            <button onClick={onRetry} className="btn-primary">Try Again</button>
          )}
          <button onClick={() => setOpen(false)} className="btn-soft">Close</button>
        </div>
      </div>
    </div>
  );
}

// AI Summary badge for failed deploys
export function AIDeploySummary({ errorLog, projectName }: { errorLog?: string; projectName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const log = errorLog || '';
  const patternMatch = analyzeError(log);

  const generateSummary = async () => {
    if (summary) { setExpanded(!expanded); return; }
    setLoading(true);
    setExpanded(true);
    try {
      const result = await window.devdash.ai.chat([
        { role: 'system', content: 'Summarize this deploy error in 1-2 sentences and suggest a fix.' },
        { role: 'user', content: `Project: ${projectName}\nError:\n${log.slice(-500)}` },
      ]);
      if (result.ok) {
        setSummary(result.content);
        // Cache in localStorage
        try {
          const cache = JSON.parse(localStorage.getItem('devdash-ai-deploy-summaries') || '{}');
          cache[`${projectName}-${Date.now()}`] = result.content;
          localStorage.setItem('devdash-ai-deploy-summaries', JSON.stringify(cache));
        } catch { /* ignore */ }
      } else {
        setSummary(patternMatch?.suggestion || 'Unable to generate AI summary. Check error logs manually.');
      }
    } catch {
      setSummary(patternMatch?.suggestion || 'Unable to generate AI summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateSummary} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#0070F3]/10 text-[#0070F3] hover:bg-[#0070F3]/20 transition-colors">
        {loading ? '...' : '✦ AI Summary'}
      </button>
      {expanded && summary && (
        <div className="mt-1 text-[11px] text-[#888] bg-[#0A0A0A] rounded p-2 border border-[#1a1a1a]">
          {summary}
        </div>
      )}
    </div>
  );
}
