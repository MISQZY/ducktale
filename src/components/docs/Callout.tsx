import { cn } from "@/lib/utils";
import { DuckAlert, DuckAlertDescription, DuckAlertTitle } from "@/components/ui/duck";
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
    titleCn: "text-blue-700 dark:text-blue-300",
    iconCn: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    containerCn: "border-amber-600/40 bg-primary/20",
    titleCn: "text-foreground",
    iconCn: "text-foreground",
  },
  danger: {
    icon: XOctagon,
    containerCn: "border-red-700/40 bg-red-950/20",
    titleCn: "text-red-700 dark:text-red-300",
    iconCn: "text-red-600 dark:text-red-400",
  },
  tip: {
    icon: Lightbulb,
    containerCn: "border-green-700/30 bg-green-950/20",
    titleCn: "text-green-700 dark:text-green-300",
    iconCn: "text-green-600 dark:text-green-400",
  },
  lore: {
    icon: Sword,
    containerCn: "border-amber-500/20 bg-primary/10",
    titleCn: "text-foreground",
    iconCn: "text-foreground",
  },
};


export function Callout({ variant = "info", title, children, className }: CalloutProps) {
  const { icon: Icon, containerCn, titleCn, iconCn } = CONFIG[variant];

  return (
    <DuckAlert className={cn("my-4", containerCn, className)}>
      <Icon size={15} className={iconCn} />
      {title && <DuckAlertTitle className={cn("font-semibold", titleCn)}>{title}</DuckAlertTitle>}
      <DuckAlertDescription className="text-foreground/70 text-sm [&>p]:mt-0">
        {children}
      </DuckAlertDescription>
    </DuckAlert>
  );
}