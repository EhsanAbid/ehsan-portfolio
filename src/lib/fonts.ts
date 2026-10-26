import {
  DM_Sans,
  Fira_Code,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Manrope,
  Nunito_Sans,
  Orbitron,
  Outfit,
  Sora,
  Space_Grotesk,
  Space_Mono,
  Syne,
} from "next/font/google";

/**
 * The curated free font list the admin can choose from (spec §6.1 Design).
 * next/font downloads them at build time and serves them from our own domain
 * (no Google request at runtime, no layout shift). Only the three defaults are
 * preloaded; the others are declared but a browser only downloads a font file
 * when a CSS rule actually uses it.
 */
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-space-grotesk", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--f-jetbrains", display: "swap" });

const sora = Sora({ subsets: ["latin"], variable: "--f-sora", display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--f-outfit", display: "swap", preload: false });
const syne = Syne({ subsets: ["latin"], variable: "--f-syne", display: "swap", preload: false });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--f-orbitron", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--f-manrope", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dm-sans", display: "swap", preload: false });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-plex-sans", display: "swap", preload: false });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--f-nunito", display: "swap", preload: false });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--f-fira-code", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--f-plex-mono", display: "swap", preload: false });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-space-mono", display: "swap", preload: false });

const all = [spaceGrotesk, inter, jetbrains, sora, outfit, syne, orbitron, manrope, dmSans, plexSans, nunito, firaCode, plexMono, spaceMono];

/** Class names that define every --f-* variable; put on <html>. */
export const fontVariables = all.map((f) => f.variable).join(" ");

/** Admin font name → CSS variable holding that font's family. */
export const FONT_VARS: Record<string, string> = {
  "Space Grotesk": "--f-space-grotesk",
  Sora: "--f-sora",
  Outfit: "--f-outfit",
  Syne: "--f-syne",
  Orbitron: "--f-orbitron",
  Inter: "--f-inter",
  Manrope: "--f-manrope",
  "DM Sans": "--f-dm-sans",
  "IBM Plex Sans": "--f-plex-sans",
  "Nunito Sans": "--f-nunito",
  "JetBrains Mono": "--f-jetbrains",
  "Fira Code": "--f-fira-code",
  "IBM Plex Mono": "--f-plex-mono",
  "Space Mono": "--f-space-mono",
};
