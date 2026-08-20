/* eslint-disable */
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { isBadgeIconName } from "@/config/badges";

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const FALLBACK_ICON = "award";

/**
 * Renders an icon from lucide-react (via next/dynamic for code splitting and SSR)
 * or Gi icons via our API mask.
 */
const dynamicIconCache: Record<string, React.ComponentType<any>> = {};

function getLucideIcon(name: string) {
  const iconName = isBadgeIconName(name) ? name : FALLBACK_ICON;
  if (!dynamicIconCache[iconName]) {
    const importFn = dynamicIconImports[iconName as keyof typeof dynamicIconImports] || dynamicIconImports[FALLBACK_ICON];
    dynamicIconCache[iconName] = dynamic(importFn, { ssr: true });
  }
  return dynamicIconCache[iconName];
}

export function BadgeIcon({ name, size, className, style }: BadgeIconProps) {
  if (name.startsWith("Gi")) {
    return (
      <span 
        className={className} 
        style={{ 
          width: size, 
          height: size, 
          display: "inline-block", 
          backgroundColor: "currentColor", 
          maskImage: `url(/api/icons/${name})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: `url(/api/icons/${name})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          ...style 
        }} 
        title={name} 
      />
    );
  }

  const LucideIcon = getLucideIcon(name);

  return (
    <LucideIcon
      size={size}
      className={className}
      style={style}
    />
  );
}
