import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchManga } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Spinner from '../components/Spinner';

const PAGE_SIZE = 20;

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = useCallback(
    async (q, pageIndex) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const data = await searchManga(q, PAGE_SIZE, pageIndex * PAGE_SIZE);
        setResults(data.items);
        setTotal(data.total);
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-run search when query or page changes
  useEffect(() => {
    setPage(0);
    doSearch(query, 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, doSearch]);

  useEffect(() => {
    doSearch(query, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {query ? (
            <>
              Results for <span className="text-blue-400">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            'Search'
          )}
        </h1>
        {total > 0 && !loading && (
          <span className="text-sm text-gray-400">{total.toLocaleString()} results</span>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No results found.</p>
          <p className="text-sm mt-1">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
