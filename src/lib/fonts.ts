import {
  Big_Shoulders,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  IBM_Plex_Sans,
  Instrument_Serif,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  Manrope,
  Newsreader,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

/**
 * The curated free font list the admin can choose from (Admin → Design).
 * next/font downloads them at build time and serves them from our own domain
 * (no Google request at runtime, no layout shift). Only the two defaults are
 * preloaded; the others are declared but a browser only downloads a font file
 * when a CSS rule actually uses it.
 */
const bigShoulders = Big_Shoulders({ subsets: ["latin"], variable: "--f-big-shoulders", display: "swap", adjustFontFallback: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-plex", display: "swap" });

const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-instrument", display: "swap", preload: false });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--f-inter-tight", display: "swap", preload: false });

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-playfair", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-fraunces", display: "swap", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-newsreader", display: "swap", preload: false });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-dm-serif", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--f-manrope", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dm-sans", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-space-grotesk", display: "swap", preload: false });
// The hidden terminal (and the admin's code fields) use a monospace face.
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--f-jetbrains", display: "swap", preload: false });

const all = [bigShoulders, plex, instrument, interTight, playfair, fraunces, newsreader, dmSerif, inter, manrope, dmSans, spaceGrotesk, jetbrains];

/** Class names that define every --f-* variable; put on <html>. */
export const fontVariables = all.map((f) => f.variable).join(" ");

/** Admin font name → CSS variable holding that font's family. */
export const FONT_VARS: Record<string, string> = {
  "Big Shoulders": "--f-big-shoulders",
  "IBM Plex Sans": "--f-plex",
  "Instrument Serif": "--f-instrument",
  "Playfair Display": "--f-playfair",
  Fraunces: "--f-fraunces",
  Newsreader: "--f-newsreader",
  "DM Serif Display": "--f-dm-serif",
  "Inter Tight": "--f-inter-tight",
  Inter: "--f-inter",
  Manrope: "--f-manrope",
  "DM Sans": "--f-dm-sans",
  "Space Grotesk": "--f-space-grotesk",
};
