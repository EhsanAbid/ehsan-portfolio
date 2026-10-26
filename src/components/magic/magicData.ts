import type { Site } from "@/schema/site";
import { richToText } from "@/schema/rich";
import { filled } from "@/lib/todo";
import { mediaUrl } from "@/lib/mediaUrl";
import { sectionAnchor } from "@/sections/shared";
import type { MagicProps } from "./Magic";

/** Server side: reduce the site document to what the magic layer needs (keeps the payload small). */
export function magicProps(site: Site): MagicProps {
  const p = site.profile;
  const contact = site.sections.find((s) => s.enabled && s.type === "contact");
  const funFacts = p.funFacts.filter(filled);
  return {
    achievements: site.game.achievements.filter((a) => a.enabled),
    toastTitle: site.game.achievementsUi.toastTitle,
    effects: { cursor: site.effects.cursor, shootingStars: site.effects.shootingStars, konami: site.effects.konami, sound: site.effects.sound },
    cursorStyle: site.design.cursorStyle,
    shootingStarLabel: site.copy.nav.shootingStar,
    funFact: funFacts[0] ?? null,
    terminal: {
      cfg: site.game.terminal,
      closeLabel: site.copy.nav.closeTerminal,
      hiddenName: site.game.achievementsUi.hiddenName,
      hiddenHint: site.game.achievementsUi.hiddenDescription,
      name: p.shortName,
      role: p.role,
      about: [richToText(p.bio), p.funLine].filter(filled),
      cvUrl: p.cv.key ? mediaUrl(p.cv) : null,
      email: filled(p.publicEmail) ? p.publicEmail : null,
      jokes: p.jokes.filter(filled),
      socials: site.socials.filter((s) => filled(s.url)).map((s) => ({ label: s.label, url: s.url })),
      skills: site.skills.items.map((s) => ({ name: s.name, status: s.status })),
      quests: site.quests.filter((q) => filled(q.title)).map((q) => ({ id: q.id, title: q.title, status: q.status })),
      achievements: site.game.achievements.filter((a) => a.enabled).map((a) => ({ id: a.id, name: a.name, icon: a.icon, description: a.description })),
      themes: site.effects.sky.themes.map((t) => ({ id: t.id, name: t.name })),
      contactAnchor: contact ? sectionAnchor(contact) : null,
    },
  };
}
