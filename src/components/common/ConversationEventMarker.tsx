import { Lock, LockOpen, Shuffle } from "lucide-react";
import { Marker, MarkerIcon, MarkerContent } from "@/components/ui/marker";

interface ConversationEventMarkerProps {
  type: "CLOSED" | "REOPENED" | "STATUS_CHANGED";
  /** Already translated by the caller — TicketThread and ThreadView pull from different i18n namespaces and apply different anonymization rules, so the label text stays their responsibility. */
  label: string;
  createdAt: string;
  lang: string;
}

/**
 * Close/reopen/status-change event row shared by TicketThread, ReportThread, ApplicationThread, and ThreadView
 * rendered as a Marker instead of a chat bubble, interleaved in the same chronological
 * list via the same Message.type the schema uses for both.
 */
export function ConversationEventMarker({ type, label, createdAt, lang }: ConversationEventMarkerProps) {
  const Icon = type === "CLOSED" ? Lock : type === "REOPENED" ? LockOpen : Shuffle;
  return (
    <Marker variant="separator" className="my-1">
      <MarkerIcon>
        <Icon size={12} />
      </MarkerIcon>
      <MarkerContent>
        {label} · {new Date(createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
      </MarkerContent>
    </Marker>
  );
}
