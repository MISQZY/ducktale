import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RULE_SEVERITY_STYLE, type RuleSeverity } from "@/config/site";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";


type Severity = RuleSeverity;

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

function inferSeverity(punishment: string): Severity {
  const p = punishment.toLowerCase();
  if (p.includes("перманент") || p.includes("навсегда")) return "ban-perm";
  if (p.includes("бан"))    return "ban-temp";
  if (p.includes("тюрьм"))  return "prison";
  if (p.includes("откат"))  return "rollback";
  if (p.includes("предупр")) return "warn";
  return "other";
}

// Rule text only ever needs inline formatting — an allowlist is much safer
// here than trying to blocklist every dangerous tag/attribute/protocol.
function sanitizeRuleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["strong", "em", "code", "br"],
    ALLOWED_ATTR: [],
  });
}


function PunishmentBadge({ type, label }: { type: Severity; label: string }) {
  const s = RULE_SEVERITY_STYLE[type];
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
                className={cn("font-mono text-xs whitespace-nowrap", DOCS_TABLE_THEME.textFaint)}
                withRightBorder
              >
                {r.id}
              </DocsTableCell>

              <DocsTableCell
                className={cn(
                  "text-sm leading-relaxed whitespace-normal",
                  `[&_strong]:font-semibold [&_strong]:${DOCS_TABLE_THEME.accent}`,
                  `[&_em]:italic [&_em]:${DOCS_TABLE_THEME.textSoft}`,
                  `[&_code]:rounded [&_code]:${DOCS_TABLE_THEME.codeBg} [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:${DOCS_TABLE_THEME.codeText}`
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