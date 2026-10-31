import type { Site } from "@/schema/site";
import { richToText } from "@/schema/rich";
import { filled } from "@/lib/todo";
import { mediaUrl } from "@/lib/mediaUrl";
import type { TerminalData } from "./types";

/** Server side: reduce the site document to what the hidden terminal needs. */
export function terminalData(site: Site): TerminalData {
  const p = site.profile;
  return {
    cfg: site.terminal,
    closeLabel: site.copy.a11y.closeTerminal,
    name: p.shortName,
    role: p.currently,
    about: [richToText(p.bio), ...p.funFacts].filter(filled),
    cvUrl: p.cv.key ? mediaUrl(p.cv) : null,
    email: filled(p.publicEmail) ? p.publicEmail : null,
    jokes: p.jokes.filter(filled),
    socials: site.socials.filter((s) => filled(s.url)).map((s) => ({ label: s.label, url: s.url })),
    skills: site.skills.items.map((s) => ({ name: s.name, status: s.status })),
    works: site.works.filter((w) => filled(w.title)).map((w) => ({ id: w.id, title: w.title })),
  };
}
