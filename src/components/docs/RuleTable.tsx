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

interface Rule {
  id: string;
  rule: string;
  punishment: string;
  severity?: Severity;
}

interface RuleTableProps {
  rules: Rule[];
  className?: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  "warn":      "bg-yellow-900/40 text-yellow-300 border-yellow-700/30",
  "ban-temp":  "bg-orange-900/40 text-orange-300 border-orange-700/30",
  "ban-perm":  "bg-red-900/50 text-red-300 border-red-700/30",
  "prison":    "bg-purple-900/40 text-purple-300 border-purple-700/30",
  "rollback":  "bg-blue-900/40 text-blue-300 border-blue-700/30",
  "other":     "bg-stone-800/60 text-stone-300 border-stone-600/30",
};

/** Автоматически угадывает severity по тексту наказания */
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
            const severity = r.severity ?? inferSeverity(r.punishment);
            return (
              <TableRow
                key={r.id}
                className="border-amber-900/10 hover:bg-amber-500/5 transition-colors"
              >
                <TableCell className="font-mono text-xs text-amber-100/30">{r.id}</TableCell>
                <TableCell
                  className="text-amber-100/80 text-sm"
                  dangerouslySetInnerHTML={{ __html: r.rule }}
                />
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn("text-xs whitespace-nowrap", SEVERITY_STYLES[severity])}
                  >
                    {r.punishment}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}