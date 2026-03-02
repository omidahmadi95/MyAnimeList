import { useState, useEffect, useCallback } from 'react';
import { fetchPopularManga } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Spinner from '../components/Spinner';

const PAGE_SIZE = 20;

export default function Home() {
  const [manga, setManga] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (pageIndex) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPopularManga(PAGE_SIZE, pageIndex * PAGE_SIZE);
      setManga(result.items);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load manga. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Popular Manga</h1>
        {total > 0 && (
          <span className="text-sm text-gray-400">{total.toLocaleString()} titles</span>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => load(page)} className="btn-secondary text-sm py-1">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {manga.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>

          {/* Pagination */}
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
