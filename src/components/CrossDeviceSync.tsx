import { useState, useEffect } from 'react';

interface SyncConfig {
  settings: boolean;
  pinnedTabs: boolean;
  sidebarOrder: boolean;
  pipelines: boolean;
  incidents: boolean;
}

const SYNC_CONFIG_KEY = 'devdash-sync-config';
const SYNC_LAST_KEY = 'devdash-sync-last';

function loadSyncConfig(): SyncConfig {
  try {
    const stored = localStorage.getItem(SYNC_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { settings: true, pinnedTabs: true, sidebarOrder: true, pipelines: false, incidents: false };
}

function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

export default function CrossDeviceSync() {
  const [config, setConfig] = useState<SyncConfig>(loadSyncConfig);
  const [syncStatus, setSyncStatus] = useState<{ enabled: boolean; lastSynced: string | null; status: string }>({ enabled: false, lastSynced: null, status: 'disconnected' });
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    saveSyncConfig(config);
  }, [config]);

  useEffect(() => {
    void (async () => {
      try {
        const status = await window.devdash.sync.status();
        setSyncStatus(status);
      } catch { /* ignore */ }
    })();
  }, []);

  const toggleField = (field: keyof SyncConfig) => {
    setConfig((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const syncNow = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const pushResult = await window.devdash.sync.push();
      if (pushResult.ok) {
        localStorage.setItem(SYNC_LAST_KEY, new Date().toISOString());
        setSyncStatus((prev) => ({ ...prev, lastSynced: new Date().toISOString(), status: 'synced' }));
        setMessage('Sync completed successfully');
      } else {
        setMessage(pushResult.error || 'Sync failed');
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = syncStatus.enabled;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white">Cross-Device Sync</h3>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isConnected ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#333] text-[#666]'}`}>
          {syncStatus.status}
        </span>
      </div>

      {!isConnected ? (
        <div className="card p-3 text-center">
          <div className="text-[11px] text-[#888] mb-2">
            Connect Supabase in Settings &gt; Team to enable cross-device sync
          </div>
        </div>
      ) : (
        <>
          {/* Sync toggles */}
          <div className="flex flex-col gap-2">
            {(Object.keys(config) as Array<keyof SyncConfig>).map((key) => (
              <div key={key} className="flex items-center justify-between p-2 rounded border border-[#1a1a1a]">
                <span className="text-[11px] text-[#888] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button
                  onClick={() => toggleField(key)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${config[key] ? 'bg-[#0070F3]' : 'bg-[#333]'}`}
                >
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${config[key] ? 'left-[14px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Last sync + Sync Now */}
          <div className="flex items-center justify-between">
            {syncStatus.lastSynced && (
              <span className="text-[10px] text-[#555]">
                Last sync: {new Date(syncStatus.lastSynced).toLocaleString()}
              </span>
            )}
            <button onClick={syncNow} className="btn-primary" disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          {/* Conflict resolution note */}
          <div className="text-[10px] text-[#444] italic">
            Conflict resolution: latest timestamp wins
          </div>
        </>
      )}

      {message && (
        <div className={`text-[11px] p-2 rounded ${message.includes('success') ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#EE0000]/10 text-[#EE0000]'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
