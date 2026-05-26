import { useEffect, useState } from 'react';
import { pushNotification } from './NotificationCenter';

const CURRENT_VERSION = '0.25.1';
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/ZafranYusof/devdash/releases/latest';

interface ReleaseInfo {
  version: string;
  url: string;
  name: string;
}

let cachedRelease: ReleaseInfo | null = null;
let lastChecked = 0;

export function useUpdateChecker() {
  const [update, setUpdate] = useState<ReleaseInfo | null>(cachedRelease);

  useEffect(() => {
    const check = async () => {
      if (Date.now() - lastChecked < CHECK_INTERVAL && cachedRelease !== undefined) return;
      try {
        const res = await fetch(GITHUB_RELEASES_URL);
        if (!res.ok) return;
        const data = await res.json();
        const tagName: string = data.tag_name || '';
        const version = tagName.replace(/^v/, '');
        lastChecked = Date.now();

        if (version && version !== CURRENT_VERSION && isNewer(version, CURRENT_VERSION)) {
          const info: ReleaseInfo = {
            version,
            url: data.html_url || `https://github.com/ZafranYusof/devdash/releases/tag/${tagName}`,
            name: data.name || `v${version}`,
          };
          cachedRelease = info;
          setUpdate(info);
          pushNotification({
            type: 'info',
            title: `Update available: v${version}`,
            body: 'Check Settings for download link',
          });
        } else {
          cachedRelease = null;
          setUpdate(null);
        }
      } catch {
        // silently fail
      }
    };

    void check();
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return update;
}

function isNewer(remote: string, local: string): boolean {
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}

export default function UpdateChecker() {
  const update = useUpdateChecker();

  if (!update) return null;

  return (
    <div className="card p-3 border-l-4 border-l-[#0070F3]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-white">Update Available</div>
          <div className="text-[11px] text-[#888] mt-0.5">
            v{CURRENT_VERSION} → v{update.version}
          </div>
        </div>
        <button
          onClick={() => window.devdash.shell.openExternal(update.url)}
          className="btn-soft"
        >
          Download
        </button>
      </div>
    </div>
  );
}
