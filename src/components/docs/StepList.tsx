import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Step {
  title: string;
  children: ReactNode;
}

interface StepListProps {
  steps: Step[];
  className?: string;
}

interface StepProps {
  number: number;
  title: string;
  isLast: boolean;
  children: ReactNode;
}

function StepItem({ number, title, isLast, children }: StepProps) {
  return (
    <div className="relative flex gap-4">
      {/* Circle + line column */}
      <div className="relative flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-950/40 text-sm font-bold text-amber-400 font-mono z-10 relative">
          {number}
        </div>
        {!isLast && (
          <div className="absolute top-8 bottom-0 w-px bg-amber-500/40" />
        )}
      </div>

      <div className="pb-10 flex-1 min-w-0 step-item-content">
        <h3 className="font-semibold text-amber-100 mb-2 leading-8">
          {title}
        </h3>
        <div className="text-amber-100/70 text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StepList({ steps, className }: StepListProps) {
  return (
    <div className={cn("mt-4", className)}>
      {steps.map((step, i) => (
        <StepItem key={i} number={i + 1} title={step.title} isLast={i === steps.length - 1}>
          {step.children}
        </StepItem>
      ))}
    </div>
  );
}