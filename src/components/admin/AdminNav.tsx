"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "◎" },
  { href: "/admin/content", label: "Content", icon: "✎" },
  { href: "/admin/design", label: "Design", icon: "◐" },
  { href: "/admin/effects", label: "Effects", icon: "✦" },
  { href: "/admin/terminal", label: "Terminal", icon: ">_" },
  { href: "/admin/media", label: "Media", icon: "▣" },
  { href: "/admin/inbox", label: "Inbox", icon: "✉" },
  { href: "/admin/seo", label: "SEO & sharing", icon: "⌕" },
  { href: "/admin/history", label: "History", icon: "↺" },
  { href: "/admin/advanced", label: "Advanced", icon: "⚙" },
  { href: "/admin/account", label: "Account", icon: "☺" },
];

export function AdminNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ADMIN_LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className="a-nav-link shrink-0" aria-current={active ? "page" : undefined}>
            <span aria-hidden className="w-4 text-center">{l.icon}</span>
            {l.label}
            {l.href === "/admin/inbox" && unread > 0 && (
              <span className="ml-auto rounded-full bg-cyan px-1.5 text-[0.65rem] font-bold text-[#04121a]">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
