/* eslint-disable */
import { WorkflowStatusBadge } from "@/components/common/WorkflowStatusBadge";
import { localizedName } from "@/lib/i18n-name";
import { useLocale } from "next-intl";

export function ApplicationStatusBadge({ status, className }: { status: any, className?: string }) {
  const locale = useLocale();
  const color = status?.color || "bg-gray-500 text-white";
  const finalLabel = status?.name ? localizedName(status.name, locale) : "Unknown";
  
  return <WorkflowStatusBadge color={color} label={finalLabel} className={className} />;
}
