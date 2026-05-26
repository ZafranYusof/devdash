import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-gray-400">Page not found</p>
      <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="mt-8 rounded-md bg-white px-6 py-2.5 font-medium text-black hover:bg-gray-200 transition">
        Go Home
      </Link>
    </div>
  );
}
