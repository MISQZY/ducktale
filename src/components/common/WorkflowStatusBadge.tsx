import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function WorkflowStatusBadge({ color, label, className }: { color: string, label: string, className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[0.65rem] uppercase tracking-widest whitespace-nowrap liquid-badge-none",
        className
      )}
      style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}4D` }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full shrink-0" 
        style={{ backgroundColor: color }} 
      />
      {label}
    </Badge>
  );
}
