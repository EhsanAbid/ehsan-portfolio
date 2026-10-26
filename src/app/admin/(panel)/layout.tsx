import { Suspense } from "react";
import { loadAdmin, unreadCount } from "@/lib/adminData";
import { AdminProvider } from "@/components/admin/AdminContext";
import { AdminNav } from "@/components/admin/AdminNav";
import { PublishBar } from "@/components/admin/PublishBar";
import { logoutAction } from "../actions";

/*
 * Admin pages read the session cookie, so they can't be prerendered. With Cache Components
 * that request-time work must sit inside <Suspense>; the fallback is the static shell.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading Mission Control…</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const [{ admin, changes }, unread] = await Promise.all([loadAdmin(), unreadCount()]);
  return (
    <AdminProvider initialChanges={changes}>
      <div className="md:grid md:min-h-screen md:grid-cols-[220px_1fr]">
        <aside className="border-b border-white/10 p-3 md:sticky md:top-0 md:h-screen md:border-r md:border-b-0 md:p-4">
          <div className="mb-3 flex items-center justify-between md:mb-6 md:block">
            <a href="/" target="_blank" rel="noopener" className="block">
              <p className="mono text-xs text-cyan">ehsan.exe</p>
              <p className="font-heading text-lg font-bold text-white">Mission Control</p>
            </a>
          </div>
          <AdminNav unread={unread} />
          <form action={logoutAction} className="mt-4 hidden md:block">
            <p className="mb-2 truncate text-xs text-muted">{admin.email}</p>
            <button className="a-btn w-full">Sign out</button>
          </form>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex flex-wrap items-center justify-end gap-2 border-b border-white/10 bg-[#070914]/90 px-4 py-2.5 backdrop-blur">
            <PublishBar />
          </header>
          <main className="mx-auto max-w-5xl p-4 md:p-8">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
