import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export interface Note {
  title: string;
  excerpt: string;
  day: string;
  month: string;
  author: string;
  href: string;
}

const DEFAULT_AUTHOR = '@qianli';

// The notes carry no frontmatter, so the date comes from the file's creation
// time; an explicit `date:` still wins, which is what keeps the dates correct
// after a deploy — a fresh git checkout stamps every file with the checkout
// time, so CI would otherwise date every note the day it built.
function fileCreated(entry: CollectionEntry<'notes'>): Date | undefined {
  if (!entry.filePath) return undefined;
  try {
    const { birthtime } = statSync(resolve(process.cwd(), entry.filePath));
    return new Date(
      Date.UTC(birthtime.getFullYear(), birthtime.getMonth(), birthtime.getDate()),
    );
  } catch {
    return undefined;
  }
}

// Both sources normalise to UTC midnight of the intended calendar day: YAML
// reads `2026-05-27` as UTC midnight, and a birth time is a local instant, so
// the parts are read back in UTC either way.
function noteDate(date: Date | undefined) {
  if (!date) return { day: '', month: '' };
  return {
    day: String(date.getUTCDate()),
    month: `${date.getUTCMonth() + 1}月`,
  };
}

function firstHeading(body: string) {
  return body.match(/^#\s+(.+?)\s*$/m)?.[1];
}

// Enough of the note's opening prose to fill the 3-line excerpt.
function bodyPreview(body: string, exclude: string, minLength = 300) {
  const parts: string[] = [];
  let length = 0;
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('```') || line.startsWith('~~~')) continue;
    if (line === exclude) continue;
    parts.push(line);
    length += line.length;
    if (length >= minLength) break;
  }
  return parts.join(' ');
}

export function noteTitle(entry: CollectionEntry<'notes'>): string {
  const stem = (entry.filePath?.split('/').pop() ?? '').replace(/\.md$/, '');
  const body = entry.body ?? '';
  return entry.data.title ?? (stem && stem !== 'index' ? stem : (firstHeading(body) ?? entry.id));
}

export async function getNotes(): Promise<Note[]> {
  const entries = await getCollection('notes');

  return [...entries]
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .map((entry) => {
      const title = noteTitle(entry);
      const body = entry.body ?? '';

      return {
        title,
        excerpt: entry.data.description ?? bodyPreview(body, title),
        ...noteDate(entry.data.date ?? fileCreated(entry)),
        author: entry.data.author ?? DEFAULT_AUTHOR,
        href: `/notes/${entry.id}`,
      };
    });
}
