import type { Site } from "./site";

type Colors = Site["design"]["colors"];

/** Theme presets offered in Admin → Design. Applying one copies its colours into the draft. */
export const DESIGN_PRESETS: Record<"deep-space" | "nebula" | "aurora" | "midnight-gold", { label: string; colors: Colors }> = {
  "deep-space": {
    label: "Deep Space",
    colors: { bgDeep: "#05060F", panel: "#FFFFFF", cyan: "#22D3EE", violet: "#8B5CF6", pink: "#F472B6", gold: "#FBBF24", text: "#E5E7EB", muted: "#94A3B8" },
  },
  nebula: {
    label: "Nebula",
    colors: { bgDeep: "#0B0614", panel: "#F5D0FE", cyan: "#F0ABFC", violet: "#A855F7", pink: "#FB7185", gold: "#FDE68A", text: "#F5F3FF", muted: "#C4B5FD" },
  },
  aurora: {
    label: "Aurora",
    colors: { bgDeep: "#03100F", panel: "#CCFBF1", cyan: "#2DD4BF", violet: "#34D399", pink: "#A3E635", gold: "#FACC15", text: "#ECFDF5", muted: "#99C2B8" },
  },
  "midnight-gold": {
    label: "Midnight Gold",
    colors: { bgDeep: "#07080D", panel: "#FDE68A", cyan: "#FBBF24", violet: "#FB923C", pink: "#F59E0B", gold: "#FDE047", text: "#FAFAF9", muted: "#A8A29E" },
  },
};
