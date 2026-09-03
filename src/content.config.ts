import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pageCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/page' }),
  schema: z.object({
    title: z.string(),
    source: z.string().optional(),
  }),
});

export const collections = {
  page: pageCollection,
};
