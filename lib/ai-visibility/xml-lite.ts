/**
 * Minimal XML helper for sitemap parsing without a heavy dependency.
 * Sufficient for counting url / sitemap elements and detecting root tags.
 */

export interface XmlLiteDoc {
  rootName: string | null;
  findAll: (tag: string) => string[];
}

export const XMLParser = {
  parse(xml: string): XmlLiteDoc | null {
    const withoutDecl = xml.replace(/<\?xml[\s\S]*?\?>/i, "").trim();
    if (!withoutDecl.startsWith("<")) return null;

    const rootMatch = withoutDecl.match(/^<([A-Za-z_][\w:.-]*)/);
    if (!rootMatch) return null;

    const rootName = rootMatch[1].includes(":")
      ? rootMatch[1].split(":")[1]
      : rootMatch[1];

    return {
      rootName,
      findAll(tag: string) {
        const local = tag.includes(":") ? tag.split(":")[1] : tag;
        const re = new RegExp(`<(?:[\\w-]+:)?${local}(\\s|>)`, "gi");
        const matches = withoutDecl.match(re);
        return matches ?? [];
      },
    };
  },
};
