import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  // Sync input if URL changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link
          to="/"
          className="text-blue-400 font-bold text-xl tracking-tight shrink-0 no-underline"
        >
          MangaReader
        </Link>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button type="submit" className="btn-primary text-sm py-1.5 px-3 shrink-0">
            Search
          </button>
        </form>

        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors no-underline shrink-0">
          Browse
        </Link>
      </div>
    </nav>
  );
}
