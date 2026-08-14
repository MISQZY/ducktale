import { Link } from "@/i18n/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface ServerPaginationProps {
  page: number;
  totalPages: number;
  buildQuery: (page: number) => Record<string, string>;
  pathname: string;
  prevText?: string;
  nextText?: string;
}

export function ServerPagination({
  page,
  totalPages,
  buildQuery,
  pathname,
  prevText = "Назад",
  nextText = "Вперед",
}: ServerPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (page <= 3) {
      pages.push(1, 2, 3, 4, "…", totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }
  }

  return (
    <Pagination className="mt-6 w-full mx-0 justify-center">
      <PaginationContent>
        <PaginationItem>
          {page <= 1 ? (
            <Button variant="ghost" disabled className="gap-1 pl-2.5 pointer-events-none opacity-50">
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:block">{prevText}</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" className="gap-1 pl-2.5">
              <Link href={{ pathname, query: buildQuery(page - 1) }}>
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:block">{prevText}</span>
              </Link>
            </Button>
          )}
        </PaginationItem>

        {pages.map((p, i) => (
          <PaginationItem key={p === "…" ? `ellipsis-${i}` : p}>
            {p === "…" ? (
              <PaginationEllipsis />
            ) : (
              <Button
                asChild
                variant={p === page ? "outline" : "ghost"}
                size="icon"
                aria-current={p === page ? "page" : undefined}
              >
                <Link href={{ pathname, query: buildQuery(p as number) }}>{p}</Link>
              </Button>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          {page >= totalPages ? (
            <Button variant="ghost" disabled className="gap-1 pr-2.5 pointer-events-none opacity-50">
              <span className="hidden sm:block">{nextText}</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="ghost" className="gap-1 pr-2.5">
              <Link href={{ pathname, query: buildQuery(page + 1) }}>
                <span className="hidden sm:block">{nextText}</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
