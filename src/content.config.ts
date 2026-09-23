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

/**
 * Portfolio projects. `featured` entries get the long treatment and appear on
 * the home page; `more` entries are shorter and only listed on /projects/.
 * Attribution fields are required on purpose: every entry has to say who the
 * work was for and in what capacity, so nothing reads as more than it was.
 */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tier: z.enum(["featured", "more"]),
      order: z.number().default(0),
      kind: z.string(),
      client: z.string(),
      engagement: z.string(),
      role: z.string(),
      period: z.string(),
      status: z.string(),
      stack: z.array(z.string()),
      links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
      related: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
    }),
});

export const collections = { blog, work, projects };
