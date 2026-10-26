import { TODO } from "./fields";
import { richFromText } from "./rich";
import { parseSite, type Site, type SiteInput } from "./site";

/**
 * Default content for the first published version (used by the seed).
 * Scalar defaults live in the schema itself; this file fills the lists.
 * Anything personal that we don't know yet is a TODO_EHSAN placeholder —
 * the admin dashboard lists every one of them.
 */

const T = (what: string) => `${TODO}: ${what}`;

export const defaultSiteInput: SiteInput = {
  profile: {
    bio: richFromText(
      T("3–5 sentences about you — who you are, what you study at EWU, what you are building and what kind of engineer you want to become."),
    ),
    interests: [
      { id: "moon-1", label: T("interest 1"), icon: "💻" },
      { id: "moon-2", label: T("interest 2"), icon: "🪐" },
      { id: "moon-3", label: T("interest 3"), icon: "🎮" },
    ],
    funFacts: [T("a fun fact about you")],
    jokes: [
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "There are 10 kinds of people: those who understand binary and those who don't.",
      "I'd tell you a UDP joke, but you might not get it.",
      "A SQL query walks into a bar, sees two tables and asks: 'Can I JOIN you?'",
    ],
  },

  socials: [
    { id: "linkedin", kind: "linkedin", label: "LinkedIn", url: T("https://www.linkedin.com/in/your-profile") },
    { id: "github", kind: "github", label: "GitHub", url: T("https://github.com/your-username") },
    { id: "email", kind: "email", label: "Email", url: T("mailto:your-public-email") },
  ],

  skills: {
    branches: [
      { id: "programming", name: "Programming", color: "#22D3EE" },
      { id: "web", name: "Web", color: "#8B5CF6" },
      { id: "cs", name: "CS Fundamentals", color: "#F472B6" },
      { id: "tools", name: "Tools", color: "#FBBF24" },
      { id: "soft", name: "Soft skills", color: "#34D399" },
    ],
    items: [
      { id: "c", name: "C", branchId: "programming", status: "learning", usedIn: T("where you used C"), since: "" },
      { id: "cpp", name: "C++", branchId: "programming", status: "learning", usedIn: T("where you used C++"), since: "" },
      { id: "python", name: "Python", branchId: "programming", status: "learning", usedIn: T("where you used Python"), since: "" },
      { id: "java", name: "Java", branchId: "programming", status: "locked", goal: "Object-oriented programming course" },
      { id: "html-css", name: "HTML & CSS", branchId: "web", status: "learning", usedIn: T("where you used HTML/CSS"), since: "" },
      { id: "js", name: "JavaScript", branchId: "web", status: "learning", usedIn: T("where you used JavaScript"), since: "" },
      { id: "react", name: "React", branchId: "web", status: "locked", goal: "Build my own interactive web apps" },
      { id: "ds", name: "Data Structures", branchId: "cs", status: "learning", usedIn: "EWU CSE coursework", since: "" },
      { id: "algo", name: "Algorithms", branchId: "cs", status: "locked", goal: "Competitive programming" },
      { id: "discrete", name: "Discrete Mathematics", branchId: "cs", status: "learning", usedIn: "EWU CSE coursework", since: "" },
      { id: "git", name: "Git & GitHub", branchId: "tools", status: "learning", usedIn: "This website", since: "2026" },
      { id: "linux", name: "Linux terminal", branchId: "tools", status: "locked", goal: "Daily-drive a Linux setup" },
      { id: "teamwork", name: "Teamwork", branchId: "soft", status: "learning", usedIn: T("a team project or club"), since: "" },
      { id: "problem-solving", name: "Problem solving", branchId: "soft", status: "learning", usedIn: "Every bug I fixed", since: "" },
    ],
  },

  quests: [
    {
      id: "ehsan-exe",
      title: "ehsan.exe — this universe",
      summary: "My portfolio as a game: particle Big Bang, skill constellation, hidden achievements and an admin panel to grow it every semester.",
      status: "in-progress",
      difficulty: 4,
      tags: ["Next.js", "TypeScript", "three.js", "Neon Postgres"],
      category: "Web",
      reward: "Full-stack thinking: schemas, caching, WebGL and security.",
      github: T("https://github.com/your-username/ehsan-portfolio"),
      live: "",
    },
    {
      id: "lab-1",
      title: T("a lab project from class"),
      summary: T("1–2 lines about it"),
      status: "completed",
      difficulty: 1,
      tags: ["C"],
      category: "Lab work",
      reward: T("what you learned"),
      github: "",
      live: "",
    },
    {
      id: "next-quest",
      title: T("your next project idea"),
      summary: T("what you want to build next"),
      status: "planned",
      difficulty: 3,
      tags: [],
      category: "Projects",
      reward: "",
      github: "",
      live: "",
    },
  ],

  journey: [
    { id: "school", title: "School", date: T("year"), description: T("your school"), icon: "🎒" },
    { id: "college", title: "College", date: T("year"), description: T("your college"), icon: "📚" },
    { id: "ewu", title: "Joined EWU CSE", date: T("year"), description: "Started BSc in Computer Science & Engineering at East West University.", icon: "🎓" },
    { id: "first-program", title: "First program", date: T("year"), description: "printf(\"Hello, World!\"); — the first star lit up.", icon: "⌨️" },
    { id: "linkedin", title: "LinkedIn created", date: T("year"), description: "Opened a channel to the professional universe.", icon: "🔗" },
    { id: "website", title: "Website launched", date: "2026", description: "ehsan.exe went live.", icon: "🚀" },
    { id: "future", title: "???", date: "", description: "The next checkpoint is still being written.", icon: "🔒", locked: true },
  ],

  lab: [
    { id: "lab-ds", topic: "Data Structures", note: T("what you're practising"), progress: 35, updated: "2026-10-26" },
    { id: "lab-web", topic: "Modern web development", note: "Next.js, TypeScript and databases", progress: 25, updated: "2026-10-26" },
    { id: "lab-3", topic: T("a third topic"), note: "", progress: 10, updated: "2026-10-26" },
  ],

  sections: [
    {
      id: "sec-about", type: "about", title: "Planet Origin", subtitle: "Where the story begins", navLabel: "Origin", anchor: "about",
      planet: { color: "#22D3EE", size: 1.1, ring: true, ringColor: "#8B5CF6" }, mood: "calm", data: {},
    },
    {
      id: "sec-skills", type: "skills", title: "Skill Constellation", subtitle: "Every star is something I learned — some are still unlocking", navLabel: "Skills", anchor: "skills",
      planet: { color: "#8B5CF6", size: 1.3, ring: false, ringColor: "#22D3EE" }, mood: "nebula", data: {},
    },
    {
      id: "sec-quests", type: "quests", title: "Quest Log", subtitle: "Projects, labs and side quests", navLabel: "Quests", anchor: "quests",
      planet: { color: "#F472B6", size: 0.9, ring: true, ringColor: "#FBBF24" }, mood: "warm", data: {},
    },
    {
      id: "sec-journey", type: "journey", title: "Journey Orbit", subtitle: "Checkpoints so far", navLabel: "Journey", anchor: "journey",
      planet: { color: "#FBBF24", size: 0.8, ring: false, ringColor: "#F472B6" }, mood: "aurora", data: {},
    },
    {
      id: "sec-lab", type: "lab", title: "The Lab", subtitle: "Currently learning", navLabel: "Lab", anchor: "lab",
      planet: { color: "#34D399", size: 0.7, ring: true, ringColor: "#22D3EE" }, mood: "calm", data: {},
    },
    {
      id: "sec-contact", type: "contact", title: "Signal Station", subtitle: "Send a signal across the universe", navLabel: "Contact", anchor: "contact",
      planet: { color: "#22D3EE", size: 1, ring: true, ringColor: "#F472B6" }, mood: "void", data: {},
    },
  ],

  effects: {
    sky: {
      auto: true,
      themes: [
        { id: "dawn", name: "Dawn", startHour: 5, endHour: 9, top: "#0B0A1F", bottom: "#2A1238", glow: "#F472B6" },
        { id: "aurora", name: "Aurora", startHour: 9, endHour: 17, top: "#04101C", bottom: "#062A35", glow: "#34D399" },
        { id: "dusk", name: "Dusk", startHour: 17, endHour: 20, top: "#0D0820", bottom: "#2B0F2A", glow: "#FB923C" },
        { id: "night", name: "Deep space", startHour: 20, endHour: 5, top: "#05060F", bottom: "#0B1026", glow: "#8B5CF6" },
      ],
    },
  },

  game: {
    achievements: [
      { id: "hello-world", name: "Hello World", description: "First visit", icon: "👋", trigger: "visit" },
      { id: "explorer", name: "Explorer", description: "Scroll to the footer", icon: "🧭", trigger: "scroll-to-section", param: "footer" },
      { id: "curious-mind", name: "Curious Mind", description: "Open the terminal", icon: "🖥️", trigger: "custom-event", param: "terminal-open" },
      { id: "sudo", name: "sudo", description: "Type sudo hire ehsan", icon: "🔑", trigger: "terminal-command", param: "sudo hire ehsan" },
      { id: "konami", name: "Konami Master", description: "Enter the Konami code", icon: "🎮", trigger: "key-sequence", param: "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a" },
      { id: "night-owl", name: "Night Owl", description: "Visit between 00:00 and 05:00", icon: "🦉", trigger: "time-window", param: "00-05" },
      { id: "persistent", name: "Persistent", description: "Click the profile photo 5 times", icon: "👆", trigger: "click-element", param: "profile-photo", count: 5 },
      { id: "wish-granted", name: "Wish Granted", description: "Click a shooting star", icon: "🌠", trigger: "custom-event", param: "shooting-star" },
      { id: "stargazer", name: "Stargazer", description: "Inspect 5 skill stars", icon: "🔭", trigger: "custom-event", param: "skill-inspect", count: 5 },
      { id: "first-contact", name: "First Contact", description: "Send a message or click the email button", icon: "📡", trigger: "form-sent" },
    ],
    terminal: {
      commands: [
        { id: "c-help", builtin: "help", name: "help", description: "list commands", reply: "Available commands:" },
        { id: "c-whoami", builtin: "whoami", name: "whoami", description: "who is this?", reply: "{name} — {role}. Currently levelling up." },
        { id: "c-about", builtin: "about", name: "about", description: "short bio", reply: "" },
        { id: "c-skills", builtin: "skills", name: "skills", description: "skills by status", reply: "Skill tree:" },
        { id: "c-projects", builtin: "projects", name: "projects", description: "quest list", reply: "Quest log:" },
        { id: "c-open", builtin: "open", name: "open", description: "open <name> — jump to a quest", reply: "Opening quest…" },
        { id: "c-cv", builtin: "cv", name: "cv", description: "download CV", reply: "Downloading CV…" },
        { id: "c-contact", builtin: "contact", name: "contact", description: "email and contact form", reply: "Opening the Signal Station…" },
        { id: "c-socials", builtin: "socials", name: "socials", description: "links", reply: "Find {name} here:" },
        { id: "c-theme", builtin: "theme", name: "theme", description: "theme night|dawn|aurora|dusk", reply: "Sky changed to {arg}." },
        { id: "c-sound", builtin: "sound", name: "sound", description: "sound on|off", reply: "Sound {arg}." },
        { id: "c-ach", builtin: "achievements", name: "achievements", description: "unlocked / hidden list", reply: "Achievements:" },
        { id: "c-matrix", builtin: "matrix", name: "matrix", description: "follow the white rabbit", reply: "Wake up, explorer…" },
        { id: "c-sudo", builtin: "sudo", name: "sudo", description: "sudo hire ehsan", reply: "Permission granted. Opening a channel to {name}…" },
        { id: "c-coffee", builtin: "coffee", name: "coffee", description: "fuel", reply: "☕ Brewing… error 418: I'm a teapot. {name} runs on tea and curiosity." },
        { id: "c-joke", builtin: "joke", name: "joke", description: "a programmer joke", reply: "" },
        { id: "c-clear", builtin: "clear", name: "clear", description: "clear the screen", reply: "" },
        { id: "c-exit", builtin: "exit", name: "exit", description: "close the terminal", reply: "Bye, explorer." },
        { id: "c-hello", builtin: "custom", name: "hello", description: "say hi", reply: "Hi there! Try 'sudo hire ehsan' 😉" },
      ],
    },
  },
};

export function buildDefaultSite(): Site {
  return parseSite(defaultSiteInput);
}
