import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (password !== confirm) { setErr('Passwords do not match'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reset failed');
      }
      setDone(true);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white">Reset password</h1>
        <p className="mt-2 text-sm text-gray-400">Enter your new password below.</p>
        {done ? (
          <div className="mt-8 rounded-lg border border-[#222] bg-[#111] p-6 text-center">
            <p className="text-green-400">Password reset successfully!</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
              Sign in with new password
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-[#333] bg-[#111] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="rounded-md border border-[#333] bg-[#111] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              disabled={busy}
              className="rounded-md bg-white px-4 py-2.5 font-medium text-black hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {busy ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
