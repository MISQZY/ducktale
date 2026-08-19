import { WorkflowStatusBadge } from "@/components/common/WorkflowStatusBadge";
export function ApplicationStatusBadge({ status, label, className }: { status: string, label?: string, className?: string }) {
  const color = status?.color || "bg-gray-500 text-white";
  const finalLabel = label || (status?.name as any)?.en || "Unknown";
  return <WorkflowStatusBadge color={color} label={finalLabel} className={className} />;
}
