import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 font-[Inter,sans-serif]">
      <div className="text-center">
        <p className="text-[#0070F3] text-sm font-semibold uppercase tracking-wider">404 Error</p>
        <h1 className="mt-4 text-5xl font-bold text-white sm:text-7xl">Page not found</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/" className="rounded-md bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 transition">
            Go home
          </Link>
          <Link to="/dashboard" className="rounded-md border border-[#333] px-6 py-3 font-semibold text-white hover:border-[#555] transition">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
