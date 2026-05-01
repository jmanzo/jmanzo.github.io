// Migrates WordPress posts from jeanmanzo.com into the local blog content
// collection as markdown files. Inline images hosted on the WP site are
// downloaded into src/assets/blog/<slug>/ and the markdown is rewritten to
// reference the local copies via relative paths so Astro's image pipeline
// can optimize them at build time.
//
// The script is idempotent: re-running overwrites previously migrated
// markdown files and skips images that already exist on disk.
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";

const WP_API = "https://jeanmanzo.com/wp-json/wp/v2/posts";
const PER_PAGE = 50;
const IMAGE_HOST = "jeanmanzo.com";
// Astro's image service understands these formats; svg passes through.
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
// WordPress generates resized variants suffixed with -WIDTHxHEIGHT (e.g.
// foo-1024x540.png). Stripping the suffix yields the original full-size file.
const SIZED_VARIANT_RE = /-\d+x\d+(?=\.[a-zA-Z]+$)/;

// Categories whose posts should be tagged as "case study" so the work index
// can pull them in. From the WP install:
//   15 = "My Work"
const CATEGORY_MY_WORK = 15;
const CATEGORY_NAMES = {
  5: "ai",
  6: "shopify",
  7: "cro",
  15: "case-study",
  20: "ecommerce",
  30: "journal",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, "..", "src", "content", "blog");
const ASSETS_DIR = join(__dirname, "..", "src", "assets", "blog");

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

// WP outputs many empty wrapper figures/divs; strip them to keep markdown clean.
turndown.addRule("strip-empty-figures", {
  filter: (node) =>
    (node.nodeName === "FIGURE" || node.nodeName === "DIV") &&
    node.textContent.trim() === "" &&
    node.querySelector("img") === null,
  replacement: () => "",
});

turndown.addRule("preserve-pre", {
  filter: "pre",
  replacement: (_content, node) => {
    const text = node.textContent.replace(/\u00a0/g, " ").trimEnd();
    return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
  },
});

function decodeHtml(str) {
  return str
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function htmlToMarkdown(html) {
  const md = turndown.turndown(html);
  return md
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildExcerpt(html) {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const decoded = decodeHtml(text).replace(/\[\u2026\]\s*$/, "").trim();
  if (decoded.length <= 200) return decoded;
  return decoded.slice(0, 197).trimEnd() + "\u2026";
}

function yamlEscape(value) {
  if (value.includes('"') || value.includes("\\")) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `"${value}"`;
}

function buildFrontmatter({ title, description, pubDate, updatedDate, tags }) {
  const lines = [
    "---",
    `title: ${yamlEscape(title)}`,
    `description: ${yamlEscape(description)}`,
    `pubDate: ${pubDate}`,
  ];
  if (updatedDate && updatedDate !== pubDate) {
    lines.push(`updatedDate: ${updatedDate}`);
  }
  if (tags.length > 0) {
    lines.push(`tags: [${tags.map(yamlEscape).join(", ")}]`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function isLocalAsset(url) {
  try {
    const parsed = new URL(url);
    return parsed.host === IMAGE_HOST && IMAGE_EXT_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

function originalAssetUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  parsed.pathname = parsed.pathname.replace(SIZED_VARIANT_RE, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function localFilenameFor(url) {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "asset";
  return decodeURIComponent(last);
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadAsset(url, dest) {
  if (await fileExists(dest)) return "cached";
  const response = await fetch(url);
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  return "downloaded";
}

// Rewrites every markdown image whose URL points at the WP site to a local
// copy under src/assets/blog/<slug>/. Returns the rewritten markdown.
async function downloadAndRewriteImages(slug, markdown) {
  // Captures the alt, the URL, and an optional title (e.g. ![alt](url "title")).
  const imageRe = /!\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;
  const cache = new Map();
  const slugDir = join(ASSETS_DIR, slug);
  let result = "";
  let lastIndex = 0;

  for (const match of markdown.matchAll(imageRe)) {
    const [full, alt, rawUrl, title] = match;
    if (!isLocalAsset(rawUrl)) continue;

    const original = originalAssetUrl(rawUrl);
    let relPath = cache.get(original);

    if (!relPath) {
      const filename = localFilenameFor(original);
      const dest = join(slugDir, filename);
      const status = await downloadAsset(original, dest);
      if (!status) {
        console.warn(`  ! Could not download ${original}`);
        continue;
      }
      // Posts live at src/content/blog/<slug>.md, so two levels up reaches src/.
      relPath = `../../assets/blog/${slug}/${filename}`;
      cache.set(original, relPath);
      if (status === "downloaded") console.log(`  + ${slug}/${filename}`);
    }

    result += markdown.slice(lastIndex, match.index);
    result += `![${alt}](${relPath}${title})`;
    lastIndex = match.index + full.length;
  }

  result += markdown.slice(lastIndex);
  return result;
}

async function fetchPosts() {
  const url = `${WP_API}?per_page=${PER_PAGE}&_fields=id,date,modified,slug,title,content,excerpt,categories`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WP API request failed: ${response.status}`);
  }
  return response.json();
}

async function main() {
  await mkdir(BLOG_DIR, { recursive: true });

  const posts = await fetchPosts();
  console.log(`Fetched ${posts.length} posts from ${WP_API}`);

  for (const post of posts) {
    const title = decodeHtml(post.title.rendered).replace(/\s+/g, " ").trim();
    const description = buildExcerpt(post.excerpt.rendered);
    const pubDate = post.date.split("T")[0];
    const updatedDate = post.modified ? post.modified.split("T")[0] : undefined;
    const tags = (post.categories ?? [])
      .map((id) => CATEGORY_NAMES[id])
      .filter(Boolean);

    if (post.categories?.includes(CATEGORY_MY_WORK) && !tags.includes("case-study")) {
      tags.push("case-study");
    }

    const frontmatter = buildFrontmatter({
      title,
      description,
      pubDate,
      updatedDate,
      tags,
    });

    const rawBody = htmlToMarkdown(post.content.rendered);
    const body = await downloadAndRewriteImages(post.slug, rawBody);
    const file = join(BLOG_DIR, `${post.slug}.md`);

    await writeFile(file, `${frontmatter}${body}\n`, "utf8");
    console.log(`Wrote ${post.slug}.md`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
