import { Link } from 'react-router-dom';
import { getCoverImageUrl } from '../api/mangadex';

const STATUS_COLORS = {
  ongoing: 'bg-green-600',
  completed: 'bg-blue-600',
  hiatus: 'bg-yellow-600',
  cancelled: 'bg-red-600',
};

export default function MangaCard({ manga }) {
  const coverUrl = getCoverImageUrl(manga.id, manga.coverFilename, 256);

  return (
    <Link to={`/manga/${manga.id}`} className="card group block no-underline">
      <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Status badge */}
        {manga.status && (
          <span className={`absolute top-2 left-2 text-xs font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[manga.status] ?? 'bg-gray-600'} text-white capitalize`}>
            {manga.status}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1">
          {manga.title}
        </h3>

        {manga.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
