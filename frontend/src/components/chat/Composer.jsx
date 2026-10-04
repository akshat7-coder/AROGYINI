import { useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "../../lib/chat.js";

export default function Composer({ value, onChange, onSend, sending, autoFocusKey }) {
  const textareaRef = useRef(null);

  // Focus when a starter or an "Ask assistant" hand-off fills the box.
  useEffect(() => {
    if (autoFocusKey) textareaRef.current?.focus();
  }, [autoFocusKey]);

  const trimmed = value.trim();
  const tooLong = value.length > MAX_MESSAGE_LENGTH;
  const canSend = trimmed.length > 0 && !tooLong && !sending;

  function onKeyDown(event) {
    // Enter sends, Shift+Enter makes a new line.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
      className="glass-strong p-3"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          aria-label="Your message"
          aria-invalid={tooLong || undefined}
          placeholder="Ask about your health, your rights, work or safety…"
          className={`focus-ring max-h-40 min-h-[3.25rem] flex-1 resize-y rounded-2xl border bg-white/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500
            ${tooLong ? "border-rose-400" : "border-slate-200 hover:border-slate-300"}`}
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="focus-ring bg-brand-600 grid size-13 shrink-0 place-items-center rounded-2xl text-white transition hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-40"
        >
          <SendHorizontal className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] text-slate-500">
          Enter to send, Shift and Enter for a new line.
        </p>
        <p
          className={`tnum text-[11px] font-medium ${tooLong ? "text-rose-600" : "text-slate-500"}`}
          aria-live={tooLong ? "polite" : "off"}
        >
          {value.length} / {MAX_MESSAGE_LENGTH}
        </p>
      </div>
    </form>
  );
}
