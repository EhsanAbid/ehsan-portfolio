import type { MetadataRoute } from "next";
import { getPublishedSite } from "@/lib/site";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getPublishedSite();
  if (site && !site.seo.indexing) return [];
  return [{ url: `${siteUrl()}/`, changeFrequency: "monthly", priority: 1 }];
}
