import Image from "next/image";
import type { MediaRef } from "@/schema/fields";
import { mediaUrl } from "@/lib/mediaUrl";

/**
 * Images are already resized + WebP-encoded at upload time and served from an immutable,
 * CDN-cached URL, so we skip Next's optimizer (`unoptimized`) but keep width/height to
 * reserve space (no layout shift).
 */
export function MediaImage({
  media,
  className,
  priority = false,
  sizes,
  alt,
}: {
  media: MediaRef;
  className?: string;
  priority?: boolean;
  sizes?: string;
  alt?: string;
}) {
  if (!media.key) return null;
  return (
    <Image
      src={mediaUrl(media)}
      alt={alt ?? media.alt}
      width={media.width || 800}
      height={media.height || 800}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
    />
  );
}
