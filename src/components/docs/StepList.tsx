import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Step {
  id?: string;
  title: string;
  children: ReactNode;
}

interface StepListProps {
  steps: Step[];
  className?: string;
}

interface StepItemProps {
  number: number;
  title: string;
  isLast: boolean;
  children: ReactNode;
}

function StepItem({ number, title, isLast, children }: StepItemProps) {
  return (
    <div className="relative flex gap-5">
      <div className="relative flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                        border border-gold-500/40 bg-linear-to-b from-gold-900/60 to-stone-900/80
                        text-sm font-bold text-gold-400 font-mono z-10 relative
                        shadow-[0_0_12px_rgba(212,160,23,0.1)]">
          {number}
        </div>
        {!isLast && (
          <div className="absolute top-8 bottom-0 w-px bg-linear-to-b from-gold-500/30 to-transparent" />
        )}
      </div>

      <div className="pb-10 flex-1 min-w-0">
        <h3 className="font-semibold text-amber-100/90 mb-2 leading-8 mt-0!"
            style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem" }}>{title}</h3>
        <div className="text-amber-100/60 text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-2">
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
        <StepItem
          key={step.id ?? step.title}
          number={i + 1}
          title={step.title}
          isLast={i === steps.length - 1}
        >
          {step.children}
        </StepItem>
      ))}
    </div>
  );
}
