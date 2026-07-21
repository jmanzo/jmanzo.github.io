import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional().default(false),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
    }),
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    role: z.string().optional(),
    year: z.string(),
    url: z.string().optional(),
    stack: z.array(z.string()).optional(),
    order: z.number().optional().default(0),
  }),
});

export const collections = { blog, work };
