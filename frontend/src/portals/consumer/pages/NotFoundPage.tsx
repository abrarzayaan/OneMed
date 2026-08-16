import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-8xl font-head font-bold text-primary-600">404</p>
      <h1 className="text-2xl font-head font-bold text-content-primary">Page Not Found</h1>
      <p className="text-content-muted">The page you are looking for does not exist.</p>
      <Link to="/" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
