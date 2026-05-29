import { cn } from "@/lib/utils";
import {
  DocsTableRow,
  DocsTableCell,
} from "@/components/ui/docs-table";

function SkeletonCell({ w }: { w: string }) {
  return <div className={cn("h-3 rounded bg-[#BFA246]/10 animate-pulse", w)} />;
}

interface TableSkeletonProps {
  /** Number of skeleton rows to render. */
  rows:       number;
  /** Width tokens for each cell, e.g. ["w-6", "w-28", "w-20"]. */
  cellWidths: string[];
}

/** Renders N skeleton rows matching the column count given in cellWidths. */
export function TableSkeleton({ rows, cellWidths }: TableSkeletonProps) {
  const last = cellWidths.length - 1;
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <DocsTableRow key={i}>
          {cellWidths.map((w, ci) => (
            <DocsTableCell key={ci} withRightBorder={ci < last}>
              <SkeletonCell w={w} />
            </DocsTableCell>
          ))}
        </DocsTableRow>
      ))}
    </>
  );
}