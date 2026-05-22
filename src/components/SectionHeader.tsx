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
      <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-3">{label}</p>
      <h2
        className="text-4xl md:text-5xl text-amber-100 mb-4"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <GoldDivider className="mb-8" />
      {description && (
        <p className="text-amber-100/60 max-w-2xl mx-auto leading-relaxed text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
