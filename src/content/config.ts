import { defineCollection, z } from 'astro:content';

const personalProjectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    technologies: z.array(z.string()),
    repoLink: z.string().url().optional(),
    liveLink: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

// New collection for studies
const studiesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    category: z.string(), // For grouping into folders
    tags: z.array(z.string()).optional(),
  }),
});

// Example for another collection like paper reviews
const paperReviewsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    technologies: z.array(z.string()),
    repoLink: z.string().url().optional(),
    liveLink: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

export const collections = {
  'personal-projects': personalProjectsCollection,
  studies: studiesCollection,
  'paper-reviews': paperReviewsCollection,
};
