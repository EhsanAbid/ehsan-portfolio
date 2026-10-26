import type { MediaRef } from "@/schema/fields";

/** Public URL of an uploaded file (safe to import from client components). */
export const mediaUrl = (ref: Pick<MediaRef, "key"> | string) =>
  `/media/${typeof ref === "string" ? ref : ref.key}`;
