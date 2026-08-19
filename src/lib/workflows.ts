import { siteDb } from "@/lib/site-db";
import { WorkflowTarget } from ".prisma/site-client";

export async function getInitialStatusId(target: WorkflowTarget): Promise<string> {
  const status = await siteDb.workflowStatus.findFirst({
    where: { target, isInitial: true },
    select: { id: true }
  });
  if (!status) throw new Error(`No initial status configured for ${target}`);
  return status.id;
}

export async function getStatusesForTarget(target: WorkflowTarget) {
  return await siteDb.workflowStatus.findMany({
    where: { target },
    orderBy: { createdAt: 'asc' }
  });
}
