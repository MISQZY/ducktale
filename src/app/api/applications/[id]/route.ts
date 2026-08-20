/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { getApplicationViewer, canViewApplication, isApplicationStaff } from "@/lib/applications";
import { resolveApplicationMessages } from "@/lib/application-data";

/** Polled by ApplicationThread every few seconds while the tab is visible, same shape as GET /api/reports/[id]. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getApplicationViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(req, "application-poll", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const application = await siteDb.application.findUnique({
    where: { id },
    select: { applicantId: true, status: true },
  });

  // Same response whether the application doesn't exist or just isn't this
  // viewer's to see — doesn't confirm an application ID exists to someone
  // who isn't allowed to view it.
  if (!application || !canViewApplication(viewer, application)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;
  const afterCreatedAt = since && !Number.isNaN(since.getTime()) ? since : undefined;

  const messages = await resolveApplicationMessages(id, isApplicationStaff(viewer), afterCreatedAt);

  const rawTransitions = await siteDb.workflowTransition.findMany({
    where: { fromId: application.status.id },
    include: { to: true },
  });
  
  const { hasResourceRole } = await import("@/config/resource-roles");
  
  const availableTransitions = rawTransitions
    .filter((t) => !t.requiredResourceRole || viewer.isAdmin || hasResourceRole(viewer.roles, t.requiredResourceRole as any))
    .map((t) => t.to);

  return NextResponse.json({
    status: application.status,
    transitions: availableTransitions,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
