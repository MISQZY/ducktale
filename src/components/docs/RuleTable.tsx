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
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">№</TableHead>
          <TableHead>Правило</TableHead>
          <TableHead className="text-right">Наказание</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rules.map((r) => {
          const hasGrades =
            Array.isArray(r.punishments) && r.punishments.length > 0;

          return (
            <TableRow key={r.id}>
              <TableCell className="align-top font-mono text-xs text-muted-foreground">
                {r.id}
              </TableCell>

              <TableCell
                className="align-top text-sm"
                dangerouslySetInnerHTML={{ __html: r.rule }}
              />

              <TableCell className="align-top text-right">
                {hasGrades ? (
                  <div className="flex flex-col items-start gap-1">
                    {r.punishments!.map((p) => (
                      <div key={p.grade} className="flex items-center gap-2">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {p.grade}×
                        </span>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs whitespace-nowrap",
                            SEVERITY_STYLES[p.type]
                          )}
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
                      SEVERITY_STYLES[
                        r.severity ?? inferSeverity(r.punishment ?? "")
                      ]
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
  );
}