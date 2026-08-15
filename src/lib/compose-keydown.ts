import type { KeyboardEvent } from "react";

/**
 * Enter sends, Shift+Enter inserts a newline — Ctrl/Cmd+Enter and IME
 * composition (e.g. typing Cyrillic/CJK through an input method) are left
 * alone so an in-progress composition's confirm keystroke doesn't
 * accidentally submit. Shared by every chat-style message composer
 * (tickets, threads) instead of each redeclaring this handler locally.
 */
export function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, submit: () => void): void {
  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
    e.preventDefault();
    submit();
  }
}
