import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const books = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    href: z.string().default('#'),
    order: z.number().default(0),
  }),
});

export const collections = { books };
