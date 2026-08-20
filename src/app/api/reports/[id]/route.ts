/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { getReportViewer, canViewReport, isReportStaff } from "@/lib/reports";
import { resolveReportMessages } from "@/lib/report-data";

/** Polled by ReportThread every few seconds while the tab is visible, same shape as GET /api/tickets/[id]. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getReportViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(req, "report-poll", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const report = await siteDb.report.findUnique({
    where: { id },
    select: { reporterId: true, status: true },
  });

  // Same response whether the report doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a report ID exists to someone who
  // isn't allowed to view it.
  if (!report || !canViewReport(viewer, report)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;
  const afterCreatedAt = since && !Number.isNaN(since.getTime()) ? since : undefined;

  const messages = await resolveReportMessages(id, isReportStaff(viewer), afterCreatedAt);

  const rawTransitions = await siteDb.workflowTransition.findMany({
    where: { fromId: report.status.id },
    include: { to: true },
  });
  
  const { hasResourceRole } = await import("@/config/resource-roles");
  
  const availableTransitions = rawTransitions
    .filter((t) => !t.requiredResourceRole || viewer.isAdmin || hasResourceRole(viewer.roles, t.requiredResourceRole as any))
    .map((t) => t.to);

  return NextResponse.json({
    status: report.status,
    transitions: availableTransitions,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
