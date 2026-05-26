import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total Users', value: '2,847' },
    { label: 'Pro Users', value: '384' },
    { label: 'New (24h)', value: '47' },
    { label: 'Revenue (MTD)', value: '$12.4k' },
  ];

  const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', plan: 'pro', joined: '2024-01-15' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', plan: 'free', joined: '2024-02-20' },
    { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'user', plan: 'pro', joined: '2024-03-10' },
    { id: 4, name: 'David Brown', email: 'david@example.com', role: 'user', plan: 'free', joined: '2024-03-22' },
    { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'user', plan: 'enterprise', joined: '2024-04-01' },
  ];

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-[#222] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-[#222] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Users</h2>
            <input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-[#333] bg-[#111] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-[#222]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#222] bg-[#111]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{u.name}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${u.plan === 'pro' ? 'bg-green-500/20 text-green-400' : u.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
