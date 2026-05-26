import { useEffect, useState } from 'react';

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickCommitModal({ projectId, projectName, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState<string>('Loading status...');
  const [lineCount, setLineCount] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [stageAll, setStageAll] = useState<boolean>(true);
  const [push, setPush] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await window.devdash.projects.gitStatusShort(projectId);
      if (res.ok) {
        setStatus(res.output || 'Clean');
        setLineCount(res.lineCount || 0);
      } else {
        setError(res.error || 'Status failed');
      }
    })();
  }, [projectId]);

  const submit = async () => {
    if (!message.trim()) {
      setError('Commit message required');
      return;
    }
    setBusy(true);
    setError('');
    setLog(['Committing...']);
    const res = await window.devdash.projects.quickCommit({
      id: projectId,
      message: message.trim(),
      stageAll,
      push,
    });
    if (!res.ok) {
      setError(res.error || 'Commit failed');
      setLog((l) => [...l, `FAILED: ${res.error}`]);
      setBusy(false);
      return;
    }
    setLog((l) => [...l, `Commit: ${res.commit}`]);
    if (res.pushed) {
      if (res.pushError) {
        setLog((l) => [...l, `Push failed: ${res.pushError}`]);
      } else {
        setLog((l) => [...l, 'Pushed to remote']);
      }
    }
    setBusy(false);
    setTimeout(() => {
      onSuccess();
    }, 600);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="modal-content w-full max-w-xl rounded-xl border border-[#222] bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Quick commit</h2>
            <p className="text-[10px] text-dash-mute">{projectName}</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-dash-mute">Status ({lineCount} files)</div>
            <pre className="max-h-32 overflow-y-auto rounded-md border border-dash-line bg-dash-bg px-3 py-2 font-mono text-[10px] text-dash-text">
              {status}
            </pre>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-dash-mute">Commit message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="feat: add cool thing"
              rows={3}
              className="mt-1 w-full rounded-md border border-dash-line bg-dash-bg px-2 py-1.5 text-xs text-dash-text"
              autoFocus
            />
          </div>

          <div className="flex gap-4 text-xs text-dash-text">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={stageAll} onChange={(e) => setStageAll(e.target.checked)} />
              Stage all changes
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
              Push after commit
            </label>
          </div>

          {log.length > 0 && (
            <div className="rounded-md border border-dash-line bg-dash-bg/50 px-3 py-2 font-mono text-[10px] text-dash-mute">
              {log.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#222] px-4 py-3">
          <button onClick={onClose} disabled={busy} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={busy || !message.trim()} className="btn-primary">
            {busy ? 'Working...' : 'Commit'}
          </button>
        </div>
      </div>
    </div>
  );
}
