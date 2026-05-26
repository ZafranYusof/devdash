import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }
      setSent(true);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter your email and we'll send you a reset link.
        </p>
        {sent ? (
          <div className="mt-8 rounded-lg border border-[#222] bg-[#111] p-6 text-center">
            <p className="text-green-400">Check your email for a reset link.</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-[#333] bg-[#111] px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              disabled={busy}
              className="rounded-md bg-white px-4 py-2.5 font-medium text-black hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {busy ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-gray-400">
          <Link to="/login" className="text-blue-400 hover:text-blue-300">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
