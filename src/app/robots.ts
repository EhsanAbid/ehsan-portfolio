import type { MetadataRoute } from "next";
import { getPublishedSite } from "@/lib/site";
import { siteUrl } from "@/lib/seo";

/** robots.txt — follows Admin → SEO "Allow search engines"; admin and APIs are never crawled. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getPublishedSite();
  const allow = site?.seo.indexing ?? true;
  return {
    rules: allow ? { userAgent: "*", allow: "/", disallow: ["/admin", "/preview", "/api/"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
