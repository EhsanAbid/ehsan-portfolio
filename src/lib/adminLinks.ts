/** Where in the admin each top-level area of the site document is edited. */
export const AREA_LINKS: Record<string, { href: string; label: string }> = {
  profile: { href: "/admin/content?tab=profile", label: "Profile" },
  works: { href: "/admin/content?tab=works", label: "Projects" },
  skills: { href: "/admin/content?tab=skills", label: "Skills" },
  journey: { href: "/admin/content?tab=journey", label: "Journey" },
  socials: { href: "/admin/content?tab=socials", label: "Links" },
  copy: { href: "/admin/content?tab=labels", label: "Labels" },
  design: { href: "/admin/design", label: "Design" },
  effects: { href: "/admin/effects", label: "Effects" },
  terminal: { href: "/admin/terminal", label: "Terminal" },
  seo: { href: "/admin/seo", label: "SEO" },
  advanced: { href: "/admin/advanced", label: "Advanced" },
};
