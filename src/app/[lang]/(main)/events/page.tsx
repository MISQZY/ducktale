import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { requirePublicResourceRole } from "@/lib/public-access";
import { resolveServerEvents } from "@/lib/events";
import { EventTimeline } from "@/components/events/EventTimeline";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requirePublicResourceRole(lang, "events-page-view");

  const events = await resolveServerEvents();

  return (
    <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
      <div className="relative z-10 max-w-3xl mx-auto">
        <EventTimeline events={events} maxVisible={50} />
      </div>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Events");
  return { title: t("title") };
}
