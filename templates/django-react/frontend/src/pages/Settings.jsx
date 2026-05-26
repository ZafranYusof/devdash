import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [notifications, setNotifications] = useState({ email: true, push: false, marketing: false });
  const [saved, setSaved] = useState('');

  const saveProfile = (e) => {
    e.preventDefault();
    setSaved('Profile updated successfully');
    setTimeout(() => setSaved(''), 3000);
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setSaved('Passwords do not match'); return; }
    setSaved('Password changed successfully');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setSaved(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-[#222] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold">Settings</h1>
          <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {saved && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {saved}
          </div>
        )}

        {/* Profile */}
        <section className="rounded-lg border border-[#222] bg-[#111] p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <form onSubmit={saveProfile} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition">
              Save Changes
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="mt-6 rounded-lg border border-[#222] bg-[#111] p-6">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <form onSubmit={changePassword} className="mt-4 flex flex-col gap-4">
            <input
              type="password"
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="rounded-md border border-[#333] bg-[#0A0A0A] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition">
              Update Password
            </button>
          </form>
        </section>

        {/* Notifications */}
        <section className="mt-6 rounded-lg border border-[#222] bg-[#111] p-6">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Email notifications</span>
              <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Push notifications</span>
              <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })} className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Marketing emails</span>
              <input type="checkbox" checked={notifications.marketing} onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })} className="rounded" />
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          <p className="mt-2 text-sm text-gray-400">Once you delete your account, there is no going back.</p>
          <button className="mt-4 rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
            Delete Account
          </button>
        </section>
      </main>
    </div>
  );
}
