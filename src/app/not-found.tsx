import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="glass-card p-12 rounded-2xl max-w-md mx-auto">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">404</h1>
          <h2 className="text-xl font-semibold text-text-secondary mb-4">
            Page Not Found
          </h2>
          <p className="text-text-muted mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}