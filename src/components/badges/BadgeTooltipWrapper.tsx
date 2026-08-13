import { HelpCircle } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface BadgeTooltipWrapperProps {
  name: string;
  description: string | null;
  earnCondition: string | null;
  children: ReactNode;
}

export function BadgeTooltipWrapper({ name, description, earnCondition, children }: BadgeTooltipWrapperProps) {
  if (!description && !earnCondition) {
    return <span className="cursor-default">{children}</span>;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default shrink-0">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start gap-1 max-w-64 text-left">
          <p className="font-medium flex items-center gap-1">
            {name}
            {earnCondition && (
              <span title={earnCondition} className="inline-flex shrink-0">
                <HelpCircle size={12} className="text-background/50" />
              </span>
            )}
          </p>
          {description && <p className="text-background/70">{description}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
