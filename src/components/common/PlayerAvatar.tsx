import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { presenceDotClass } from "@/lib/presence-ui";
import { useTranslations } from "next-intl";
import { SkinFace } from "@/components/common/SkinFace";
import { Link } from "@/i18n/navigation";

interface PlayerAvatarProps {
  name: string | null;
  skinUrl?: string | null;
  hasSiteProfile?: boolean;
  linked?: boolean;
  online?: boolean;
  siteOnline?: boolean;
  className?: string;
  avatarClassName?: string;
  avatarSize?: number;
  appendNode?: React.ReactNode;
  nameNode?: React.ReactNode;
  /**
   * Whether the name column should flex-grow to fill whatever width its
   * container gives it. Needed inside a fixed-width table cell (so
   * `truncate` has a real width to ellipsize against) — the default, and
   * what every table usage relies on. A free-floating bordered chip
   * (navbar button, homepage marquee card) has no such outer width to fill
   * and should instead hug its own content; leaving this at its default
   * there stretched the whole chip past the text, showing as empty space
   * between the name and the chip's right edge (only on the right, since
   * the name is left-aligned within that overgrown space).
   */
  growName?: boolean;
}

export function PlayerAvatar({
  name,
  skinUrl,
  hasSiteProfile = true,
  linked = hasSiteProfile,
  online = false,
  siteOnline = false,
  className,
  avatarClassName,
  avatarSize = 28,
  appendNode,
  nameNode,
  growName = true,
}: PlayerAvatarProps) {
  const tCard = useTranslations("PlayerCard");
  const displayName = name || "Аноним";
  const firstLetter = displayName.charAt(0).toUpperCase();

  const dotClass = presenceDotClass(online, siteOnline);
  const dotTitle = (online && siteOnline) ? tCard("bothOnline") : online ? tCard("online") : tCard("siteOnline");

  const canClick = hasSiteProfile && name;
  const linkHref = canClick ? `/profile/${encodeURIComponent(name)}` : "";

  const innerContent = (
    <>
      <div className="relative shrink-0 flex items-center justify-center">
        {skinUrl ? (
          <SkinFace skinUrl={skinUrl} size={avatarSize} className={cn("rounded-md", avatarClassName)} />
        ) : (
          <Avatar className={cn("ring-1 ring-inset ring-primary/20", avatarClassName)} style={{ width: avatarSize, height: avatarSize }}>
            <AvatarFallback className="text-sm font-medium">{firstLetter}</AvatarFallback>
          </Avatar>
        )}
        {dotClass && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 shrink-0" title={dotTitle}>
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", online ? "bg-emerald-400" : "bg-blue-400")} />
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full border border-background", dotClass)} />
          </span>
        )}
      </div>
      <div className={cn("flex flex-col min-w-0 justify-center", growName && "flex-1")}>
        <div className="flex items-center gap-1.5 min-w-0">
          {/* nameNode is always a fully self-styled <span> already (its own
              font size/family, truncate, max-w) — every current caller sets
              those itself rather than relying on this wrapper. Nesting it
              inside another span with a *different* text-sm/line-height
              here fought that styling (a caller using a taller display font
              at a larger size than text-sm got vertically clipped by this
              span's own, smaller line box). Only the plain-text fallback
              needs this wrapper's styling at all. */}
          {nameNode ?? (
            <span
              className={cn(
                "text-sm truncate transition-colors",
                linked
                  ? "font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-500 dark:group-hover:text-amber-300"
                  : "font-medium text-foreground/70 group-hover:text-foreground/90",
                !hasSiteProfile && "italic"
              )}
            >
              {displayName}
            </span>
          )}
          {appendNode}
        </div>
      </div>
    </>
  );

  // w-fit when not growing: growName={false} only stops the *inner* name
  // column from stretching, but the outer card/link element (this one) is
  // `display: flex`, which is block-level and — depending on the ancestor
  // it sits in — can itself get stretched wider than its content by a
  // parent flex/grid row, with the extra space showing up as a gap after
  // the name (left-aligned content) before this element's own visible
  // border/background. w-fit (width: fit-content) pins it to its content's
  // width unconditionally, regardless of what the surrounding layout does.
  const widthClass = growName ? undefined : "w-fit";

  if (canClick) {
    return (
      <Link
        href={linkHref}
        target="_blank"
        className={cn("flex items-center gap-3 hover:opacity-80 transition-opacity group transform-gpu", widthClass, className)}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", widthClass, className)}>
      {innerContent}
    </div>
  );
}
