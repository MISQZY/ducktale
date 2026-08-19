"use server";

import { saveAttachment, deleteAttachmentFile } from "@/lib/attachments";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { getInitialStatusId } from "@/lib/workflows";
import { isRateLimitedByHeaders } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { isReportCategory } from "@/config/reports";
import {
  getReportViewer,
  canViewReport,
  isReportStaff,
  isReportEditor,
  isReportDeleter,
  REPORT_DESCRIPTION_MAX,
  REPORT_MESSAGE_MAX,
  REPORTED_NAME_MAX,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/reports";


export interface CreateReportResult {
  id: string;
}

const TERMINAL_STATUSES: any[] = ["RESOLVED", "REJECTED"];

export async function createReport(formData: FormData): Promise<CreateReportResult> {
  const viewer = await getReportViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const reportedName = ((formData.get("reportedName") as string | null) ?? "").trim().slice(0, REPORTED_NAME_MAX);
  const category = (formData.get("category") as string | null) ?? "";
  const description = ((formData.get("description") as string | null) ?? "").trim().slice(0, REPORT_DESCRIPTION_MAX);
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  // Description is only required when there's no attachment to carry the
  // report instead — e.g. a screenshot of the violation can stand on its own.
  if (!reportedName || !isReportCategory(category) || (!description && validFiles.length === 0)) {
    throw new Error("Reported player, category, and description are required");
  }

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("report-create", 5, 60 * 60_000)) {
    throw new Error("Too many reports created, try again later");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    attachmentsData.push(await saveAttachment(file));
  }

  const statusId = await getInitialStatusId("REPORT");
  const report = await siteDb.report.create({
    data: {
      statusId,
      reporterId: viewer.id,
      reportedName,
      category,
      messages: {
        create: {
          authorId: viewer.id,
          body: description,
          isAdminReply: false,
          attachments: attachmentsData.length > 0 ? { create: attachmentsData } : undefined,
        },
      },
    },
    select: { id: true },
  });

  revalidatePath(`/${lang}/account/reports`);
  return { id: report.id };
}

export async function sendReportMessage(formData: FormData): Promise<void> {
  const viewer = await getReportViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const reportId = formData.get("reportId") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  const report = await siteDb.report.findUnique({
    where: { id: reportId },
    select: { id: true, reporterId: true, reportedName: true, status: true },
  });
  if (!report || !canViewReport(viewer, report)) throw new Error("Report not found");

  // Terminal statuses reject new messages outright — see the Report model's
  // doc comment for why this differs from Ticket's auto-reopen-on-reply.
  if (TERMINAL_STATUSES.includes(report.status)) {
    throw new Error("This report is closed to new messages");
  }

  // Empty body is fine as long as there's an attachment — matches
  // ReportThread.tsx's own submitMessage guard (!trimmed && files.length === 0).
  const cleanBody = (body || "").trim().slice(0, REPORT_MESSAGE_MAX);
  if (!cleanBody && validFiles.length === 0) throw new Error("Message is required");

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("report-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    attachmentsData.push(await saveAttachment(file));
  }

  const isAdminReply = isReportStaff(viewer) && viewer.id !== report.reporterId;

  await siteDb.$transaction([
    siteDb.message.create({
      data: {
        reportId,
        authorId: viewer.id,
        body: cleanBody,
        isAdminReply,
        attachments: attachmentsData.length > 0 ? { create: attachmentsData } : undefined,
      },
    }),
    // First staff reply on an OPEN report signals "someone's looking at
    // this" — mirrors sendTicketMessage's isAdminReply -> ANSWERED flip.
    // Only fires from OPEN specifically (not IN_REVIEW again) — updateMany's
    // where-clause makes this a no-op once already in review.
    ...(isAdminReply
      ? [siteDb.report.updateMany({ where: { id: reportId }, data: { statusId: await siteDb.workflowStatus.findFirst({ where: { target: "REPORT", isClosed: false, isInitial: false }, select: { id: true } }).then(s => s!.id) } })]
      : []),
  ]);

  if (isAdminReply) {
    await createNotification(report.reporterId, "report_reply", { reportId, reportedName: report.reportedName });
  }

  revalidatePath(`/${lang}/reports/${reportId}`);
  revalidatePath(`/${lang}/account/reports`);
  revalidatePath(`/${lang}/admin/reports`);
}

/**
 * Sets Report.status explicitly — reports-edit only, from any current status
 * (unlike Ticket, RESOLVED/REJECTED don't have to pass through IN_REVIEW
 * first, and reopening a terminal status back to IN_REVIEW is this same
 * function, not a separate toggle). See the Report model's doc comment for
 * the full status semantics.
 */
export async function setany(lang: string, reportId: string, statusId: string): Promise<void> {
  const viewer = await getReportViewer();
  if (!viewer || !isReportEditor(viewer)) throw new Error("Not authorized");

  const report = await siteDb.report.findUnique({ where: { id: reportId }, select: { reporterId: true, reportedName: true } });
  if (!report) throw new Error("Report not found");

  await siteDb.report.update({ where: { id: reportId }, data: { statusId } });

  // Same self-report exclusion sendReportMessage's isAdminReply applies —
  // staff changing the status of their own report doesn't need to be told.
  if (viewer.id !== report.reporterId) {
    const statusObj = await siteDb.workflowStatus.findUnique({ where: { id: statusId } });
    await createNotification(report.reporterId, "report_status_changed", {
      reportId,
      reportedName: report.reportedName,
      status: (statusObj?.name as any)?.en || 'Unknown',
    });
  }

  revalidatePath(`/${lang}/reports/${reportId}`);
  revalidatePath(`/${lang}/admin/reports`);
}

export async function deleteReport(lang: string, reportId: string): Promise<void> {
  const viewer = await getReportViewer();
  if (!viewer || !isReportDeleter(viewer)) throw new Error("Not authorized");

  const attachments = await siteDb.messageAttachment.findMany({
    where: { message: { reportId } },
    select: { path: true },
  });

  // Message/MessageAttachment rows cascade via the schema's onDelete: Cascade.
  await siteDb.report.delete({ where: { id: reportId } });

  await Promise.all(attachments.map((a) => deleteAttachmentFile(a.path).catch(() => {})));

  revalidatePath(`/${lang}/admin/reports`);
  revalidatePath(`/${lang}/account/reports`);
}
