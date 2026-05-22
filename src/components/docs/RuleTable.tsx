import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Severity = "warn" | "ban-temp" | "ban-perm" | "prison" | "rollback" | "other";

interface Punishment {
  grade: number;
  type: Severity;
  label: string;
}

interface Rule {
  id: string;
  rule: string;
  punishments?: Punishment[];
  punishment?: string;
  severity?: Severity;
}

interface RuleTableProps {
  rules: Rule[];
  className?: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  "warn":     "bg-yellow-900/40 text-yellow-300 border-yellow-700/30",
  "ban-temp": "bg-orange-900/40 text-orange-300 border-orange-700/30",
  "ban-perm": "bg-red-900/50 text-red-300 border-red-700/30",
  "prison":   "bg-purple-900/40 text-purple-300 border-purple-700/30",
  "rollback": "bg-blue-900/40 text-blue-300 border-blue-700/30",
  "other":    "bg-stone-800/60 text-stone-300 border-stone-600/30",
};

function inferSeverity(punishment: string): Severity {
  const p = punishment.toLowerCase();
  if (p.includes("перманент") || p.includes("навсегда")) return "ban-perm";
  if (p.includes("бан"))    return "ban-temp";
  if (p.includes("тюрьм")) return "prison";
  if (p.includes("откат"))  return "rollback";
  if (p.includes("предупр")) return "warn";
  return "other";
}

export function RuleTable({ rules, className }: RuleTableProps) {
  return (
    <div className={cn("rounded-xl border border-amber-900/20 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-amber-900/20 hover:bg-transparent bg-duck-stone/60">
            <TableHead className="text-amber-400/70 w-16">№</TableHead>
            <TableHead className="text-amber-400/70">Правило</TableHead>
            <TableHead className="text-amber-400/70 text-right">Наказание</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => {
            const hasGrades = Array.isArray(r.punishments) && r.punishments.length > 0;

            return (
              <TableRow
                key={r.id}
                className="border-amber-900/10 hover:bg-amber-500/5 transition-colors align-top"
              >
                <TableCell className="font-mono text-xs text-amber-100/30 pt-3">{r.id}</TableCell>
                <TableCell
                  className="text-amber-100/80 text-sm pt-3"
                  dangerouslySetInnerHTML={{ __html: r.rule }}
                />
                <TableCell className="text-left pt-2 pb-2">
                  {hasGrades ? (
                    <div className="flex flex-col gap-1 items-start">
                      {r.punishments!.map((p) => (
                        <div key={p.grade} className="flex items-center gap-2">
                          <span className="text-xs text-amber-100/30 font-mono shrink-0">
                            {p.grade}×
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-xs whitespace-nowrap", SEVERITY_STYLES[p.type])}
                          >
                            {p.label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs whitespace-nowrap",
                        SEVERITY_STYLES[r.severity ?? inferSeverity(r.punishment ?? "")]
                      )}
                    >
                      {r.punishment}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}