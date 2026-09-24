import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const books = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    order: z.number().default(0),
  }),
});

const tutorials = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/tutorials' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().default(0),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    author: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { books, tutorials, notes };
