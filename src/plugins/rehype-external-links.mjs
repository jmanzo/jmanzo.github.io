/**
 * Opens every off-site link in Markdown/MDX content in a new tab.
 * Internal links (relative paths, anchors, and absolute URLs on `siteHost`)
 * are left alone. Links in .astro components set target/rel themselves.
 */
export default function rehypeExternalLinks({ siteHost }) {
  const isExternal = (href) => {
    if (!/^https?:\/\//i.test(href)) return false;
    try {
      const host = new URL(href).hostname.replace(/^www\./, "");
      return host !== siteHost;
    } catch {
      return false;
    }
  };

  const walk = (node) => {
    if (
      node.type === "element" &&
      node.tagName === "a" &&
      typeof node.properties?.href === "string" &&
      isExternal(node.properties.href)
    ) {
      node.properties.target = "_blank";
      node.properties.rel = ["noopener", "noreferrer"];
    }
    node.children?.forEach(walk);
  };

  return (tree) => walk(tree);
}
