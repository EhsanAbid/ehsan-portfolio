import { z } from "zod";
import { TODO, bool, color, group, id, int, list, longText, media, num, select, tags, text, url } from "./fields";
import { rich } from "./rich";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE SITE SCHEMA — single source of truth.
 *  The whole public website (content, design, effects, terminal, SEO) is one JSON
 *  document validated by `siteSchema`. The admin forms are generated from it, the
 *  seed fills it, the public pages render it. Add a field here and it becomes
 *  editable in the admin automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SCHEMA_VERSION = 2;

/* ───────────── Profile & content ───────────── */

export const SOCIAL_KINDS = ["linkedin", "github", "email", "website", "facebook", "instagram", "x", "other"] as const;

const socialSchema = z.object({
  id: id(),
  kind: select("Type", SOCIAL_KINDS, "other"),
  label: text("Label", "Link"),
  url: url("URL"),
});

const profileSchema = group("Profile", {
  name: text("Full name (the big title)", "Ehsan Ahmed Abid"),
  shortName: text("Short name (terminal, small places)", "Ehsan"),
  currently: text("Currently (top bar)", "CSE student, East West University"),
  location: text("Based in (top bar)", "Dhaka, Bangladesh"),
  timezone: text("Time zone for the live clock (IANA name)", "Asia/Dhaka", { help: "e.g. Asia/Dhaka. The top bar shows your local time." }),
  intro: longText(
    "Intro (small paragraph above your name)",
    "Computer science student at East West University, Dhaka. I build full-stack web apps, including the tournament platform for the university's esports community.",
  ),
  photo: media("Portrait for the block face (PNG with transparent background works best)"),
  logo: media("Logo (optional — empty = your initials)"),
  aboutHeadline: text("About: headline", "I build full-stack websites"),
  bio: rich("About: your story (3–5 sentences)"),
  cv: media("CV (PDF)", "pdf"),
  university: text("University", "East West University"),
  department: text("Department", "Computer Science & Engineering"),
  semester: text("Semester", `${TODO}: e.g. 3rd semester`),
  currentlyLearning: tags("Currently learning", [`${TODO}: a topic you're learning`]),
  publicEmail: text("Public email", `${TODO}: public email`),
  funFacts: tags("Fun facts (used by the terminal)", []),
  jokes: tags("Jokes (terminal `joke`)", []),
});

export const SKILL_STATUSES = ["mastered", "learning", "locked"] as const;

const skillSchema = z.object({
  id: id(),
  name: text("Skill", "New skill"),
  branchId: text("Group id", "programming", { help: "Must match a group id" }),
  status: select("Status", SKILL_STATUSES, "learning", {
    optionLabels: { mastered: "Confident", learning: "Learning", locked: "Next up" },
  }),
});

const branchSchema = z.object({
  id: id(),
  name: text("Group name", "Group"),
});

const skillsSchema = group("Skills", {
  branches: list("Groups", branchSchema, { itemLabel: "name" }, 12),
  items: list("Skills", skillSchema, { itemLabel: "name" }, 120),
});

export const WORK_STATUSES = ["completed", "in-progress"] as const;

const workSchema = z.object({
  id: id(),
  title: text("Title", "New project"),
  category: text("Category (e.g. Website, App, Design, Lab)", "Project"),
  year: text("Year", ""),
  status: select("Status", WORK_STATUSES, "completed", { optionLabels: { completed: "Finished", "in-progress": "In progress" } }),
  featured: bool("Selected work (shown first)", false),
  summary: longText("One-line summary", ""),
  details: rich("About the project"),
  tags: tags("Built with"),
  image: media("Cover image (shown flying in the 3D view)"),
  gallery: list("More images", media("Image"), {}, 12),
  github: url("GitHub URL"),
  live: url("Live URL"),
});

const checkpointSchema = z.object({
  id: id(),
  date: text("Date / year", ""),
  title: text("Title", "Milestone"),
  description: longText("Description", ""),
});

/* ───────────── Design ───────────── */

export const DISPLAY_FONTS = ["Big Shoulders", "Instrument Serif", "Playfair Display", "Fraunces", "Newsreader", "DM Serif Display"] as const;
export const BODY_FONTS = ["IBM Plex Sans", "Inter Tight", "Inter", "Manrope", "DM Sans", "Space Grotesk"] as const;

const designSchema = group("Design", {
  preset: select("Preset", ["cyanotype", "ink", "paper", "midnight", "forest", "custom"] as const, "cyanotype", {
    optionLabels: { cyanotype: "Cyanotype (blueprint blue)", ink: "Ink (black)", paper: "Paper (light)", midnight: "Midnight blue", forest: "Forest", custom: "Custom" },
  }),
  colors: group("Colours", {
    bg: color("Background", "#12309A"),
    text: color("Text", "#F5F7FC"),
    muted: color("Secondary text", "#C3CEF0"),
    accent: color("Accent (focus, highlights)", "#FFD166"),
    panel: color("Panel sheet", "#EEF2F9"),
    panelText: color("Text on panel sheets", "#0C1C5E"),
    lines: color("Signature line", "#FFFFFF"),
  }),
  fonts: group("Fonts", {
    display: select("Big title font", DISPLAY_FONTS, "Big Shoulders"),
    displayItalic: bool("Italic big title", false),
    displayUpper: bool("Capital letters in big titles", true),
    body: select("Text font", BODY_FONTS, "IBM Plex Sans"),
  }),
  nameSize: num("Big name size", 1, 0.6, 1.4, { step: 0.05 }),
  radius: num("Corner radius", 3, 0, 28, { unit: "px" }),
  glassBlur: num("Terminal window blur", 34, 0, 60, { unit: "px" }),
  glassOpacity: num("Panel sheet opacity", 1, 0.3, 1, { step: 0.01 }),
});

/* ───────────── Effects ───────────── */

const tierCounts = (label: string, high: number, medium: number, low: number, min: number, max: number) =>
  group(label, {
    high: int("High tier", high, min, max),
    medium: int("Medium tier", medium, min, max),
    low: int("Low tier", low, min, max),
  });

const effectsSchema = group("Effects", {
  loader: group("Loader", {
    enabled: bool("Show the logo loader", true),
    durationMs: int("First visit", 1300, 300, 2500, { unit: "ms" }),
    returningMs: int("Returning visitors", 450, 0, 1500, { unit: "ms" }),
  }),
  portrait: group("Block portrait", {
    enabled: bool("Show the block portrait", true),
    columns: tierCounts("Blocks across (per quality tier)", 150, 136, 124, 24, 200),
    gap: num("Gap between blocks", 0.22, 0, 0.6, { step: 0.02 }),
    mono: num("Two-colour print (1 = page colours only, 0 = photo colours)", 1, 0, 1, { step: 0.05 }),
    colourful: num("Coloured sparkle blocks", 0.05, 0, 1, { step: 0.01 }),
    palette: group("Sparkle colours", {
      a: color("Colour A", "#FFD166"),
      b: color("Colour B", "#FFD166"),
      c: color("Colour C", "#FFFFFF"),
      d: color("Colour D", "#9FD4FF"),
    }),
    relief: num("3D depth of the face", 1, 0, 3, { step: 0.1 }),
    dust: tierCounts("Background dust (per quality tier)", 900, 600, 250, 0, 3000),
    brightness: num("Brightness", 1.25, 0.4, 2, { step: 0.05 }),
    shimmer: num("Shimmer", 0.5, 0, 1, { step: 0.05 }),
    hoverRadius: num("Mouse ripple radius", 0.18, 0, 0.5, { step: 0.01, help: "Fraction of the portrait height" }),
    hoverPush: num("Mouse ripple strength", 1, 0, 3, { step: 0.1 }),
    crop: num("Use the top part of the photo", 0.54, 0.3, 1, { step: 0.02, help: "Lower = closer to your face (0.6 ≈ head and shoulders)" }),
    sideCrop: num("Trim the photo's sides", 0.1, 0, 0.4, { step: 0.02, help: "Cut off each side so more blocks land on the face" }),
    texture: num("Texture inside each block", 0.8, 0, 1, { step: 0.05, help: "0 = plain blocks. The texture never changes how light or dark a block is" }),
    size: num("Portrait height (share of the screen)", 0.9, 0.5, 1.3, { step: 0.05 }),
    offsetX: num("Desktop: shift right", 0.2, -0.4, 0.4, { step: 0.01 }),
  }),
  flight: group("Scroll flight", {
    enabled: bool("Fly through the work on scroll", true),
    scrollPerWork: num("Scroll length per project", 0.9, 0.4, 2, { unit: "screens", step: 0.05 }),
    cardSize: num("Project card size", 1, 0.5, 1.8, { step: 0.05 }),
    fieldDepth: num("Field depth", 1, 0.5, 2, { step: 0.1 }),
  }),
  signature: group("Signature", {
    enabled: bool("Show the signature writing itself", true),
    path: z
      .string()
      .max(20000)
      .default("")
      .meta({
        label: "Signature (SVG path data, optional)",
        widget: "code",
        help: "Empty = your traced “Abid” signature. To use another: paste the d=\"…\" value of a filled SVG outline in a 1000×400 box.",
      }),
    opacity: num("Opacity", 0.32, 0.05, 1, { step: 0.01 }),
    drawSec: num("Writing time", 4.5, 1.5, 12, { unit: "s", step: 0.5 }),
    holdSec: num("Stays visible for", 6, 1, 30, { unit: "s", step: 0.5 }),
    size: num("Size (share of screen width)", 0.55, 0.3, 1.4, { step: 0.05, help: "Sits behind the head; phones use at least 90% of the width" }),
  }),
  endGlow: group("End screen glow", {
    enabled: bool("Slow moving glow behind the last screen", true, {
      help: "WebGPU, desktops only (newer Chrome / Edge). Phones and other browsers keep the plain background.",
    }),
    strength: num("Strength", 0.55, 0.1, 1, { step: 0.05 }),
    accent: num("Glow amount", 0.14, 0, 0.6, { step: 0.02 }),
    speed: num("Speed", 0.25, 0, 2, { step: 0.05 }),
    distortion: num("Flow", 0.6, 0, 2, { step: 0.1 }),
  }),
  motion: group("Motion", {
    smoothScroll: bool("Smooth scroll (desktop)", true),
    letterRise: bool("Letters rise in on load", true),
  }),
  quality: group("Quality controller", {
    dprHigh: num("Pixel-ratio cap — High", 2, 1, 3, { step: 0.25 }),
    dprMedium: num("Pixel-ratio cap — Medium", 1.5, 0.75, 2, { step: 0.25 }),
    dprLow: num("Pixel-ratio cap — Low", 1, 0.5, 1.5, { step: 0.25 }),
    windowSec: num("FPS averaging window", 2, 1, 5, { unit: "s", step: 0.5 }),
    dropBelowFps: int("Drop a tier below", 40, 20, 58, { unit: "fps" }),
    dropAfterSec: num("…for at least", 2, 1, 10, { unit: "s", step: 0.5 }),
    raiseAboveFps: int("Raise a tier above", 58, 40, 120, { unit: "fps" }),
    raiseAfterSec: num("…for at least", 5, 2, 20, { unit: "s", step: 0.5 }),
  }),
});

/* ───────────── Terminal (hidden Easter egg) ───────────── */

export const BUILTIN_COMMANDS = ["help", "whoami", "about", "skills", "projects", "open", "cv", "contact", "socials", "sudo", "coffee", "joke", "clear", "exit"] as const;

const commandSchema = z.object({
  id: id(),
  builtin: z.enum([...BUILTIN_COMMANDS, "custom"] as const).default("custom").meta({ widget: "hidden" }),
  name: text("Command (what the visitor types)", "hello"),
  description: text("Help text", ""),
  reply: longText("Reply", "", { help: "For built-ins this is the intro/extra text. {name} = your short name." }),
  enabled: bool("Enabled", true),
});

const terminalSchema = group("Terminal", {
  enabled: bool("Enabled (opens with the ` key)", true),
  title: text("Window title", "ehsan — terminal"),
  prompt: text("Prompt", "guest@ehsan:~$"),
  welcome: longText("Welcome text", "Hi, you found the terminal. Type 'help' to list commands."),
  notFound: text("Unknown command reply", "command not found — try 'help'. Ehsan is still learning that one too."),
  commands: list("Commands", commandSchema, { itemLabel: "name" }, 80),
  messages: group(
    "Built-in replies",
    {
      questNotFound: text("open: project not found", "No project called '{arg}'. Try 'projects'."),
      openUsage: text("open: usage", "usage: open <project id or name>"),
      noCv: text("cv: no CV uploaded", "The CV is still being written. Try 'contact' instead."),
      sudoDenied: text("sudo: wrong command", "sudo: permission denied. Did you mean 'sudo hire {name}'?"),
      noJokes: text("joke: none set", "404: joke not found."),
      noProjects: text("projects: none yet", "No projects published yet — the first one is in progress."),
      mastered: text("skills: confident heading", "Confident"),
      learning: text("skills: learning heading", "Learning"),
      locked2: text("skills: next-up heading", "Next up"),
      openHint: text("projects: hint", "Type 'open <id>' to jump to a project."),
    },
    { collapsed: true },
  ),
});

/* ───────────── Micro-copy (every visible label) ───────────── */

const copySchema = group("Labels & micro-copy", {
  top: group("Top bar", {
    navigation: text("Navigation name (screen readers)", "Main navigation"),
    work: text("Work", "Work"),
    about: text("About", "About"),
    contact: text("Contact", "Contact"),
  }),
  hero: group("Hero", {
    explore: text("Main button", "See my projects"),
    contact: text("Second button", "Send a message"),
  }),
  flight: group("Scroll flight", {
    of: text("“3 of 12” word", "of"),
    works: text("Projects (plural)", "projects"),
    work: text("Project (singular)", "project"),
    open: text("Open a project", "Open project"),
    elsewhere: text("Elsewhere label", "Links"),
    backHome: text("Back to top", "Back to top"),
    emptyTitle: text("No projects yet: title", "Projects coming soon"),
    emptyText: text("No projects yet: text", "Projects appear here as soon as they're published."),
    endTitle: text("End: title", "Internships and project work"),
    endText: text("End: text", "Send me a message about an internship, a project or anything you saw here. I read every message."),
    sayHello: text("End: contact button", "Send a message"),
  }),
  panels: group("Panels", {
    close: text("Close", "Close"),
    skills: text("Skills", "Skills"),
    learning: text("Currently learning", "Currently learning"),
    journey: text("Journey", "Timeline"),
    education: text("Education", "Education"),
    elsewhere: text("Elsewhere", "Links"),
    contact: text("Contact", "Contact"),
    email: text("Email", "Email"),
    year: text("Year", "Year"),
    type: text("Project type", "Type"),
    sendMessage: text("Send a message link", "Send me a message"),
    downloadCv: text("Download CV", "Download CV"),
    allWork: text("Projects", "Projects"),
    noWork: text("No projects", "No projects published yet."),
    projectAbout: text("About the project", "What I built"),
    builtWith: text("Built with", "Built with"),
    links: text("Links", "Links"),
    github: text("GitHub button", "GitHub"),
    live: text("Live button", "Open live site"),
    inProgress: text("In progress badge", "In progress"),
    backToWork: text("Back to the work", "All projects"),
  }),
  contact: group("Contact", {
    headline: text("Headline", "Send me a message"),
    text: longText("Intro", "Internships, project work or questions about what I've built. I read every message."),
    name: text("Name label", "Your name"),
    email: text("Email label", "Your email"),
    message: text("Message label", "Message"),
    send: text("Send button", "Send message"),
    sending: text("Sending", "Sending…"),
    success: text("Success", "Message sent. I'll get back to you soon."),
    error: text("Error", "Couldn't send that. Please try again or use email."),
    rateLimited: text("Rate limited", "Too many messages — please wait a few minutes."),
  }),
  a11y: group("Screen-reader labels", {
    skipToContent: text("Skip link", "Skip to content"),
    closeTerminal: text("Close terminal", "Close terminal"),
    portrait: text("Portrait description", "Portrait of Ehsan made of small coloured blocks"),
  }),
});

/* ───────────── SEO & advanced ───────────── */

const seoSchema = group("SEO & sharing", {
  title: text("Page title", "Ehsan Ahmed Abid, full-stack web developer and CSE student in Dhaka"),
  description: longText("Description", "Projects and contact details of Ehsan Ahmed Abid, a Computer Science & Engineering student at East West University in Dhaka who builds full-stack web apps."),
  keywords: tags("Keywords", ["Ehsan Ahmed Abid", "CSE", "East West University", "Dhaka", "portfolio"]),
  ogImage: media("Open Graph image (1200×630, empty = auto-generated)"),
  favicon: media("Favicon (square PNG, empty = default)"),
  indexing: bool("Allow search engines", true),
  jobTitle: text("JSON-LD job title", "Computer Science & Engineering Student"),
});

const advancedSchema = group("Advanced", {
  customCss: z
    .string()
    .max(20000)
    .default("")
    .meta({ label: "Custom CSS (public site only)", widget: "code", help: "Applied after all other styles. Broken CSS can break the layout — preview first." }),
  maintenance: group("Maintenance mode", {
    enabled: bool("Maintenance mode on", false),
    title: text("Title", "Ehsan is rebuilding something"),
    message: longText("Message", "Back very soon."),
  }),
});

/* ───────────── The whole site ───────────── */

export const siteSchema = z.object({
  schemaVersion: z.number().int().default(SCHEMA_VERSION).meta({ widget: "hidden" }),
  profile: profileSchema,
  works: list("Projects", workSchema, { itemLabel: "title" }, 120),
  skills: skillsSchema,
  journey: list("Journey", checkpointSchema, { itemLabel: "title" }, 40),
  socials: list("Links (LinkedIn, GitHub, email…)", socialSchema, { itemLabel: "label" }, 12),
  design: designSchema,
  effects: effectsSchema,
  terminal: terminalSchema,
  copy: copySchema,
  seo: seoSchema,
  advanced: advancedSchema,
});

export type Site = z.infer<typeof siteSchema>;
export type SiteInput = z.input<typeof siteSchema>;
export type Profile = Site["profile"];
export type Skill = Site["skills"]["items"][number];
export type Work = Site["works"][number];
export type Checkpoint = Site["journey"][number];
export type TerminalCommand = Site["terminal"]["commands"][number];
export type Social = Site["socials"][number];

/** Parse anything into a valid Site, filling defaults. Throws on invalid data. */
export function parseSite(data: unknown): Site {
  return siteSchema.parse(backfill(data ?? {}));
}

/**
 * Versions saved before the cyanotype redesign have no "text on panel sheets" colour and no
 * capitals setting. Their panels were dark, so the new default ink would be unreadable there:
 * give them what they actually looked like (this also keeps History → Restore working).
 */
function backfill(data: unknown) {
  const design = (data as { design?: { colors?: Record<string, unknown>; fonts?: Record<string, unknown> } }).design;
  if (!design?.colors || design.colors.panelText) return data;
  return {
    ...(data as object),
    design: {
      ...design,
      colors: { ...design.colors, panelText: design.colors.text },
      fonts: { ...design.fonts, displayUpper: false },
    },
  };
}
