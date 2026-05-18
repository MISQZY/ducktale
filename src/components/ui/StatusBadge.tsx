"use client";

interface StatusDotProps {
  online: boolean;
  variant?: "compact" | "full";
}

export default function StatusDot({ online, variant = "compact" }: StatusDotProps) {
  const dot = (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        online ? "bg-green-400 animate-pulse" : "bg-red-400"
      }`}
    />
  );

  if (variant === "full") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${online ? "text-green-400" : "text-red-400"}`}>
        {dot}
        {online ? "Онлайн" : "Офлайн"}
      </span>
    );
  }

  return dot;
}