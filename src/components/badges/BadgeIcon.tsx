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

  const iconName = isBadgeIconName(name) ? name : FALLBACK_ICON;
  const importFn = dynamicIconImports[iconName as keyof typeof dynamicIconImports] || dynamicIconImports[FALLBACK_ICON];
    const LucideIcon = dynamic(importFn, { ssr: true, loading: () => <span style={{width: size, height: size, display: 'inline-block'}} /> });
  return (
    // eslint-disable-next-line react-hooks/static-components
    <LucideIcon
      size={size}
      className={className}
      style={style}
    />
  );
}
