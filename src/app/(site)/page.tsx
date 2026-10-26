import type { Metadata } from "next";
import { getPublishedSite } from "@/lib/site";
import { SitePage } from "@/components/site/SitePage";
import { siteMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublishedSite();
  return site ? siteMetadata(site) : { title: "ehsan.exe" };
}

export default async function Home() {
  const site = await getPublishedSite();
  if (!site) {
    // Only happens before the first `npm run db:seed`.
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center font-mono">
        <p>
          &gt; no published universe found. run <code>npm run db:seed</code>
        </p>
      </main>
    );
  }
  return <SitePage site={site} />;
}
