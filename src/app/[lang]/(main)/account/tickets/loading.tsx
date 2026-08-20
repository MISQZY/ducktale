import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 text-primary">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm text-foreground/60">Загрузка данных...</p>
    </div>
  );
}