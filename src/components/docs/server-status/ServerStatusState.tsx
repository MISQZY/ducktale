import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
}

export function ServerStatusLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn("text-right text-xs text-amber-100/30 animate-pulse", className)}>
      Загрузка...
    </div>
  );
}

export function ServerStatusError({ className }: { className?: string }) {
  return (
    <div className={cn("text-right text-xs text-red-400/60", className)}>
      Недоступно
    </div>
  );
}
