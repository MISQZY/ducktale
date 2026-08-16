import { Lock, LockOpen } from "lucide-react";
import { Marker, MarkerIcon, MarkerContent } from "@/components/ui/marker";

interface ConversationEventMarkerProps {
  type: "CLOSED" | "REOPENED";
  /** Already translated by the caller — TicketThread and ThreadView pull from different i18n namespaces and apply different anonymization rules, so the label text stays their responsibility. */
  label: string;
  createdAt: string;
  lang: string;
}

/**
 * Close/reopen event row shared by TicketThread and ThreadView — rendered as
 * a Marker instead of a chat bubble, interleaved in the same chronological
 * list via the same Message.type the schema uses for both (see its doc
 * comment).
 */
export function ConversationEventMarker({ type, label, createdAt, lang }: ConversationEventMarkerProps) {
  const Icon = type === "CLOSED" ? Lock : LockOpen;
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
