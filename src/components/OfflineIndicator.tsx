import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      setDismissed(false);
    };
    const handleOnline = () => {
      setOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (showBackOnline) {
    return (
      <div className="offline-banner flex items-center justify-between rounded-md bg-[#00C853]/10 border border-[#00C853]/20 px-3 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#00C853]" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8.5l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] text-[#00C853]">Back online</span>
        </div>
      </div>
    );
  }

  if (!offline || dismissed) return null;

  return (
    <div className="offline-banner flex items-center justify-between rounded-md bg-[#F5A623]/10 border border-[#F5A623]/20 px-3 py-1.5 mb-3">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 4v5M8 11v1" strokeLinecap="round" />
          <circle cx="8" cy="8" r="7" />
        </svg>
        <span className="text-[11px] text-[#F5A623]">You're offline — some features may not work</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#F5A623]/60 hover:text-[#F5A623] transition-colors"
      >
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
