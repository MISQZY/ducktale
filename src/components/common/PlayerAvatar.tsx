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
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm truncate transition-colors",
              linked
                ? "font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-500 dark:group-hover:text-amber-300"
                : "font-medium text-foreground/70 group-hover:text-foreground/90",
              !hasSiteProfile && "italic"
            )}
          >
            {nameNode ?? displayName}
          </span>
          {appendNode}
        </div>
      </div>
    </>
  );

  if (canClick) {
    return (
      <Link
        href={linkHref}
        target="_blank"
        className={cn("flex items-center gap-3 hover:opacity-80 transition-opacity group transform-gpu", className)}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {innerContent}
    </div>
  );
}
