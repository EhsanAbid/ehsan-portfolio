import type { Site } from "./site";

type Colors = Site["design"]["colors"];

/** Theme presets offered in Admin → Design. Applying one copies its colours into the draft. */
export const DESIGN_PRESETS: Record<"cyanotype" | "ink" | "paper" | "midnight" | "forest", { label: string; colors: Colors }> = {
  cyanotype: {
    label: "Cyanotype",
    colors: { bg: "#12309A", text: "#F5F7FC", muted: "#C3CEF0", accent: "#FFD166", panel: "#EEF2F9", panelText: "#0C1C5E", lines: "#FFFFFF" },
  },
  ink: {
    label: "Ink",
    colors: { bg: "#0A0A0A", text: "#F2F2F0", muted: "#A3A3A0", accent: "#9DB8FF", panel: "#171717", panelText: "#F2F2F0", lines: "#FFFFFF" },
  },
  paper: {
    label: "Paper",
    colors: { bg: "#EFEDE7", text: "#141414", muted: "#5C5B57", accent: "#2747D9", panel: "#FFFFFF", panelText: "#141414", lines: "#141414" },
  },
  midnight: {
    label: "Midnight blue",
    colors: { bg: "#070B1A", text: "#EEF1FF", muted: "#9AA3C7", accent: "#7FA2FF", panel: "#101733", panelText: "#EEF1FF", lines: "#C9D4FF" },
  },
  forest: {
    label: "Forest",
    colors: { bg: "#08110D", text: "#EDF5EF", muted: "#97ADA0", accent: "#7CE0A9", panel: "#0F1F18", panelText: "#EDF5EF", lines: "#D6F2E1" },
  },
};
