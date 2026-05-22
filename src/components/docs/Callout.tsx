import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, XOctagon, Lightbulb, Sword } from "lucide-react";
import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "danger" | "tip" | "lore";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const CONFIG: Record<
  CalloutVariant,
  { icon: typeof Info; containerCn: string; titleCn: string; iconCn: string }
> = {
  info: {
    icon: Info,
    containerCn: "border-blue-700/30 bg-blue-950/20",
    titleCn: "text-blue-300",
    iconCn: "text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    containerCn: "border-amber-600/40 bg-amber-950/20",
    titleCn: "text-amber-300",
    iconCn: "text-amber-400",
  },
  danger: {
    icon: XOctagon,
    containerCn: "border-red-700/40 bg-red-950/20",
    titleCn: "text-red-300",
    iconCn: "text-red-400",
  },
  tip: {
    icon: Lightbulb,
    containerCn: "border-green-700/30 bg-green-950/20",
    titleCn: "text-green-300",
    iconCn: "text-green-400",
  },
  lore: {
    icon: Sword,
    containerCn: "border-amber-500/20 bg-amber-950/10",
    titleCn: "text-amber-400",
    iconCn: "text-amber-500",
  },
};

/**
 * Callout.
 *
 * Usage in MDX:
 * ```mdx
 * <Callout variant="warning" title="Осторожно">
 *   Гриферство карается баном.
 * </Callout>
 * ```
 */
export function Callout({ variant = "info", title, children, className }: CalloutProps) {
  const { icon: Icon, containerCn, titleCn, iconCn } = CONFIG[variant];

  return (
    <Alert className={cn("my-4", containerCn, className)}>
      <Icon size={15} className={iconCn} />
      {title && <AlertTitle className={cn("font-semibold", titleCn)}>{title}</AlertTitle>}
      <AlertDescription className="text-amber-100/70 text-sm [&>p]:mt-0">
        {children}
      </AlertDescription>
    </Alert>
  );
}