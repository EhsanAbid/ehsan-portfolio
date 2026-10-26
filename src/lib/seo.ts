import type { Metadata } from "next";
import type { Site } from "@/schema/site";
import { mediaUrl } from "./mediaUrl";
import { filled } from "./todo";
import { richToText } from "@/schema/rich";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function siteMetadata(site: Site): Metadata {
  const s = site.seo;
  const og = s.ogImage.key ? mediaUrl(s.ogImage) : "/og";
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: "/" },
    robots: s.indexing ? { index: true, follow: true } : { index: false, follow: false },
    icons: s.favicon.key ? { icon: mediaUrl(s.favicon) } : undefined,
    openGraph: {
      type: "profile",
      title: s.title,
      description: s.description,
      url: "/",
      siteName: site.profile.name,
      images: [{ url: og, width: 1200, height: 630, alt: s.title }],
    },
    twitter: { card: "summary_large_image", title: s.title, description: s.description, images: [og] },
  };
}

/** JSON-LD "Person" so search engines understand who the site is about. */
export function personJsonLd(site: Site) {
  const p = site.profile;
  const sameAs = site.socials.filter((x) => filled(x.url) && /^https?:/.test(x.url)).map((x) => x.url);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: siteUrl(),
    jobTitle: site.seo.jobTitle,
    description: filled(richToText(p.bio)) ? richToText(p.bio).slice(0, 300) : site.seo.description,
    alumniOf: { "@type": "CollegeOrUniversity", name: p.university },
    ...(p.photo.key ? { image: siteUrl() + mediaUrl(p.photo) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
