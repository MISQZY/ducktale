"use server";

import { saveAttachment, deleteAttachmentFile } from "@/lib/attachments";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { getInitialStatusId } from "@/lib/workflows";
import { isRateLimitedByHeaders } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { SERVERS } from "@/config/servers";
import {
  getApplicationViewer,
  canViewApplication,
  isApplicationStaff,
  isApplicationEditor,
  isApplicationDeleter,
  APPLICATION_DESCRIPTION_MAX,
  APPLICATION_MESSAGE_MAX,
  APPLICANT_NAME_MAX,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/applications";


export interface CreateApplicationResult {
  id: string;
}

const TERMINAL_STATUSES: any[] = ["ACCEPTED", "REJECTED"];

function isServerId(value: string): boolean {
  return SERVERS.some((s) => s.id === value);
}

export async function createApplication(formData: FormData): Promise<CreateApplicationResult> {
  const viewer = await getApplicationViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const applicantName = ((formData.get("applicantName") as string | null) ?? "").trim().slice(0, APPLICANT_NAME_MAX);
  const serverId = (formData.get("serverId") as string | null) ?? "";
  const description = ((formData.get("description") as string | null) ?? "").trim().slice(0, APPLICATION_DESCRIPTION_MAX);
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  // Unlike Report, description is optional here even with no attachment — a
  // bare nickname+server pair is a complete submission on its own (see the
  // Application model's doc comment in schema.prisma.template).
  if (!applicantName || !isServerId(serverId)) {
    throw new Error("Nickname and server are required");
  }

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("application-create", 5, 60 * 60_000)) {
    throw new Error("Too many applications created, try again later");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    attachmentsData.push(await saveAttachment(file));
  }

  const statusId = await getInitialStatusId("APPLICATION");
  const application = await siteDb.application.create({
    data: {
      statusId,
      applicantId: viewer.id,
      applicantName,
      serverId,
      description: description || null,
      messages:
        description || attachmentsData.length > 0
          ? {
              create: {
                authorId: viewer.id,
                body: description,
                isAdminReply: false,
                attachments: attachmentsData.length > 0 ? { create: attachmentsData } : undefined,
              },
            }
          : undefined,
    },
    select: { id: true },
  });

  revalidatePath(`/${lang}/account/applications`);
  return { id: application.id };
}

export async function sendApplicationMessage(formData: FormData): Promise<void> {
  const viewer = await getApplicationViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const applicationId = formData.get("applicationId") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  const application = await siteDb.application.findUnique({
    where: { id: applicationId },
    select: { id: true, applicantId: true, applicantName: true, status: true },
  });
  if (!application || !canViewApplication(viewer, application)) throw new Error("Application not found");

  // Terminal statuses reject new messages outright — see the Application
  // model's doc comment for why this differs from Ticket's auto-reopen-on-reply.
  if (TERMINAL_STATUSES.includes(application.status)) {
    throw new Error("This application is closed to new messages");
  }

  // Empty body is fine as long as there's an attachment — matches
  // ApplicationThread.tsx's own submitMessage guard (!trimmed && files.length === 0).
  const cleanBody = (body || "").trim().slice(0, APPLICATION_MESSAGE_MAX);
  if (!cleanBody && validFiles.length === 0) throw new Error("Message is required");

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("application-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    attachmentsData.push(await saveAttachment(file));
  }

  const isAdminReply = isApplicationStaff(viewer) && viewer.id !== application.applicantId;

  await siteDb.$transaction([
    siteDb.message.create({
      data: {
        applicationId,
        authorId: viewer.id,
        body: cleanBody,
        isAdminReply,
        attachments: attachmentsData.length > 0 ? { create: attachmentsData } : undefined,
      },
    }),
    // First staff reply on an OPEN application signals "someone's looking at
    // this" — mirrors sendReportMessage's isAdminReply -> IN_REVIEW flip.
    ...(isAdminReply
      ? [siteDb.application.updateMany({ where: { id: applicationId }, data: { statusId: await siteDb.workflowStatus.findFirst({ where: { target: "APPLICATION", isClosed: false, isInitial: false }, select: { id: true } }).then(s => s!.id) } })]
      : []),
  ]);

  if (isAdminReply) {
    await createNotification(application.applicantId, "application_reply", { applicationId, applicantName: application.applicantName });
  }

  revalidatePath(`/${lang}/applications/${applicationId}`);
  revalidatePath(`/${lang}/account/applications`);
  revalidatePath(`/${lang}/admin/applications`);
}

/**
 * Sets Application.status explicitly — applications-edit only, from any
 * current status (unlike Ticket, ACCEPTED/REJECTED don't have to pass
 * through IN_REVIEW first, and reopening a terminal status back to
 * IN_REVIEW is this same function, not a separate toggle). See the
 * Application model's doc comment for the full status semantics.
 */
export async function setany(lang: string, applicationId: string, statusId: string): Promise<void> {
  const viewer = await getApplicationViewer();
  if (!viewer || !isApplicationEditor(viewer)) throw new Error("Not authorized");

  const application = await siteDb.application.findUnique({ where: { id: applicationId }, select: { applicantId: true, applicantName: true } });
  if (!application) throw new Error("Application not found");

  await siteDb.application.update({ where: { id: applicationId }, data: { statusId } });

  // Same self-application exclusion sendApplicationMessage's isAdminReply
  // applies — staff changing the status of their own application doesn't
  // need to be told.
  if (viewer.id !== application.applicantId) {
    const statusObj = await siteDb.workflowStatus.findUnique({ where: { id: statusId } });
    await createNotification(application.applicantId, "application_status_changed", {
      applicationId,
      applicantName: application.applicantName,
      status: (statusObj?.name as any)?.en || 'Unknown',
    });
  }

  revalidatePath(`/${lang}/applications/${applicationId}`);
  revalidatePath(`/${lang}/admin/applications`);
}

export async function deleteApplication(lang: string, applicationId: string): Promise<void> {
  const viewer = await getApplicationViewer();
  if (!viewer || !isApplicationDeleter(viewer)) throw new Error("Not authorized");

  const attachments = await siteDb.messageAttachment.findMany({
    where: { message: { applicationId } },
    select: { path: true },
  });

  // Message/MessageAttachment rows cascade via the schema's onDelete: Cascade.
  await siteDb.application.delete({ where: { id: applicationId } });

  await Promise.all(attachments.map((a) => deleteAttachmentFile(a.path).catch(() => {})));

  revalidatePath(`/${lang}/admin/applications`);
  revalidatePath(`/${lang}/account/applications`);
}
