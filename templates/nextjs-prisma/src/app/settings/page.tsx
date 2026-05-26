'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: 'John Doe', email: 'john@example.com' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [notifications, setNotifications] = useState({ email: true, marketing: false, updates: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setTimeout(() => {
      setMessage('Profile updated successfully');
      setSaving(false);
    }, 1000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage('Passwords do not match');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setMessage('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-[Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">{'{{DISPLAY_NAME}}'}</Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
            <form action="/api/auth/logout" method="post">
              <button className="text-sm text-gray-400 hover:text-white transition">Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {message && (
          <div className="mb-6 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}

        {/* Profile */}
        <section className="rounded-lg border border-[#222] bg-[#111] p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0070F3] focus:outline-none focus:ring-1 focus:ring-[#0070F3] transition"
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                id="settings-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0070F3] focus:outline-none focus:ring-1 focus:ring-[#0070F3] transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-white px-4 py-2.5 font-semibold text-black hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="rounded-lg border border-[#222] bg-[#111] p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1.5">Current password</label>
              <input
                id="current-password"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0070F3] focus:outline-none focus:ring-1 focus:ring-[#0070F3] transition"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
              <input
                id="new-password"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0070F3] focus:outline-none focus:ring-1 focus:ring-[#0070F3] transition"
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-300 mb-1.5">Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0070F3] focus:outline-none focus:ring-1 focus:ring-[#0070F3] transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-white px-4 py-2.5 font-semibold text-black hover:bg-gray-200 disabled:opacity-50 transition"
            >
              Update Password
            </button>
          </form>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border border-[#222] bg-[#111] p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            {[
              { key: 'email' as const, label: 'Email notifications', desc: 'Receive email about account activity' },
              { key: 'marketing' as const, label: 'Marketing emails', desc: 'Receive emails about new features and updates' },
              { key: 'updates' as const, label: 'Product updates', desc: 'Get notified about product changes' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notifications[item.key] ? 'bg-[#0070F3]' : 'bg-[#333]'}`}
                  role="switch"
                  aria-checked={notifications[item.key]}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="rounded-md border border-red-500/50 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition">
            Delete Account
          </button>
        </section>
      </main>
    </div>
  );
}
