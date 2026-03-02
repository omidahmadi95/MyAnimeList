import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchChapterPages, fetchChapters } from '../api/mangadex';
import Spinner from '../components/Spinner';

function useKeyboard(handlers) {
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      handlers[e.key]?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

export default function Reader() {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingMode, setReadingMode] = useState('vertical'); // 'vertical' | 'horizontal'
  const [uiVisible, setUiVisible] = useState(true);
  const [allChapters, setAllChapters] = useState([]);
  const [imgLoaded, setImgLoaded] = useState({});
  const uiTimer = useRef(null);
  const containerRef = useRef(null);

  // Load chapter pages
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setPages([]);
      setCurrentPage(0);
      setImgLoaded({});
      try {
        const urls = await fetchChapterPages(chapterId);
        if (!cancelled) setPages(urls);
      } catch {
        if (!cancelled) setError('Failed to load chapter pages.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [chapterId]);

  // Load chapter list for prev/next navigation
  useEffect(() => {
    let cancelled = false;
    async function loadChapters() {
      try {
        // fetch up to 500 chapters
        const batch1 = await fetchChapters(mangaId, 100, 0);
        let items = batch1.items;
        const total = batch1.total;
        const batches = Math.ceil(total / 100);
        const rest = await Promise.all(
          Array.from({ length: batches - 1 }, (_, i) =>
            fetchChapters(mangaId, 100, (i + 1) * 100).then((d) => d.items)
          )
        );
        items = [...items, ...rest.flat()];
        if (!cancelled) setAllChapters(items);
      } catch {
        // non-critical, skip
      }
    }
    loadChapters();
    return () => { cancelled = true; };
  }, [mangaId]);

  const currentChapterIndex = allChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;
  const currentChapterInfo = allChapters[currentChapterIndex];

  // Horizontal navigation helpers
  const goPrev = useCallback(() => {
    if (readingMode === 'horizontal') {
      if (currentPage > 0) setCurrentPage((p) => p - 1);
      else if (prevChapter) navigate(`/read/${mangaId}/${prevChapter.id}`);
    }
  }, [readingMode, currentPage, prevChapter, mangaId, navigate]);

  const goNext = useCallback(() => {
    if (readingMode === 'horizontal') {
      if (currentPage < pages.length - 1) setCurrentPage((p) => p + 1);
      else if (nextChapter) navigate(`/read/${mangaId}/${nextChapter.id}`);
    }
  }, [readingMode, currentPage, pages.length, nextChapter, mangaId, navigate]);

  useKeyboard({
    ArrowLeft: goPrev,
    ArrowRight: goNext,
    ArrowUp: () => readingMode === 'horizontal' && goPrev(),
    ArrowDown: () => readingMode === 'horizontal' && goNext(),
  });

  // Auto-hide UI on mouse idle in horizontal mode
  function resetUiTimer() {
    setUiVisible(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setUiVisible(false), 3000);
  }

  useEffect(() => {
    if (readingMode === 'horizontal') {
      resetUiTimer();
      return () => clearTimeout(uiTimer.current);
    } else {
      setUiVisible(true);
      clearTimeout(uiTimer.current);
    }
  }, [readingMode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-4">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-4 px-4 text-center">
        <p className="text-red-400">{error}</p>
        <Link to={`/manga/${mangaId}`} className="btn-secondary no-underline">
          Back to Manga
        </Link>
      </div>
    );
  }

  const progressPct = pages.length > 1 ? ((currentPage + 1) / pages.length) * 100 : 100;

  return (
    <div
      className="min-h-screen bg-gray-950 relative"
      onMouseMove={readingMode === 'horizontal' ? resetUiTimer : undefined}
    >
      {/* Top bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 h-12 flex items-center gap-3 transition-opacity duration-300 ${
          uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Link to={`/manga/${mangaId}`} className="text-gray-400 hover:text-white transition-colors no-underline shrink-0" title="Back">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="flex-1 min-w-0 text-sm text-gray-300 truncate">
          {currentChapterInfo
            ? `Ch.${currentChapterInfo.chapter ?? '?'}${currentChapterInfo.title ? ` — ${currentChapterInfo.title}` : ''}`
            : 'Reading'}
        </div>

        {/* Reading mode toggle */}
        <div className="flex bg-gray-800 rounded-lg p-0.5 shrink-0">
          {(['vertical', 'horizontal']).map((mode) => (
            <button
              key={mode}
              onClick={() => setReadingMode(mode)}
              title={mode === 'vertical' ? 'Long strip' : 'Single page'}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors border-0 cursor-pointer ${
                readingMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'vertical' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {readingMode === 'horizontal' && (
        <div className="fixed top-12 left-0 right-0 h-0.5 bg-gray-800 z-40">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* ── Vertical (webtoon) mode ── */}
      {readingMode === 'vertical' && (
        <div className="pt-12">
          <div className="max-w-2xl mx-auto">
            {pages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Page ${i + 1}`}
                className="w-full block"
                loading={i < 3 ? 'eager' : 'lazy'}
              />
            ))}
          </div>

          {/* Chapter nav at bottom */}
          <div className="flex justify-center gap-4 py-10">
            {prevChapter ? (
              <Link
                to={`/read/${mangaId}/${prevChapter.id}`}
                className="btn-secondary no-underline"
              >
                ← Ch.{prevChapter.chapter ?? '?'}
              </Link>
            ) : null}
            <Link to={`/manga/${mangaId}`} className="btn-secondary no-underline">
              Chapter List
            </Link>
            {nextChapter ? (
              <Link
                to={`/read/${mangaId}/${nextChapter.id}`}
                className="btn-secondary no-underline"
              >
                Ch.{nextChapter.chapter ?? '?'} →
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Horizontal (single page) mode ── */}
      {readingMode === 'horizontal' && (
        <div
          ref={containerRef}
          className="fixed inset-0 pt-12 flex items-center justify-center bg-black"
          onClick={(e) => {
            // Click left half = prev, right half = next
            const x = e.clientX / window.innerWidth;
            if (x < 0.4) goPrev();
            else if (x > 0.6) goNext();
          }}
        >
          {pages[currentPage] && (
            <div className="relative max-w-full max-h-full">
              {!imgLoaded[currentPage] && <Spinner className="absolute inset-0 m-auto" />}
              <img
                key={pages[currentPage]}
                src={pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full max-h-screen object-contain select-none"
                onLoad={() => setImgLoaded((prev) => ({ ...prev, [currentPage]: true }))}
                draggable={false}
              />
            </div>
          )}

          {/* Side navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={currentPage === 0 && !prevChapter}
            className={`fixed left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 rounded-full transition-all border-0 cursor-pointer ${
              uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } disabled:opacity-20`}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={currentPage === pages.length - 1 && !nextChapter}
            className={`fixed right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 rounded-full transition-all border-0 cursor-pointer ${
              uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } disabled:opacity-20`}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Page counter */}
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full transition-opacity duration-300 ${
              uiVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentPage + 1} / {pages.length}
          </div>
        </div>
      )}
    </div>
  );
}
