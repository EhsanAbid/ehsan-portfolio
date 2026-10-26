import type { Site } from "@/schema/site";

/** Everything the terminal needs, pre-digested on the server (small, serialisable). */
export type TerminalData = {
  cfg: Site["game"]["terminal"];
  closeLabel: string;
  hiddenName: string;
  hiddenHint: string;
  name: string;
  role: string;
  about: string[];
  cvUrl: string | null;
  email: string | null;
  jokes: string[];
  socials: { label: string; url: string }[];
  skills: { name: string; status: "mastered" | "learning" | "locked" }[];
  quests: { id: string; title: string; status: string }[];
  achievements: { id: string; name: string; icon: string; description: string }[];
  themes: { id: string; name: string }[];
  contactAnchor: string | null;
};
