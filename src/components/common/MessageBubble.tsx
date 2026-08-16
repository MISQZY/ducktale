import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";

interface MessageBubbleProps {
  alignRight: boolean;
  lang: string;
  createdAt: string;
  body: string;
  /**
   * The avatar/name row above the bubble — a PlayerAvatar for an identified
   * author, or a stand-in like TicketThread's anonymized "Administrator"
   * label. Left fully to the caller since who/how to render it (staff
   * suffix, anonymization, multi-party names) differs per thread type.
   */
  header: ReactNode;
  /** Extra content below the bubble text — e.g. TicketThread's attachments. */
  children?: ReactNode;
}

/**
 * The message-bubble + timestamp block shared by TicketThread and
 * ThreadView — identical in both, only the header slot and alignment rule
 * (staff-vs-owner in tickets, author-vs-viewer in threads) differ, so those
 * stay with each caller rather than being folded in here.
 */
export function MessageBubble({ alignRight, lang, createdAt, body, header, children }: MessageBubbleProps) {
  return (
    <BubbleGroup className={alignRight ? "items-end" : "items-start"}>
      {header}
      <Bubble align={alignRight ? "end" : "start"} variant={alignRight ? "default" : "secondary"}>
        <BubbleContent className="whitespace-pre-wrap break-words">
          {body}
        </BubbleContent>
      </Bubble>
      {children}
      <span className={cn("text-[0.6rem] text-foreground/30 px-1", alignRight && "self-end")}>
        {new Date(createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
      </span>
    </BubbleGroup>
  );
}
