import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface MessageBubbleProps {
  alignRight: boolean;
  lang: string;
  createdAt: string;
  body: string;
  isDeleted?: boolean;
  onDelete?: () => void;
  header: ReactNode;
  children?: ReactNode;
}

export function MessageBubble({ alignRight, lang, createdAt, body, isDeleted, onDelete, header, children }: MessageBubbleProps) {
  const t = useTranslations("Common");
  const confirm = useConfirm();

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: t("confirmAction"),
      description: t("confirmDelete"),
      variant: "destructive"
    });
    if (ok) onDelete();
  };

  return (
    <BubbleGroup className={alignRight ? "items-end" : "items-start"}>
      {header}
      {isDeleted ? (
        <Bubble align={alignRight ? "end" : "start"}>
          <BubbleContent
            className={cn(
              "whitespace-pre-wrap break-words italic",
              alignRight ? "!bg-gold-400/50 !text-stone-950/70" : "!bg-stone-600/50 !text-foreground/70"
            )}
          >
            {t("deletedMessage")}
          </BubbleContent>
        </Bubble>
      ) : (
        <>
          {body && (
            <Bubble align={alignRight ? "end" : "start"}>
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
        </>
      )}
      <div className={cn("flex items-center gap-2 px-1 text-[0.6rem] text-foreground/30", alignRight && "self-end")}>
        <span>{new Date(createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}</span>
        {!isDeleted && onDelete && (
          <button 
            type="button" 
            onClick={handleDelete}
            className="hover:text-red-500 transition-colors"
            title={t("delete")}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </BubbleGroup>
  );
}
