import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

const covers = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/books/*/cover.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

export interface Book {
  title: string;
  subtitle: string;
  cover?: ImageMetadata;
  href: string;
}

// Glob keys are root-relative and entry.filePath is repo-relative, so compare
// the folder each one sits in below content/books/.
function bookFolder(path: string) {
  const marker = 'content/books/';
  const at = path.indexOf(marker);
  if (at === -1) return undefined;
  const rest = path.slice(at + marker.length);
  const cut = rest.lastIndexOf('/');
  return cut === -1 ? undefined : rest.slice(0, cut);
}

const coversByFolder = new Map(
  Object.entries(covers).map(([path, mod]) => [bookFolder(path), mod.default]),
);

function firstHeading(body: string) {
  return body.match(/^#\s+(.+?)\s*$/m)?.[1];
}

function firstParagraph(body: string, exclude: string) {
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('```') || line.startsWith('~~~')) continue;
    if (line === exclude) continue;
    return line;
  }
  return '';
}

export async function getBooks(): Promise<Book[]> {
  const entries = await getCollection('books');

  return [...entries]
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .map((entry) => {
      const stem = (entry.filePath?.split('/').pop() ?? '').replace(/\.md$/, '');
      const body = entry.body ?? '';
      const title =
        entry.data.title ?? (stem && stem !== 'index' ? stem : (firstHeading(body) ?? entry.id));
      const folder = entry.filePath && bookFolder(entry.filePath);

      return {
        title,
        subtitle: entry.data.subtitle ?? firstParagraph(body, title),
        cover: folder ? coversByFolder.get(folder) : undefined,
        href: entry.data.href,
      };
    });
}
