import type { CSSProperties } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { isBadgeIconName } from "@/config/badges";
import * as GiIcons from "react-icons/gi";

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const FALLBACK_ICON = "award";

/**
 * Renders an icon from either lucide-react (via DynamicIcon for code splitting)
 * or react-icons/gi (Game Icons).
 */
export function BadgeIcon({ name, size, className, style }: BadgeIconProps) {
  if (name.startsWith("Gi")) {
    const IconComponent = GiIcons[name as keyof typeof GiIcons];
    if (IconComponent) {
      return <IconComponent size={size} className={className} style={style} />;
    }
  }

  return (
    <DynamicIcon
      name={isBadgeIconName(name) ? (name as keyof typeof import("lucide-react/dynamicIconImports")) : FALLBACK_ICON}
      size={size}
      className={className}
      style={style}
    />
  );
}
