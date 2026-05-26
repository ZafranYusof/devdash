import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-[Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">{'{{DISPLAY_NAME}}'}</Link>
          <nav className="flex items-center gap-4">
            <Link href="/settings" className="text-sm text-gray-400 hover:text-white transition">Settings</Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">Admin</Link>
            )}
            <form action="/api/auth/logout" method="post">
              <button className="text-sm text-gray-400 hover:text-white transition">Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user.email?.split('@')[0]}</h1>
          <p className="mt-1 text-gray-400">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: '2,847', change: '+12.5%' },
            { label: 'Revenue', value: '$45,231', change: '+8.2%' },
            { label: 'Active Projects', value: '12', change: '+2' },
            { label: 'API Calls', value: '1.2M', change: '+18.7%' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-[#222] bg-[#111] p-5">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-green-400">{stat.change} from last month</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-lg border border-[#222] bg-[#111] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'New user registered', detail: 'john@example.com', time: '2 minutes ago' },
                { action: 'Payment received', detail: '$29.00 - Pro plan', time: '1 hour ago' },
                { action: 'API key generated', detail: 'Production environment', time: '3 hours ago' },
                { action: 'Project deployed', detail: 'my-saas-app v2.1.0', time: '5 hours ago' },
                { action: 'Team member invited', detail: 'sarah@company.com', time: '1 day ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#222] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-[#222] bg-[#111] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Create new project', icon: '➕' },
                { label: 'Invite team member', icon: '👥' },
                { label: 'View analytics', icon: '📊' },
                { label: 'Generate API key', icon: '🔑' },
                { label: 'View documentation', icon: '📖' },
              ].map((action, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 rounded-md border border-[#222] bg-[#0A0A0A] px-4 py-3 text-sm text-gray-300 hover:border-[#444] hover:text-white transition"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
