import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');

  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', joined: '2024-01-15' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', role: 'User', status: 'Active', joined: '2024-02-20' },
    { id: 3, name: 'Marcus Johnson', email: 'marcus@example.com', role: 'User', status: 'Active', joined: '2024-03-10' },
    { id: 4, name: 'Aisha Patel', email: 'aisha@example.com', role: 'Moderator', status: 'Inactive', joined: '2024-01-28' },
    { id: 5, name: 'David Kim', email: 'david@example.com', role: 'User', status: 'Active', joined: '2024-04-05' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-[Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">{'{{DISPLAY_NAME}}'}</Link>
          <nav className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
            <Link to="/settings" className="text-sm text-gray-400 hover:text-white transition">Settings</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-gray-400">Manage users and monitor system health.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: '2,847' },
            { label: 'Active Today', value: '423' },
            { label: 'New This Week', value: '89' },
            { label: 'Revenue (MTD)', value: '$12,450' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-[#222] bg-[#111] p-5">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-[#222] mb-6">
          <nav className="flex gap-6">
            {['users', 'analytics', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition ${activeTab === tab ? 'text-white border-b-2 border-[#0070F3]' : 'text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="rounded-lg border border-[#222] bg-[#111] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#1a1a1a] transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-[#222] px-2.5 py-0.5 text-xs font-medium text-gray-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.joined}</td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-[#0070F3] hover:text-[#3291ff] transition">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="rounded-lg border border-[#222] bg-[#111] p-8 text-center">
            <p className="text-gray-400">Analytics dashboard coming soon.</p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="rounded-lg border border-[#222] bg-[#111] p-6">
            <div className="space-y-3">
              {[
                { time: '17:23:01', level: 'INFO', msg: 'User john@example.com logged in' },
                { time: '17:22:45', level: 'WARN', msg: 'Rate limit approaching for API key sk_live_***' },
                { time: '17:21:30', level: 'INFO', msg: 'Payment processed: $29.00' },
                { time: '17:20:15', level: 'ERROR', msg: 'Failed to send email to invalid@domain' },
                { time: '17:19:00', level: 'INFO', msg: 'New user registered: david@example.com' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3 font-mono text-xs">
                  <span className="text-gray-500">{log.time}</span>
                  <span className={`font-semibold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400'}`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-300">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
