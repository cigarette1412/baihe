import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    domain: z.enum(['physics', 'math', 'computing', 'philosophy', 'crosscutting']),
    topic: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    summary: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
