import { Link } from 'react-router-dom';

export default function Dashboard() {
  const stats = [
    { label: 'Total Users', value: '2,847', change: '+12%' },
    { label: 'Revenue', value: '$48.2k', change: '+8%' },
    { label: 'Active Projects', value: '23', change: '+3' },
    { label: 'Uptime', value: '99.9%', change: '' },
  ];

  const activity = [
    { action: 'New user registered', time: '2 minutes ago', icon: '👤' },
    { action: 'Payment received', time: '15 minutes ago', icon: '💰' },
    { action: 'Project deployed', time: '1 hour ago', icon: '🚀' },
    { action: 'Support ticket resolved', time: '3 hours ago', icon: '✅' },
    { action: 'New feature shipped', time: '5 hours ago', icon: '🎉' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-[#222] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">{'{{DISPLAY_NAME}}'}</h1>
          <nav className="flex items-center gap-4">
            <Link to="/settings" className="text-sm text-gray-400 hover:text-white transition">Settings</Link>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-white transition">Admin</Link>
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">Sign Out</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="mt-1 text-gray-400">Welcome back. Here's what's happening.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-[#222] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              {s.change && <p className="mt-1 text-xs text-green-400">{s.change}</p>}
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <div className="mt-4 rounded-lg border border-[#222] bg-[#111] divide-y divide-[#222]">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{a.action}</p>
                    <p className="text-xs text-gray-500">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/settings" className="rounded-lg border border-[#222] bg-[#111] px-4 py-3 text-sm hover:border-[#444] transition">
                ⚙️ Account Settings
              </Link>
              <Link to="/pricing" className="rounded-lg border border-[#222] bg-[#111] px-4 py-3 text-sm hover:border-[#444] transition">
                💎 Upgrade Plan
              </Link>
              <a href="#" className="rounded-lg border border-[#222] bg-[#111] px-4 py-3 text-sm hover:border-[#444] transition">
                📖 Documentation
              </a>
              <a href="#" className="rounded-lg border border-[#222] bg-[#111] px-4 py-3 text-sm hover:border-[#444] transition">
                💬 Get Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
