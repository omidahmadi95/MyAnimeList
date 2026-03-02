import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMangaById, fetchChapters, getCoverImageUrl } from '../api/mangadex';
import Spinner from '../components/Spinner';

const STATUS_COLORS = {
  ongoing: 'text-green-400',
  completed: 'text-blue-400',
  hiatus: 'text-yellow-400',
  cancelled: 'text-red-400',
};

function groupChaptersByVolume(chapters) {
  const volumes = {};
  for (const ch of chapters) {
    const vol = ch.volume ?? 'No Volume';
    if (!volumes[vol]) volumes[vol] = [];
    volumes[vol].push(ch);
  }
  return volumes;
}

export default function MangaDetail() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [chapterOffset, setChapterOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const CHAPTER_PAGE = 100;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [mangaData, chaptersData] = await Promise.all([
          fetchMangaById(id),
          fetchChapters(id, CHAPTER_PAGE, 0),
        ]);
        if (!cancelled) {
          setManga(mangaData);
          setChapters(chaptersData.items);
          setTotalChapters(chaptersData.total);
          setChapterOffset(0);
        }
      } catch {
        if (!cancelled) setError('Failed to load manga details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function loadMoreChapters(newOffset) {
    setChapterLoading(true);
    try {
      const data = await fetchChapters(id, CHAPTER_PAGE, newOffset);
      setChapters((prev) =>
        newOffset === 0 ? data.items : [...prev, ...data.items]
      );
      setChapterOffset(newOffset);
    } finally {
      setChapterLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400 mb-4">{error ?? 'Manga not found.'}</p>
        <Link to="/" className="btn-primary no-underline">Back to Browse</Link>
      </div>
    );
  }

  const coverUrl = getCoverImageUrl(manga.id, manga.coverFilename, 512);
  const description = manga.description;
  const isLong = description.length > 400;

  const firstChapter = chapters[0];
  const grouped = groupChaptersByVolume(chapters);
  const volumeKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'No Volume') return 1;
    if (b === 'No Volume') return -1;
    return parseFloat(a) - parseFloat(b);
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Cover */}
        <div className="shrink-0 w-36 sm:w-48">
          <div className="rounded-xl overflow-hidden bg-gray-800 aspect-[2/3]">
            {coverUrl ? (
              <img src={coverUrl} alt={manga.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📚</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{manga.title}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
            {manga.status && (
              <span className={`capitalize font-medium ${STATUS_COLORS[manga.status] ?? 'text-gray-400'}`}>
                {manga.status}
              </span>
            )}
            {manga.year && <span className="text-gray-400">{manga.year}</span>}
            {manga.authors.length > 0 && (
              <span className="text-gray-400">by {manga.authors.join(', ')}</span>
            )}
          </div>

          {/* Tags */}
          {manga.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {manga.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-blue-300 px-2 py-0.5 rounded-full border border-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="text-sm text-gray-300 leading-relaxed">
              <p className={!expanded && isLong ? 'line-clamp-4' : ''}>
                {description}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-blue-400 hover:text-blue-300 mt-1 text-xs border-0 bg-transparent cursor-pointer p-0"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* CTA */}
          {firstChapter && (
            <div className="mt-5 flex gap-3">
              <Link
                to={`/read/${id}/${firstChapter.id}`}
                className="btn-primary no-underline text-sm"
              >
                Start Reading
              </Link>
              <span className="text-sm text-gray-400 self-center">
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Chapters
        </h2>

        {chapters.length === 0 ? (
          <p className="text-gray-400 text-sm">No English chapters available.</p>
        ) : (
          <div className="space-y-4">
            {volumeKeys.map((vol) => (
              <div key={vol}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {vol === 'No Volume' ? 'Chapters' : `Volume ${vol}`}
                </h3>
                <div className="divide-y divide-gray-800 rounded-lg overflow-hidden border border-gray-800">
                  {grouped[vol].map((ch) => (
                    <Link
                      key={ch.id}
                      to={`/read/${id}/${ch.id}`}
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-900 hover:bg-gray-800 transition-colors no-underline group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-medium text-blue-400 shrink-0">
                          Ch.{ch.chapter ?? '?'}
                        </span>
                        {ch.title && (
                          <span className="text-sm text-gray-300 truncate">{ch.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {ch.group && (
                          <span className="text-xs text-gray-500 hidden sm:block truncate max-w-32">
                            {ch.group}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{ch.pages}p</span>
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more chapters */}
        {chapters.length < totalChapters && (
          <div className="mt-4 text-center">
            <button
              onClick={() => loadMoreChapters(chapterOffset + CHAPTER_PAGE)}
              disabled={chapterLoading}
              className="btn-secondary"
            >
              {chapterLoading ? 'Loading...' : `Load more (${totalChapters - chapters.length} remaining)`}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
