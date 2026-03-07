import axios from 'axios';

const BASE_URL = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org/covers';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Extract cover filename from manga relationships
function getCoverFilename(manga) {
  const coverRel = manga.relationships?.find((r) => r.type === 'cover_art');
  return coverRel?.attributes?.fileName ?? null;
}

// Build cover image URL
export function getCoverImageUrl(mangaId, filename, size = 256) {
  if (!filename) return null;
  return `${COVER_URL}/${mangaId}/${filename}.${size}.jpg`;
}

// Get localized title (prefer English, fallback to first available)
export function getTitle(attributes) {
  return (
    attributes.title?.en ||
    Object.values(attributes.title ?? {})[0] ||
    attributes.altTitles?.find((t) => t.en)?.en ||
    'Untitled'
  );
}

// Get English description
export function getDescription(attributes) {
  return attributes.description?.en || Object.values(attributes.description ?? {})[0] || '';
}

// Fetch popular / recently updated manga for the home page
export async function fetchPopularManga(limit = 20, offset = 0) {
  const { data } = await api.get('/manga', {
    params: {
      limit,
      offset,
      'order[followedCount]': 'desc',
      'includes[]': ['cover_art'],
      availableTranslatedLanguage: ['en'],
      contentRating: ['safe', 'suggestive'],
    },
  });

  return {
    items: data.data.map((m) => ({
      id: m.id,
      title: getTitle(m.attributes),
      description: getDescription(m.attributes),
      coverFilename: getCoverFilename(m),
      status: m.attributes.status,
      year: m.attributes.year,
      tags: m.attributes.tags?.map((t) => t.attributes.name.en).filter(Boolean).slice(0, 4) ?? [],
    })),
    total: data.total,
  };
}

// Search manga by title
export async function searchManga(query, limit = 20, offset = 0) {
  const { data } = await api.get('/manga', {
    params: {
      title: query,
      limit,
      offset,
      'includes[]': ['cover_art'],
      availableTranslatedLanguage: ['en'],
      contentRating: ['safe', 'suggestive'],
    },
  });

  return {
    items: data.data.map((m) => ({
      id: m.id,
      title: getTitle(m.attributes),
      description: getDescription(m.attributes),
      coverFilename: getCoverFilename(m),
      status: m.attributes.status,
      year: m.attributes.year,
      tags: m.attributes.tags?.map((t) => t.attributes.name.en).filter(Boolean).slice(0, 4) ?? [],
    })),
    total: data.total,
  };
}

// Fetch manga details by ID
export async function fetchMangaById(id) {
  const { data } = await api.get(`/manga/${id}`, {
    params: { 'includes[]': ['cover_art', 'author', 'artist'] },
  });

  const m = data.data;
  const authors = m.relationships
    ?.filter((r) => r.type === 'author' || r.type === 'artist')
    .map((r) => r.attributes?.name)
    .filter(Boolean) ?? [];

  return {
    id: m.id,
    title: getTitle(m.attributes),
    description: getDescription(m.attributes),
    coverFilename: getCoverFilename(m),
    status: m.attributes.status,
    year: m.attributes.year,
    tags: m.attributes.tags?.map((t) => t.attributes.name.en).filter(Boolean) ?? [],
    authors: [...new Set(authors)],
  };
}

// Fetch chapters for a manga (English only, aggregated)
export async function fetchChapters(mangaId, limit = 100, offset = 0) {
  const { data } = await api.get(`/manga/${mangaId}/feed`, {
    params: {
      limit,
      offset,
      'translatedLanguage[]': ['en'],
      'order[chapter]': 'asc',
      'order[volume]': 'asc',
      contentRating: ['safe', 'suggestive'],
      'includes[]': ['scanlation_group'],
    },
  });

  return {
    items: data.data
      .filter((c) => c.attributes.pages > 0)
      .map((c) => ({
        id: c.id,
        chapter: c.attributes.chapter,
        volume: c.attributes.volume,
        title: c.attributes.title,
        pages: c.attributes.pages,
        publishAt: c.attributes.publishAt,
        group:
          c.relationships?.find((r) => r.type === 'scanlation_group')?.attributes?.name ?? null,
      })),
    total: data.total,
  };
}

// Fetch page image URLs for a chapter
export async function fetchChapterPages(chapterId) {
  const { data } = await api.get(`/at-home/server/${chapterId}`);
  const { baseUrl, chapter } = data;
  const { hash, data: pages, dataSaver } = chapter;

  // Use data-saver quality to reduce load times
  return dataSaver.map((page) => `${baseUrl}/data-saver/${hash}/${page}`);
}
