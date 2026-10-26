/** Where in the admin each top-level area of the site document is edited. */
export const AREA_LINKS: Record<string, { href: string; label: string }> = {
  profile: { href: "/admin/content?tab=profile", label: "Profile" },
  socials: { href: "/admin/content?tab=socials", label: "Socials" },
  skills: { href: "/admin/content?tab=skills", label: "Skills" },
  quests: { href: "/admin/content?tab=quests", label: "Quests" },
  journey: { href: "/admin/content?tab=journey", label: "Journey" },
  lab: { href: "/admin/content?tab=lab", label: "Lab" },
  copy: { href: "/admin/content?tab=labels", label: "Labels" },
  sections: { href: "/admin/sections", label: "Sections" },
  design: { href: "/admin/design", label: "Design" },
  effects: { href: "/admin/effects", label: "Effects" },
  game: { href: "/admin/game", label: "Game" },
  seo: { href: "/admin/seo", label: "SEO" },
  advanced: { href: "/admin/advanced", label: "Advanced" },
};
