import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";


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


const SEVERITY: Record<Severity, { badge: string; dot: string }> = {
  warn:      { dot: "bg-[#FFCA28]", badge: "bg-[#2a2415] text-[#FFE289] border-[#BFA246]/30" },
  "ban-temp":{ dot: "bg-[#BFA246]", badge: "bg-[#241d12] text-[#FFF0B8] border-[#BFA246]/24" },
  "ban-perm":{ dot: "bg-[#A6800D]", badge: "bg-[#21160d] text-[#FFE289] border-[#A6800D]/26" },
  prison:    { dot: "bg-[#8f79c9]", badge: "bg-[#211a2a] text-[#E9DBFF] border-[#8f79c9]/26" },
  rollback:  { dot: "bg-[#6ea8ff]", badge: "bg-[#17212b] text-[#DCEBFF] border-[#6ea8ff]/24" },
  other:     { dot: "bg-[#FFD75E]", badge: "bg-[#241f16] text-[#FFF0B8] border-[#BFA246]/26" },
};


function inferSeverity(punishment: string): Severity {
  const p = punishment.toLowerCase();
  if (p.includes("перманент") || p.includes("навсегда")) return "ban-perm";
  if (p.includes("бан"))    return "ban-temp";
  if (p.includes("тюрьм"))  return "prison";
  if (p.includes("откат"))  return "rollback";
  if (p.includes("предупр")) return "warn";
  return "other";
}

function sanitizeRuleHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/href="javascript:[^"]*"/gi, "");
}


function PunishmentBadge({ type, label }: { type: Severity; label: string }) {
  const s = SEVERITY[type];
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-normal shadow-none border",
        s.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
      {label}
    </Badge>
  );
}

function GradedPunishments({ punishments }: { punishments: Punishment[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {punishments.map((p) => (
        <div key={p.grade} className="flex items-center gap-2">
          <span className={cn("w-4 shrink-0 text-right font-mono text-[11px] select-none", DOCS_TABLE_THEME.textFaint)}>
            {p.grade}×
          </span>
          <PunishmentBadge type={p.type} label={p.label} />
        </div>
      ))}
    </div>
  );
}


export function RuleTable({ rules, className }: RuleTableProps) {
  return (
    <DocsTable wrapperClassName={className}>
      <DocsTableHeader>
        <DocsTableRow>
          <DocsTableHead className="w-14" withRightBorder>№</DocsTableHead>
          <DocsTableHead withRightBorder>Правило</DocsTableHead>
          <DocsTableHead className="w-56">Наказание</DocsTableHead>
        </DocsTableRow>
      </DocsTableHeader>

      <DocsTableBody className="[&_tr:last-child]:border-0">
        {rules.map((r) => {
          const hasGrades = Array.isArray(r.punishments) && r.punishments.length > 0;
          const singleSeverity = r.severity ?? inferSeverity(r.punishment ?? "");

          return (
            <DocsTableRow key={r.id}>
              <DocsTableCell
                className="font-mono text-xs whitespace-nowrap"
                style={{ color: `color-mix(in srgb, #FFE289 42%, transparent)` }}
                withRightBorder
              >
                {r.id}
              </DocsTableCell>

              <DocsTableCell
                className={cn(
                  "text-sm leading-relaxed whitespace-normal",
                  "[&_strong]:font-semibold [&_strong]:text-[#FFE289]",
                  "[&_em]:italic [&_em]:text-[#FFF4CC]/68",
                  "[&_code]:rounded [&_code]:bg-[#201b12] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#FFCA28]"
                )}
                withRightBorder
                dangerouslySetInnerHTML={{ __html: sanitizeRuleHtml(r.rule) }}
              />

              <DocsTableCell>
                {hasGrades ? (
                  <GradedPunishments punishments={r.punishments!} />
                ) : (
                  <PunishmentBadge type={singleSeverity} label={r.punishment ?? ""} />
                )}
              </DocsTableCell>
            </DocsTableRow>
          );
        })}
      </DocsTableBody>
    </DocsTable>
  );
}