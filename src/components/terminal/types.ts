import type { Site } from "@/schema/site";

/** Everything the terminal needs, pre-digested on the server (small, serialisable). */
export type TerminalData = {
  cfg: Site["terminal"];
  closeLabel: string;
  name: string;
  role: string;
  about: string[];
  cvUrl: string | null;
  email: string | null;
  jokes: string[];
  socials: { label: string; url: string }[];
  skills: { name: string; status: "mastered" | "learning" | "locked" }[];
  works: { id: string; title: string }[];
};
