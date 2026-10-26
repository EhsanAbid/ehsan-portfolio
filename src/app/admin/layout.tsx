import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Mission Control · ehsan.exe",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin">{children}</div>;
}
