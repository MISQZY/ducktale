import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Terminal, Shield, AlertCircle } from "lucide-react";

type PermissionLevel = "all" | "old" | "admin";

interface CommandCardProps {
  /** command with slash, like /town create */
  command: string;
  description: string;
  /** args like /town create <name> */
  usage?: string;
  aliases?: string[];
  permission?: PermissionLevel;
  warning?: string;
  className?: string;
}

const PERMISSION_LABELS: Record<PermissionLevel, { label: string; className: string }> = {
  all:   { label: "Все игроки",  className: "bg-green-900/50 text-green-300 border-green-700/30" },
  old:   { label: "Олд",        className: "bg-amber-900/50 text-amber-300 border-amber-700/30" },
  admin: { label: "Администратор", className: "bg-blue-900/50 text-blue-300 border-blue-700/30" },
};

export function CommandCard({
  command,
  description,
  usage,
  aliases,
  permission = "all",
  warning,
  className,
}: CommandCardProps) {
  const perm = PERMISSION_LABELS[permission];

  return (
    <Card
      className={cn(
        "border-amber-900/20 bg-duck-stone/40 hover:border-amber-700/30 transition-colors",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 font-mono text-amber-300 text-base">
            <Terminal size={15} className="text-amber-500/60 shrink-0" />
            {command}
          </CardTitle>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn("gap-1 text-xs cursor-default", perm.className)}
                >
                  <Shield size={10} />
                  {perm.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-amber-900/30 text-amber-100/80">
                Минимальный уровень доступа: {perm.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-amber-100/60">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {usage && (
          <div className="rounded-lg bg-black/40 border border-amber-900/15 px-3 py-2">
            <p className="text-xs text-amber-100/40 mb-1 uppercase tracking-wider">Использование</p>
            <code className="text-sm text-amber-200/80 font-mono">{usage}</code>
          </div>
        )}

        {aliases && aliases.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-100/40">Псевдонимы:</span>
            {aliases.map((a) => (
              <Badge
                key={a}
                variant="secondary"
                className="font-mono text-xs bg-black/30 text-amber-100/50 border border-amber-900/15"
              >
                {a}
              </Badge>
            ))}
          </div>
        )}

        {warning && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">{warning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}