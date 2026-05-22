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
  children: ReactNode;
}

function StepItem({ number, title, children }: StepProps) {
  return (
    <div className="relative flex gap-4">
      {/* Connector line (except for last item — handled by CSS) */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-950/40 text-sm font-bold text-amber-400 font-mono z-10">
          {number}
        </div>
        <div className="step-line mt-1 w-px flex-1 bg-amber-900/30" />
      </div>

      <div className="pb-8 flex-1 min-w-0">
        <h3 className="font-semibold text-amber-100 mb-2 mt-0.5">{title}</h3>
        <div className="text-amber-100/70 text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * StepList.
 *
 * Usage in MDX:
 * ```mdx
 * <StepList steps={[
 *   { title: "Установите лаунчер", children: <p>Скачайте TLauncher...</p> },
 *   { title: "Подключитесь к серверу", children: <ServerAddress /> },
 * ]} />
 * ```
 */
export function StepList({ steps, className }: StepListProps) {
  return (
    <div className={cn("mt-4 [&_.step-line:last-of-type]:hidden", className)}>
      {steps.map((step, i) => (
        <StepItem key={i} number={i + 1} title={step.title}>
          {step.children}
        </StepItem>
      ))}
    </div>
  );
}