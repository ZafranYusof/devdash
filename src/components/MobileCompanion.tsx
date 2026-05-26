import { useState, useEffect } from 'react';

interface PairedDevice {
  id: string;
  name: string;
  type: 'iphone' | 'android' | 'ipad' | 'other';
  lastSeen: number;
  pushEnabled: boolean;
}

interface NotificationSettings {
  deployAlerts: boolean;
  downtimeAlerts: boolean;
  dailySummary: boolean;
  buildFailures: boolean;
  securityAlerts: boolean;
}

interface MiniProject {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastDeploy: string;
}

interface RecentDeploy {
  project: string;
  status: 'success' | 'error' | 'building';
  time: string;
}

const DEVICES_KEY = 'devdash-mobile-devices';
const NOTIF_KEY = 'devdash-mobile-notifications';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateQRPattern(): string[][] {
  // Generate a simple QR-like grid pattern (visual only, not scannable)
  const size = 21;
  const grid: string[][] = [];
  for (let y = 0; y < size; y++) {
    const row: string[] = [];
    for (let x = 0; x < size; x++) {
      // Fixed patterns (position markers)
      const inTopLeft = x < 7 && y < 7;
      const inTopRight = x >= size - 7 && y < 7;
      const inBottomLeft = x < 7 && y >= size - 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const lx = inTopRight ? x - (size - 7) : x;
        const ly = inBottomLeft ? y - (size - 7) : y;
        const isBorder = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        const isInner = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        row.push(isBorder || isInner ? '#' : '.');
      } else {
        // Random data pattern
        row.push(Math.random() > 0.5 ? '#' : '.');
      }
    }
    grid.push(row);
  }
  return grid;
}

export default function MobileCompanion() {
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    deployAlerts: true,
    downtimeAlerts: true,
    dailySummary: false,
    buildFailures: true,
    securityAlerts: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'error'>('waiting');
  const [qrPattern] = useState(() => generateQRPattern());
  const [showToast, setShowToast] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Mock data for preview
  const miniProjects: MiniProject[] = [
    { name: 'devdash', status: 'healthy', lastDeploy: '2h ago' },
    { name: 'portfolio', status: 'healthy', lastDeploy: '1d ago' },
    { name: 'api-server', status: 'warning', lastDeploy: '3h ago' },
    { name: 'mobile-app', status: 'error', lastDeploy: '30m ago' },
  ];

  const recentDeploys: RecentDeploy[] = [
    { project: 'devdash', status: 'success', time: '2h ago' },
    { project: 'mobile-app', status: 'error', time: '30m ago' },
    { project: 'api-server', status: 'success', time: '3h ago' },
    { project: 'portfolio', status: 'building', time: 'now' },
    { project: 'devdash', status: 'success', time: '1d ago' },
  ];

  useEffect(() => {
    try {
      const d = localStorage.getItem(DEVICES_KEY);
      if (d) setDevices(JSON.parse(d));
      const n = localStorage.getItem(NOTIF_KEY);
      if (n) setNotifications(JSON.parse(n));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { localStorage.setItem(DEVICES_KEY, JSON.stringify(devices)); }, [devices]);
  useEffect(() => { localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications)); }, [notifications]);

  // Simulate connection after a delay
  useEffect(() => {
    if (devices.length > 0) {
      setConnectionStatus('connected');
    }
  }, [devices]);

  const addDevice = () => {
    const device: PairedDevice = {
      id: generateId(),
      name: `Device ${devices.length + 1}`,
      type: Math.random() > 0.5 ? 'iphone' : 'android',
      lastSeen: Date.now(),
      pushEnabled: true,
    };
    setDevices(prev => [...prev, device]);
    setConnectionStatus('connected');
  };

  const removeDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    if (devices.length <= 1) setConnectionStatus('waiting');
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const testNotification = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const generateShareLink = () => {
    setShareLink(`https://devdash.app/share/${generateId()}`);
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'success': return 'bg-green-500';
      case 'warning': case 'building': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-[#444]';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Mobile Companion</h2>
          <p className="text-xs text-[#888]">Connect your phone for on-the-go monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
            connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
            connectionStatus === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            {connectionStatus === 'connected' ? `Connected: ${devices.length} device${devices.length !== 1 ? 's' : ''}` :
             connectionStatus === 'error' ? 'Connection error' :
             'Waiting for device...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: QR + Pairing */}
        <div className="flex flex-col gap-4">
          {/* QR Code */}
          <div className="card flex flex-col items-center py-6">
            <h3 className="text-xs font-medium text-[#888] mb-3">Scan to Connect</h3>
            <div className="p-3 bg-white rounded-lg mb-3">
              <svg viewBox={`0 0 ${qrPattern.length * 10} ${qrPattern.length * 10}`} className="w-40 h-40">
                {qrPattern.map((row, y) =>
                  row.map((cell, x) =>
                    cell === '#' ? (
                      <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10" height="10" fill="#000" />
                    ) : null
                  )
                )}
              </svg>
            </div>
            <p className="text-xs text-[#666] text-center max-w-xs">
              Scan this QR code with your phone's camera to pair with DevDash
            </p>
            <button onClick={addDevice} className="btn-soft text-xs mt-3">
              Simulate Pairing
            </button>
          </div>

          {/* Paired Devices */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[#888]">Paired Devices</h3>
              <span className="text-[10px] text-[#555]">{devices.length} device{devices.length !== 1 ? 's' : ''}</span>
            </div>
            {devices.length === 0 ? (
              <p className="text-xs text-[#555] text-center py-4">No devices paired yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded bg-[#0A0A0A] border border-[#222]">
                    <span className="text-lg">{d.type === 'iphone' || d.type === 'ipad' ? '📱' : '📲'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{d.name}</p>
                      <p className="text-[10px] text-[#555]">Last seen: {formatTime(d.lastSeen)}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <button onClick={() => removeDevice(d.id)} className="text-xs text-[#666] hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share Link */}
          <div className="card">
            <h3 className="text-xs font-medium text-[#888] mb-2">Share Dashboard</h3>
            <p className="text-xs text-[#555] mb-3">Generate a link to view your dashboard on any device</p>
            <button onClick={generateShareLink} className="btn-soft text-xs w-full mb-2">
              Generate Share Link
            </button>
            {shareLink && (
              <div className="flex items-center gap-2 p-2 rounded bg-[#0A0A0A] border border-[#222]">
                <span className="text-xs text-[#0070F3] truncate flex-1">{shareLink}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="text-xs text-[#666] hover:text-white shrink-0"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Notifications + Preview */}
        <div className="flex flex-col gap-4">
          {/* Push Notification Settings */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[#888]">Push Notifications</h3>
              <button onClick={testNotification} className="btn-soft text-[10px]">
                Test Notification
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(Object.entries(notifications) as [keyof NotificationSettings, boolean][]).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-xs text-[#ccc]">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </span>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? 'bg-[#0070F3]' : 'bg-[#333]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Preview: Project Status */}
          <div className="card">
            <h3 className="text-xs font-medium text-[#888] mb-3">Mobile Preview — Project Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {miniProjects.map(p => (
                <div key={p.name} className="p-2 rounded bg-[#0A0A0A] border border-[#222]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(p.status)}`} />
                    <span className="text-xs text-white truncate">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-[#555]">{p.lastDeploy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Preview: Recent Deploys */}
          <div className="card">
            <h3 className="text-xs font-medium text-[#888] mb-3">Mobile Preview — Recent Deploys</h3>
            <div className="flex flex-col gap-1">
              {recentDeploys.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-[#1a1a1a] last:border-0">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(d.status)}`} />
                  <span className="text-xs text-white flex-1">{d.project}</span>
                  <span className={`text-[10px] ${d.status === 'error' ? 'text-red-400' : d.status === 'building' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {d.status}
                  </span>
                  <span className="text-[10px] text-[#555]">{d.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Incidents Preview */}
          <div className="card">
            <h3 className="text-xs font-medium text-[#888] mb-3">Mobile Preview — Active Incidents</h3>
            <div className="p-3 rounded bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">mobile-app deploy failed</span>
              </div>
              <p className="text-[10px] text-[#666]">Build error: Module not found — 30m ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification simulation */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className="p-3 rounded-lg bg-[#111] border border-[#333] shadow-xl max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0070F3]" />
              <span className="text-xs font-medium text-white">DevDash Push</span>
            </div>
            <p className="text-xs text-[#ccc]">Test notification received! Your mobile device would see this alert.</p>
          </div>
        </div>
      )}
    </div>
  );
}
