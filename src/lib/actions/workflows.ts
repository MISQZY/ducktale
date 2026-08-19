"use server";

import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import type { WorkflowTarget } from ".prisma/site-client";

export async function createWorkflowStatus(lang: string, target: WorkflowTarget, data: {
  name: Record<string, string>;
  color: string;
  icon?: string | null;
  isInitial: boolean;
  isClosed: boolean;
}) {
  await requireResourceRoleId("workflows-edit");

  if (data.isInitial) {
    await siteDb.workflowStatus.updateMany({
      where: { target, isInitial: true },
      data: { isInitial: false }
    });
  }

  await siteDb.workflowStatus.create({
    data: {
      target,
      name: data.name,
      color: data.color,
      icon: data.icon,
      isInitial: data.isInitial,
      isClosed: data.isClosed
    }
  });
  revalidatePath(`/${lang}/admin/workflows`);
}

export async function updateWorkflowStatus(lang: string, id: string, data: {
  name: Record<string, string>;
  color: string;
  icon?: string | null;
  isInitial: boolean;
  isClosed: boolean;
}) {
  await requireResourceRoleId("workflows-edit");

  const status = await siteDb.workflowStatus.findUnique({ where: { id } });
  if (!status) throw new Error("Status not found");

  if (data.isInitial) {
    await siteDb.workflowStatus.updateMany({
      where: { target: status.target, isInitial: true, id: { not: id } },
      data: { isInitial: false }
    });
  }

  await siteDb.workflowStatus.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      isInitial: data.isInitial,
      isClosed: data.isClosed
    }
  });
  revalidatePath(`/${lang}/admin/workflows`);
}

export async function deleteWorkflowStatus(lang: string, id: string) {
  await requireResourceRoleId("workflows-delete");

  const status = await siteDb.workflowStatus.findUnique({ where: { id } });
  if (!status) throw new Error("Status not found");

  if (status.isInitial) {
    throw new Error("Cannot delete the initial status.");
  }

  await siteDb.workflowStatus.delete({ where: { id } });
  revalidatePath(`/${lang}/admin/workflows`);
}

export async function addWorkflowTransition(lang: string, fromId: string, toId: string, role?: string) {
  await requireResourceRoleId("workflows-edit");

  await siteDb.workflowTransition.create({
    data: {
      fromId,
      toId,
      requiredResourceRole: role || null
    }
  });
  revalidatePath(`/${lang}/admin/workflows`);
}

export async function removeWorkflowTransition(lang: string, id: string) {
  await requireResourceRoleId("workflows-edit");

  await siteDb.workflowTransition.delete({ where: { id } });
  revalidatePath(`/${lang}/admin/workflows`);
}
