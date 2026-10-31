import { TODO } from "./fields";
import { richFromText } from "./rich";
import { parseSite, type Site, type SiteInput } from "./site";

/**
 * Default content for the first published version (used by the seed).
 * Scalar defaults live in the schema itself; this file fills the lists.
 * Anything personal that we don't know yet is a TODO_EHSAN placeholder —
 * the admin dashboard lists every one of them. Projects start empty on purpose:
 * only real work you add in the admin flies through the 3D view.
 */

const T = (what: string) => `${TODO}: ${what}`;

export const defaultSiteInput: SiteInput = {
  profile: {
    bio: richFromText(
      T("3–5 sentences about you — who you are, what you study at EWU, what you like building and what kind of engineer you want to become."),
    ),
    jokes: [
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "There are 10 kinds of people: those who understand binary and those who don't.",
      "I'd tell you a UDP joke, but you might not get it.",
    ],
  },

  works: [],

  skills: {
    branches: [
      { id: "programming", name: "Programming" },
      { id: "web", name: "Web" },
      { id: "cs", name: "CS fundamentals" },
      { id: "tools", name: "Tools" },
    ],
    items: [
      { id: "c", name: "C", branchId: "programming", status: "learning" },
      { id: "cpp", name: "C++", branchId: "programming", status: "learning" },
      { id: "python", name: "Python", branchId: "programming", status: "learning" },
      { id: "java", name: "Java", branchId: "programming", status: "locked" },
      { id: "html-css", name: "HTML & CSS", branchId: "web", status: "learning" },
      { id: "js", name: "JavaScript", branchId: "web", status: "learning" },
      { id: "react", name: "React", branchId: "web", status: "locked" },
      { id: "ds", name: "Data Structures", branchId: "cs", status: "learning" },
      { id: "algo", name: "Algorithms", branchId: "cs", status: "locked" },
      { id: "git", name: "Git & GitHub", branchId: "tools", status: "learning" },
    ],
  },

  journey: [
    { id: "school", date: T("year"), title: "School", description: T("your school") },
    { id: "college", date: T("year"), title: "College", description: T("your college") },
    { id: "ewu", date: T("year"), title: "Joined EWU CSE", description: "Started a BSc in Computer Science & Engineering at East West University." },
    { id: "website", date: "2026", title: "This website", description: "Launched my portfolio." },
  ],

  socials: [
    { id: "linkedin", kind: "linkedin", label: "LinkedIn", url: T("https://www.linkedin.com/in/your-profile") },
    { id: "github", kind: "github", label: "GitHub", url: T("https://github.com/your-username") },
    { id: "email", kind: "email", label: "Email", url: T("mailto:your-public-email") },
  ],

  terminal: {
    commands: [
      { id: "c-help", builtin: "help", name: "help", description: "list commands", reply: "Available commands:" },
      { id: "c-whoami", builtin: "whoami", name: "whoami", description: "who is this?", reply: "{name} — {role}." },
      { id: "c-about", builtin: "about", name: "about", description: "short bio", reply: "" },
      { id: "c-skills", builtin: "skills", name: "skills", description: "skills by status", reply: "Skills:" },
      { id: "c-projects", builtin: "projects", name: "projects", description: "project list", reply: "Projects:" },
      { id: "c-open", builtin: "open", name: "open", description: "open <name> — jump to a project", reply: "Opening…" },
      { id: "c-cv", builtin: "cv", name: "cv", description: "download CV", reply: "Downloading CV…" },
      { id: "c-contact", builtin: "contact", name: "contact", description: "how to reach me", reply: "Opening contact…" },
      { id: "c-socials", builtin: "socials", name: "socials", description: "links", reply: "Find {name} here:" },
      { id: "c-sudo", builtin: "sudo", name: "sudo", description: "sudo hire ehsan", reply: "Permission granted. Opening a channel to {name}…" },
      { id: "c-coffee", builtin: "coffee", name: "coffee", description: "fuel", reply: "☕ error 418: I'm a teapot. {name} runs on tea and curiosity." },
      { id: "c-joke", builtin: "joke", name: "joke", description: "a programmer joke", reply: "" },
      { id: "c-clear", builtin: "clear", name: "clear", description: "clear the screen", reply: "" },
      { id: "c-exit", builtin: "exit", name: "exit", description: "close the terminal", reply: "Bye." },
    ],
  },
};

export function buildDefaultSite(): Site {
  return parseSite(defaultSiteInput);
}
