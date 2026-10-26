import type { Site } from "@/schema/site";

export type LevelInfo = {
  level: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  levelSize: number;
  progress: number; // 0..1 within the current level
};

/**
 * Ehsan's level is *computed* from real content, never typed in:
 * XP = mastered·a + learning·b + completed quests·c + in-progress quests·d + unlocked checkpoints·e.
 * Level = floor(XP / levelSize) + 1. Adding a skill in the admin literally levels him up.
 */
export function computeLevel(site: Site): LevelInfo {
  const r = site.game.xp;
  const skills = site.skills.items;
  const xp =
    skills.filter((s) => s.status === "mastered").length * r.perMastered +
    skills.filter((s) => s.status === "learning").length * r.perLearning +
    site.quests.filter((q) => q.status === "completed").length * r.perCompletedQuest +
    site.quests.filter((q) => q.status === "in-progress").length * r.perInProgressQuest +
    site.journey.filter((c) => !c.locked).length * r.perCheckpoint;
  const levelSize = Math.max(1, r.levelSize);
  const level = Math.floor(xp / levelSize) + 1;
  const titles = site.game.hud.levelTitles;
  const title = titles.length ? titles[Math.min(level - 1, titles.length - 1)] : "";
  const xpIntoLevel = xp % levelSize;
  return { level, title, xp, xpIntoLevel, levelSize, progress: xpIntoLevel / levelSize };
}
