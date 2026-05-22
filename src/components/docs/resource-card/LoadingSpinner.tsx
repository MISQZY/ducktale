import { memo } from "react";

export const LoadingSpinner = memo(() => (
  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-9 h-9 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"
        role="status"
      />
      <span className="text-amber-400 text-sm font-medium">
        Загрузка...
      </span>
    </div>
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";
