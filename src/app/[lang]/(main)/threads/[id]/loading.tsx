import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="w-full h-full flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1 shrink-0">
        <Skeleton className="h-8 w-1/2 rounded-lg opacity-20" />
        <Skeleton className="h-6 w-32 rounded-full opacity-20" />
      </div>
      
      <Skeleton className="h-4 w-1/3 mb-4 rounded-lg opacity-20" />
      
      <div className="flex-1 flex flex-col gap-6 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0 opacity-20" />
            <div className="flex-1">
              <Skeleton className="h-32 w-full rounded-xl opacity-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
