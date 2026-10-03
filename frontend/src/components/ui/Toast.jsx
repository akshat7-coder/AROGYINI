import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const VARIANTS = {
  success: { icon: CheckCircle2, tone: "text-emerald-600", ring: "border-emerald-200" },
  error: { icon: AlertCircle, tone: "text-rose-600", ring: "border-rose-200" },
  info: { icon: Info, tone: "text-indigo-600", ring: "border-indigo-200" },
};

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      // Errors interrupt; the rest are announced politely.
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-60 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
    >
      {toasts.map(({ id, variant, title, message }) => {
        const { icon: Icon, tone, ring } = VARIANTS[variant] ?? VARIANTS.info;
        return (
          <div
            key={id}
            role={variant === "error" ? "alert" : "status"}
            className={`glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 border p-4 ${ring}`}
          >
            <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {title ? <p className="text-sm font-semibold text-slate-800">{title}</p> : null}
              <p className="text-sm text-slate-600">{message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(id)}
              aria-label="Dismiss notification"
              className="focus-ring grid size-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-900/5"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
