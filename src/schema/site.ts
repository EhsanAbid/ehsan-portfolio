import { z } from "zod";
import {
  TODO,
  bool,
  color,
  group,
  icon,
  id,
  int,
  list,
  longText,
  media,
  num,
  select,
  tags,
  text,
  url,
} from "./fields";
import { rich } from "./rich";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE SITE SCHEMA — single source of truth.
 *  The whole public website (content, sections, design, effects, game, SEO) is one
 *  JSON document validated by `siteSchema`. The admin forms are generated from it,
 *  the seed fills it, the public pages render it. Add a field here and it becomes
 *  editable in the admin automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SCHEMA_VERSION = 1;

/* ───────────── Profile & content ───────────── */

export const SOCIAL_KINDS = ["linkedin", "github", "email", "website", "facebook", "x", "other"] as const;

const socialSchema = z.object({
  id: id(),
  kind: select("Type", SOCIAL_KINDS, "other"),
  label: text("Label", "Link"),
  url: url("URL"),
  magnetic: bool("Magnetic button", true),
});

const interestSchema = z.object({
  id: id(),
  label: text("Interest", "Interest"),
  icon: icon("Icon", "✦"),
});

const profileSchema = group("Profile", {
  name: text("Full name", "Ehsan Ahmed Abid"),
  shortName: text("Short name (nav, terminal)", "Ehsan"),
  role: text("Role (one line)", "CSE Student @ East West University"),
  taglines: tags("Typewriter taglines", [
    "CSE Student @ East West University",
    "Future Software Engineer",
    "Bug Hunter",
    "Always Levelling Up",
  ]),
  bio: rich("Bio (3–5 sentences)"),
  funLine: text("Fun line", `${TODO}: one fun line about you`),
  photo: media("Profile photo (square, ≥ 800 px)"),
  cv: media("CV (PDF)", "pdf"),
  university: text("University", "East West University"),
  department: text("Department", "Computer Science & Engineering"),
  semester: text("Semester", `${TODO}: e.g. 3rd semester`),
  location: text("Based in", `${TODO}: city, country`),
  currentlyLearning: text("Currently learning", `${TODO}: e.g. Data Structures`),
  publicEmail: text("Public email", `${TODO}: public email`),
  interests: list("Interests (orbit moons, 3–4)", interestSchema, { itemLabel: "label" }, 6),
  funFacts: tags("Fun facts (used by Easter eggs)", []),
  jokes: tags("Jokes (terminal `joke`)", []),
});

export const SKILL_STATUSES = ["mastered", "learning", "locked"] as const;

const skillSchema = z.object({
  id: id(),
  name: text("Skill", "New skill"),
  branchId: text("Branch id", "programming", { help: "Must match a branch id" }),
  status: select("Status", SKILL_STATUSES, "learning", {
    optionLabels: { mastered: "Mastered", learning: "Learning", locked: "Locked (goal)" },
  }),
  usedIn: text("Where used", ""),
  since: text("Since", ""),
  goal: text("Goal (for locked skills)", ""),
});

const branchSchema = z.object({
  id: id(),
  name: text("Branch name", "Branch"),
  color: color("Branch colour", "#22D3EE"),
});

const skillsSchema = group("Skills", {
  branches: list("Branches", branchSchema, { itemLabel: "name" }, 12),
  items: list("Skills", skillSchema, { itemLabel: "name" }, 120),
});

export const QUEST_STATUSES = ["completed", "in-progress", "planned"] as const;

const questSchema = z.object({
  id: id(),
  title: text("Title", "New quest"),
  summary: longText("Summary (1–2 lines)", ""),
  status: select("Status", QUEST_STATUSES, "in-progress", {
    optionLabels: { completed: "Completed", "in-progress": "In progress", planned: "Planned" },
  }),
  difficulty: int("Difficulty (1–5)", 2, 1, 5),
  tags: tags("Tech tags"),
  category: text("Filter category", "Projects"),
  reward: text("Reward: what I learned", ""),
  github: url("GitHub URL"),
  live: url("Live URL"),
  image: media("Screenshot"),
});

const checkpointSchema = z.object({
  id: id(),
  title: text("Title", "Checkpoint"),
  date: text("Date / year", ""),
  description: longText("Description", ""),
  icon: icon("Icon", "✦"),
  locked: bool("Locked (future ???)", false),
});

const labTopicSchema = z.object({
  id: id(),
  topic: text("Topic", "New topic"),
  note: text("Note", ""),
  progress: num("Progress", 30, 0, 100, { unit: "%" }),
  updated: text("Last updated (YYYY-MM-DD)", ""),
});

/* ───────────── Sections ───────────── */

export const SECTION_TYPES = [
  "about",
  "skills",
  "quests",
  "journey",
  "lab",
  "contact",
  "text",
  "cards",
  "gallery",
  "embed",
  "quote",
  "cta",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  about: "About (Planet Origin)",
  skills: "Skills (Constellation)",
  quests: "Quests (Projects)",
  journey: "Journey (Timeline)",
  lab: "The Lab (Now learning)",
  contact: "Contact (Signal Station)",
  text: "Custom text",
  cards: "Custom cards",
  gallery: "Gallery",
  embed: "Video / Link embed",
  quote: "Quote",
  cta: "Call to action",
};

export const MOODS = ["nebula", "calm", "warm", "aurora", "void"] as const;

const planetSchema = group("Planet", {
  color: color("Planet colour", "#8B5CF6"),
  size: num("Planet size", 1, 0.4, 2, { step: 0.1 }),
  ring: bool("Ring", false),
  ringColor: color("Ring colour", "#22D3EE"),
});

const sectionBase = {
  id: id(),
  enabled: bool("Visible", true),
  title: text("Title", "Section"),
  subtitle: text("Subtitle", ""),
  navLabel: text("Nav label", ""),
  anchor: z
    .string()
    .regex(/^[a-z0-9-]*$/, "lowercase letters, digits and - only")
    .max(40)
    .default("")
    .meta({ label: "Anchor (#link)", widget: "text" }),
  planet: planetSchema,
  mood: select("Background mood", MOODS, "nebula"),
};

const cardSchema = z.object({
  id: id(),
  title: text("Title", "Card"),
  body: longText("Text", ""),
  icon: icon("Icon", "✦"),
  link: url("Link"),
});

const emptyData = group("Content", {}, { help: "This section shows the matching content from the Content area." });

export const sectionDataSchemas = {
  about: emptyData,
  skills: emptyData,
  quests: emptyData,
  journey: emptyData,
  lab: emptyData,
  contact: emptyData,
  text: group("Content", { body: rich("Text") }),
  cards: group("Content", { cards: list("Cards", cardSchema, { itemLabel: "title" }, 24) }),
  gallery: group("Content", {
    images: list("Images", media("Image"), {}, 24),
  }),
  embed: group("Content", {
    url: url("Video or link URL", "", { help: "YouTube / Vimeo links become an embedded player; anything else a link card." }),
    caption: text("Caption", ""),
  }),
  quote: group("Content", { text: longText("Quote", ""), author: text("Author", "") }),
  cta: group("Content", {
    text: longText("Text", ""),
    buttonLabel: text("Button label", "Let's talk"),
    buttonUrl: url("Button link", "#contact"),
  }),
} satisfies Record<SectionType, z.ZodType>;

const sec = <T extends SectionType, D extends z.ZodType>(type: T, data: D) =>
  z.object({ ...sectionBase, type: z.literal(type), data });

export const sectionSchema = z.discriminatedUnion("type", [
  sec("about", sectionDataSchemas.about),
  sec("skills", sectionDataSchemas.skills),
  sec("quests", sectionDataSchemas.quests),
  sec("journey", sectionDataSchemas.journey),
  sec("lab", sectionDataSchemas.lab),
  sec("contact", sectionDataSchemas.contact),
  sec("text", sectionDataSchemas.text),
  sec("cards", sectionDataSchemas.cards),
  sec("gallery", sectionDataSchemas.gallery),
  sec("embed", sectionDataSchemas.embed),
  sec("quote", sectionDataSchemas.quote),
  sec("cta", sectionDataSchemas.cta),
]);
export type Section = z.infer<typeof sectionSchema>;

/* ───────────── Design ───────────── */

export const HEADING_FONTS = ["Space Grotesk", "Sora", "Outfit", "Syne", "Orbitron"] as const;
export const BODY_FONTS = ["Inter", "Manrope", "DM Sans", "IBM Plex Sans", "Nunito Sans"] as const;
export const MONO_FONTS = ["JetBrains Mono", "Fira Code", "IBM Plex Mono", "Space Mono"] as const;

const designSchema = group("Design", {
  preset: select("Preset", ["deep-space", "nebula", "aurora", "midnight-gold", "custom"] as const, "deep-space", {
    optionLabels: {
      "deep-space": "Deep Space",
      nebula: "Nebula",
      aurora: "Aurora",
      "midnight-gold": "Midnight Gold",
      custom: "Custom",
    },
  }),
  colors: group("Colour tokens", {
    bgDeep: color("Background (--bg-deep)", "#05060F"),
    panel: color("Glass panel tint (--panel)", "#FFFFFF"),
    cyan: color("Primary accent (--cyan)", "#22D3EE"),
    violet: color("Secondary accent (--violet)", "#8B5CF6"),
    pink: color("Highlight (--pink)", "#F472B6"),
    gold: color("XP / achievements (--gold)", "#FBBF24"),
    text: color("Body text (--text)", "#E5E7EB"),
    muted: color("Secondary text (--muted)", "#94A3B8"),
  }),
  fonts: group("Fonts", {
    heading: select("Heading font", HEADING_FONTS, "Space Grotesk"),
    body: select("Body font", BODY_FONTS, "Inter"),
    mono: select("Mono font", MONO_FONTS, "JetBrains Mono"),
  }),
  radius: num("Corner radius", 16, 0, 32, { unit: "px" }),
  glassBlur: num("Glass blur", 14, 0, 40, { unit: "px" }),
  glassOpacity: num("Glass opacity", 0.05, 0, 0.3, { step: 0.01 }),
  buttonStyle: select("Button style", ["glow", "solid", "outline"] as const, "glow"),
  cursorStyle: select("Cursor style", ["comet", "dot", "system"] as const, "comet"),
  spacing: num("Spacing scale", 1, 0.75, 1.5, { step: 0.05 }),
});

/* ───────────── Effects ───────────── */

const tierCounts = (label: string, high: number, medium: number, low: number, max: number) =>
  group(label, {
    high: int("High tier", high, 0, max),
    medium: int("Medium tier", medium, 0, max),
    low: int("Low tier", low, 0, max),
  });

const skyThemeSchema = z.object({
  id: id(),
  name: text("Name", "Sky"),
  startHour: int("Starts at hour (0–23)", 0, 0, 23),
  endHour: int("Ends at hour (0–24)", 24, 0, 24),
  top: color("Sky top", "#05060F"),
  bottom: color("Sky bottom", "#0B1026"),
  glow: color("Glow", "#8B5CF6"),
});

const effectsSchema = group("Effects", {
  boot: group("Boot sequence", {
    enabled: bool("Enabled", true),
    lines: tags("Boot lines", [
      "> initializing ehsan.exe v2.0 ........ OK",
      "> loading curiosity .................. OK",
      "> compiling dreams ................... OK",
      "> bugs found: 3 · bugs fixed: 3",
      "> welcome, explorer.",
    ]),
    nightLine: text("Night line (00:00–05:00)", "> it's late and you're here? respect."),
    nightLineIndex: int("Night line replaces line #", 3, 0, 20),
    durationMs: int("Full duration", 2500, 600, 2500, { unit: "ms" }),
    miniDurationMs: int("Returning-visitor duration", 600, 0, 1500, { unit: "ms" }),
    showFullOnce: bool("Full version only on first visit", true),
    skipHint: text("Skip hint", "Press any key / tap to skip"),
  }),
  particles: group("Big Bang particles", {
    enabled: bool("Enabled", true),
    counts: tierCounts("Particle count per tier", 8000, 4000, 1500, 12000),
    repelRadius: num("Repel radius", 90, 20, 250, { unit: "px" }),
    repelForce: num("Repel force", 1.2, 0, 4, { step: 0.1 }),
    spring: num("Spring stiffness", 0.06, 0.01, 0.2, { step: 0.01 }),
    damping: num("Damping", 0.86, 0.6, 0.98, { step: 0.01 }),
    size: num("Particle size", 2, 0.5, 5, { step: 0.1 }),
    colors: group("Colours", {
      a: color("Colour A", "#22D3EE"),
      b: color("Colour B", "#8B5CF6"),
      c: color("Colour C", "#F472B6"),
      d: color("Colour D", "#E5E7EB"),
    }),
  }),
  starfield: group("Starfield & warp", {
    enabled: bool("Enabled", true),
    counts: tierCounts("Stars per tier", 4000, 2000, 800, 8000),
    warpIntensity: num("Warp intensity", 1, 0, 3, { step: 0.1 }),
    drift: num("Ambient drift speed", 0.3, 0, 2, { step: 0.05 }),
    planets: bool("Show planets", true),
  }),
  shootingStars: group("Shooting stars", {
    enabled: bool("Enabled", true),
    minIntervalSec: int("Min interval", 10, 2, 120, { unit: "s" }),
    maxIntervalSec: int("Max interval", 25, 3, 300, { unit: "s" }),
  }),
  sky: group("Sky themes", {
    auto: bool("Follow visitor's local time", true),
    themes: list("Themes", skyThemeSchema, { itemLabel: "name" }, 8),
  }),
  sound: group("Sound", {
    defaultOn: bool("On by default", false),
    volume: num("Volume", 0.35, 0, 1, { step: 0.05 }),
  }),
  cursor: group("Comet cursor", {
    enabled: bool("Enabled (desktop only)", true),
    trail: bool("Trail", true),
    trailLength: int("Trail length", 14, 2, 40),
    magneticStrength: num("Magnetic button strength", 0.35, 0, 1, { step: 0.05 }),
  }),
  konami: group("Konami god mode", {
    enabled: bool("Enabled", true),
    durationSec: int("Duration", 10, 3, 30, { unit: "s" }),
  }),
  motion: group("Motion", {
    smoothScroll: bool("Smooth scroll (Lenis)", true),
    revealMs: int("Section reveal duration", 700, 300, 1200, { unit: "ms" }),
    tilt: bool("3D tilt on quest cards", true),
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

/* ───────────── Game ───────────── */

export const TRIGGER_TYPES = [
  "visit",
  "scroll-to-section",
  "click-element",
  "terminal-command",
  "time-window",
  "key-sequence",
  "form-sent",
  "custom-event",
] as const;

const achievementSchema = z.object({
  id: id(),
  name: text("Name", "Achievement"),
  description: text("Description (how to unlock)", ""),
  icon: icon("Icon", "🏆"),
  enabled: bool("Enabled", true),
  trigger: select("Trigger type", TRIGGER_TYPES, "visit", {
    optionLabels: {
      visit: "Visit (first visit)",
      "scroll-to-section": "Scroll to section (anchor id)",
      "click-element": "Click element N times (element id)",
      "terminal-command": "Terminal command (exact text)",
      "time-window": "Time window (e.g. 00-05)",
      "key-sequence": "Key sequence (space-separated keys)",
      "form-sent": "Contact form sent",
      "custom-event": "Built-in event (shooting-star, skill-inspect, email-click…)",
    },
  }),
  param: text("Trigger parameter", ""),
  count: int("Times needed", 1, 1, 100),
});

export const BUILTIN_COMMANDS = [
  "help",
  "whoami",
  "about",
  "skills",
  "projects",
  "open",
  "cv",
  "contact",
  "socials",
  "theme",
  "sound",
  "achievements",
  "matrix",
  "sudo",
  "coffee",
  "joke",
  "clear",
  "exit",
] as const;

const commandSchema = z.object({
  id: id(),
  builtin: z.enum([...BUILTIN_COMMANDS, "custom"] as const).default("custom").meta({ widget: "hidden" }),
  name: text("Command (what the visitor types)", "hello"),
  description: text("Help text", ""),
  reply: longText("Reply", "", { help: "For built-ins this is the intro/extra text. {name} = your short name." }),
  enabled: bool("Enabled", true),
});

const gameSchema = group("Game", {
  hud: group("HUD", {
    enabled: bool("Show HUD player card", true),
    levelPrefix: text("Level prefix", "Lv."),
    achievementsLabel: text("Achievements label", "Achievements"),
    levelTitles: tags("Level titles (Lv.1, Lv.2, …)", [
      "Hello-World Rookie",
      "CSE Explorer",
      "Bug Hunter",
      "Code Ranger",
      "Algorithm Knight",
      "Full-Stack Mage",
      "Software Architect",
    ]),
  }),
  xp: group("XP rules", {
    perMastered: int("XP per mastered skill", 60, 0, 1000),
    perLearning: int("XP per learning skill", 25, 0, 1000),
    perCompletedQuest: int("XP per completed quest", 80, 0, 1000),
    perInProgressQuest: int("XP per in-progress quest", 30, 0, 1000),
    perCheckpoint: int("XP per unlocked journey checkpoint", 20, 0, 1000),
    levelSize: int("XP needed per level", 400, 50, 10000),
  }),
  achievementsUi: group("Achievement texts", {
    toastTitle: text("Toast title", "Achievement unlocked"),
    hiddenName: text("Hidden achievement name", "???"),
    hiddenDescription: text("Hidden achievement hint", "Keep exploring…"),
  }),
  achievements: list("Achievements", achievementSchema, { itemLabel: "name" }, 40),
  terminal: group("Terminal", {
    enabled: bool("Enabled", true),
    title: text("Window title", "ehsan.exe — terminal"),
    prompt: text("Prompt", "guest@ehsan.exe:~$"),
    welcome: longText("Welcome text", "ehsan.exe terminal v2.0 — type 'help' to list commands."),
    notFound: text("Unknown command reply", "command not found — try 'help'. Ehsan is still learning that one too."),
    commands: list("Commands", commandSchema, { itemLabel: "name" }, 80),
    messages: group(
      "Built-in replies",
      {
        questNotFound: text("open: quest not found", "No quest called '{arg}'. Try 'projects'."),
        openUsage: text("open: usage", "usage: open <quest id or name>"),
        noCv: text("cv: no CV uploaded", "The CV is still being compiled. Try 'contact' instead."),
        sudoDenied: text("sudo: wrong command", "sudo: permission denied. Did you mean 'sudo hire {name}'?"),
        themeUsage: text("theme: usage", "usage: theme {options}"),
        soundUsage: text("sound: usage", "usage: sound on|off"),
        unlocked: text("achievements: unlocked marker", "✓"),
        locked: text("achievements: locked marker", "·"),
        noJokes: text("joke: none set", "404: joke not found."),
        mastered: text("skills: mastered heading", "Mastered"),
        learning: text("skills: learning heading", "Learning"),
        locked2: text("skills: locked heading", "Locked"),
        openHint: text("projects: hint", "Type 'open <id>' to jump to a quest."),
      },
      { collapsed: true },
    ),
  }),
  greetings: group("Smart greeting", {
    morning: text("Morning (05–12)", "Good morning, explorer"),
    afternoon: text("Afternoon (12–17)", "Good afternoon, explorer"),
    evening: text("Evening (17–22)", "Good evening, explorer"),
    night: text("Night (22–05)", "Still awake, explorer?"),
  }),
});

/* ───────────── Micro-copy (every visible label) ───────────── */

const copySchema = group("Labels & micro-copy", {
  nav: group("Navigation", {
    skipToContent: text("Skip link", "Skip to content"),
    miniMapLabel: text("Mini-map label", "Journey map"),
    soundOn: text("Sound on label", "Sound on"),
    soundOff: text("Sound off label", "Sound off"),
    skyToggle: text("Sky toggle label", "Change sky"),
    terminalButton: text("Terminal button label", "Open terminal"),
    closeTerminal: text("Close terminal (screen readers)", "Close terminal"),
    shootingStar: text("Shooting star (screen readers)", "Shooting star — catch it!"),
    questFilter: text("Quest filter (screen readers)", "Filter quests"),
    technologies: text("Tech list (screen readers)", "Technologies"),
  }),
  hero: group("Hero", {
    eyebrow: text("Small line above the name", "> ehsan.exe v2.0 — running"),
    startButton: text("Start button", "Start the journey"),
    linkedinButton: text("LinkedIn button", "LinkedIn"),
    cvButton: text("CV button", "Download CV"),
    scrollHint: text("Scroll hint", "scroll to warp"),
  }),
  about: group("About", {
    university: text("Stat: University", "University"),
    department: text("Stat: Department", "Department"),
    semester: text("Stat: Semester", "Semester"),
    location: text("Stat: Based in", "Based in"),
    learning: text("Stat: Currently learning", "Currently learning"),
  }),
  skills: group("Skills", {
    mastered: text("Mastered", "Mastered"),
    learning: text("Learning", "Learning"),
    locked: text("Locked", "Locked"),
    unlocking: text("Unlocking ring", "unlocking…"),
    usedIn: text("Where used", "Used in"),
    since: text("Since", "Since"),
    goal: text("Goal", "Goal"),
    listHeading: text("Accessible list heading", "All skills"),
  }),
  quests: group("Quests", {
    filterAll: text("Filter: all", "All quests"),
    completed: text("Completed", "Completed"),
    inProgress: text("In progress", "In progress"),
    planned: text("Planned", "Planned"),
    difficulty: text("Difficulty", "Difficulty"),
    reward: text("Reward", "Reward"),
    github: text("GitHub button", "GitHub"),
    live: text("Live button", "Live"),
  }),
  journey: group("Journey", {
    locked: text("Locked checkpoint", "???"),
  }),
  lab: group("Lab", {
    lastUpdated: text("Last updated", "last updated"),
    progress: text("Progress", "progress"),
  }),
  contact: group("Contact", {
    name: text("Name label", "Your name"),
    email: text("Email label", "Your email"),
    message: text("Message label", "Message"),
    send: text("Send button", "Transmit signal"),
    sending: text("Sending", "Transmitting…"),
    success: text("Success", "Signal received. Ehsan will reply soon!"),
    error: text("Error", "Transmission failed. Please try again or use email."),
    rateLimited: text("Rate limited", "Too many signals — please wait a few minutes."),
    emailButton: text("Email button", "Email"),
  }),
  footer: group("Footer", {
    line: text("Main line", "You've reached the edge of the known universe… for now."),
    subline: text("Second line", "Ehsan is still levelling up."),
    achievements: text("Achievements label", "achievements unlocked"),
    secrets: text("Secrets hint", "some secrets are still hidden"),
    backToTop: text("Back to top", "Back to launch"),
    credit: text("Credit line", "Built by Ehsan Ahmed Abid · Next.js · three.js · Neon"),
  }),
});

/* ───────────── SEO & advanced ───────────── */

const seoSchema = group("SEO & sharing", {
  title: text("Page title", "Ehsan Ahmed Abid — CSE Student @ East West University"),
  description: longText(
    "Description",
    "ehsan.exe — the level-up universe of Ehsan Ahmed Abid, Computer Science & Engineering student at East West University.",
  ),
  keywords: tags("Keywords", ["Ehsan Ahmed Abid", "CSE", "East West University", "portfolio", "software engineer"]),
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
    title: text("Title", "Ehsan is upgrading the universe"),
    message: longText("Message", "New stars are being installed. Please come back soon."),
  }),
});

/* ───────────── The whole site ───────────── */

export const siteSchema = z.object({
  schemaVersion: z.number().int().default(SCHEMA_VERSION).meta({ widget: "hidden" }),
  profile: profileSchema,
  socials: list("Socials", socialSchema, { itemLabel: "label" }, 12),
  skills: skillsSchema,
  quests: list("Quests (projects)", questSchema, { itemLabel: "title" }, 60),
  journey: list("Journey checkpoints", checkpointSchema, { itemLabel: "title" }, 40),
  lab: list("Lab topics (2–4)", labTopicSchema, { itemLabel: "topic" }, 6),
  sections: z.array(sectionSchema).max(40).default([]).meta({ label: "Sections", widget: "list", itemLabel: "title" }),
  design: designSchema,
  effects: effectsSchema,
  game: gameSchema,
  copy: copySchema,
  seo: seoSchema,
  advanced: advancedSchema,
});

export type Site = z.infer<typeof siteSchema>;
export type SiteInput = z.input<typeof siteSchema>;
export type Profile = Site["profile"];
export type Skill = Site["skills"]["items"][number];
export type Quest = Site["quests"][number];
export type Checkpoint = Site["journey"][number];
export type LabTopic = Site["lab"][number];
export type Achievement = Site["game"]["achievements"][number];
export type TerminalCommand = Site["game"]["terminal"]["commands"][number];
export type SkyTheme = Site["effects"]["sky"]["themes"][number];
export type Social = Site["socials"][number];

/** Item schemas exported for the admin (new-item defaults, per-list forms). */
export const itemSchemas = {
  social: socialSchema,
  interest: interestSchema,
  skill: skillSchema,
  branch: branchSchema,
  quest: questSchema,
  checkpoint: checkpointSchema,
  labTopic: labTopicSchema,
  card: cardSchema,
  achievement: achievementSchema,
  command: commandSchema,
  skyTheme: skyThemeSchema,
};

/** Parse anything into a valid Site, filling defaults. Throws on invalid data. */
export function parseSite(data: unknown): Site {
  return siteSchema.parse(data ?? {});
}
