import { useState, useEffect } from 'react';

interface BackupInfo {
  lastBackup: number | null;
  autoBackupEnabled: boolean;
}

const STORAGE_KEY = 'devdash-backup-config';
const AUTO_BACKUP_KEY = 'devdash-auto-backup-data';

function loadBackupConfig(): BackupInfo {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { lastBackup: null, autoBackupEnabled: false };
}

function saveBackupConfig(config: BackupInfo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function BackupSettings() {
  const [config, setConfig] = useState<BackupInfo>(loadBackupConfig);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [gistExporting, setGistExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    saveBackupConfig(config);
  }, [config]);

  // Auto-backup every 5 minutes
  useEffect(() => {
    if (!config.autoBackupEnabled) return;
    const interval = setInterval(() => {
      const allData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('devdash-')) {
          allData[key] = localStorage.getItem(key) || '';
        }
      }
      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify({ timestamp: Date.now(), data: allData }));
      setConfig((prev) => ({ ...prev, lastBackup: Date.now() }));
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.autoBackupEnabled]);

  const exportToFile = async () => {
    if (!window.devdash?.backup?.export) {
      setMessage({ type: 'error', text: 'Backup API not available in this version' });
      return;
    }
    setExporting(true);
    try {
      const result = await window.devdash.backup.export();
      if (result.ok) {
        setConfig((prev) => ({ ...prev, lastBackup: Date.now() }));
        setMessage({ type: 'success', text: `Exported to ${result.path} (${Math.round((result.bytes || 0) / 1024)}KB)` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Export failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    } finally {
      setExporting(false);
    }
  };

  const importFromFile = async () => {
    if (!window.devdash?.backup?.import) {
      setMessage({ type: 'error', text: 'Backup API not available in this version' });
      return;
    }
    setImporting(true);
    try {
      const result = await window.devdash.backup.import();
      if (result.ok) {
        setMessage({ type: 'success', text: `Imported ${result.projectsRestored || 0} projects` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Import failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    } finally {
      setImporting(false);
    }
  };

  const exportToGist = async () => {
    if (!window.devdash?.backup?.export) {
      setMessage({ type: 'error', text: 'Backup API not available in this version' });
      return;
    }
    setGistExporting(true);
    try {
      const settings = await window.devdash.settings.get();
      if (!settings.githubToken) {
        setMessage({ type: 'error', text: 'GitHub token not configured. Set it in Settings > Tokens.' });
        setGistExporting(false);
        return;
      }
      // Export config data as JSON
      const result = await window.devdash.backup.export();
      if (result.ok) {
        setConfig((prev) => ({ ...prev, lastBackup: Date.now() }));
        setMessage({ type: 'success', text: 'Config exported (Gist upload requires GitHub API - use Export to File for now)' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Export failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    } finally {
      setGistExporting(false);
    }
  };

  const toggleAutoBackup = () => {
    setConfig((prev) => ({ ...prev, autoBackupEnabled: !prev.autoBackupEnabled }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white">Backup</h3>
        {config.lastBackup && (
          <span className="text-[10px] text-[#555]">
            Last backup: {new Date(config.lastBackup).toLocaleString()}
          </span>
        )}
      </div>

      {/* Auto-backup toggle */}
      <div className="flex items-center justify-between p-3 rounded border border-[#222]">
        <div>
          <div className="text-[11px] text-white">Auto-backup</div>
          <div className="text-[10px] text-[#555]">Save to localStorage every 5 minutes</div>
        </div>
        <button
          onClick={toggleAutoBackup}
          className={`relative w-9 h-5 rounded-full transition-colors ${config.autoBackupEnabled ? 'bg-[#0070F3]' : 'bg-[#333]'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${config.autoBackupEnabled ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Export/Import buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={exportToGist} className="btn-soft" disabled={gistExporting}>
          {gistExporting ? '...' : '↑ Export to Gist'}
        </button>
        <button onClick={exportToFile} className="btn-soft" disabled={exporting}>
          {exporting ? '...' : '↓ Export to File'}
        </button>
        <button onClick={importFromFile} className="btn-soft" disabled={importing}>
          {importing ? '...' : '↑ Import from File'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-[11px] p-2 rounded ${message.type === 'success' ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#EE0000]/10 text-[#EE0000]'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
