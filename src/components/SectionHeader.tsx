import { cn } from "@/lib/utils";
import { GoldDivider } from "@/components/common/GoldDivider";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SectionHeader({
  label,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      <p className="text-gold-500/60 text-xs tracking-[0.4em] uppercase mb-4 flex items-center justify-center gap-3">
        <span className="h-px w-6 bg-linear-to-r from-transparent to-gold-500/40 inline-block" />
        {label}
        <span className="h-px w-6 bg-linear-to-l from-transparent to-gold-500/40 inline-block" />
      </p>

      <h2
        className="text-4xl md:text-5xl text-amber-100/90 mb-5 leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>

      <GoldDivider wide className="mb-7" />

      {description && (
        <p className="text-amber-100/50 max-w-2xl mx-auto leading-relaxed text-lg"
           style={{ fontFamily: "var(--font-body)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
