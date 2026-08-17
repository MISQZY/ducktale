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
      {/* Skipped entirely for a file-only message (empty body — see
          TicketThread/ReportThread's own submitMessage guard, which allows
          sending with no text as long as there's an attachment) — an empty
          Bubble still renders its own padding and BubbleGroup's gap-2 before
          the next child, leaving a blank padded pill above the attachment
          for text that was never there. */}
      {body && (
        <Bubble align={alignRight ? "end" : "start"}>
          {/* Explicit gold/gray here (not the generic default/secondary
              bubbleVariants) so "own message" reads the same unmistakable
              way everywhere this component is used — TicketThread,
              ReportThread, ThreadView — regardless of how --primary/
              --secondary happen to be tuned for the rest of the site.
              Bubble (no `variant` passed) still falls back to cva's own
              "default" variant, which unconditionally paints every
              BubbleContent gold via `*:data-[slot=bubble-content]:bg-primary`
              — a plain class on the element turned out NOT to reliably beat
              that in the generated stylesheet (both sides showing gold was
              exactly this: whichever rule happened to come later in the
              build won, not whichever was "more specific"). `!` forces these
              two to win unconditionally instead of hoping for favorable
              cascade order. */}
          <BubbleContent
            className={cn(
              "whitespace-pre-wrap break-words",
              alignRight ? "!bg-gold-400 !text-stone-950" : "!bg-stone-600 !text-foreground"
            )}
          >
            {body}
          </BubbleContent>
        </Bubble>
      )}
      {children}
      <span className={cn("text-[0.6rem] text-foreground/30 px-1", alignRight && "self-end")}>
        {new Date(createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
      </span>
    </BubbleGroup>
  );
}
