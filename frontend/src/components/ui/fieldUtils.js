import { useId } from "react";

// Shared label/error/hint wiring so Input, Textarea and Select all get the same
// aria-invalid and aria-describedby treatment.
export function useField({ id, error, hint }) {
  const generated = useId();
  const fieldId = id ?? generated;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return {
    fieldId,
    errorId,
    hintId,
    controlProps: {
      id: fieldId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy || undefined,
    },
  };
}

export const fieldClasses = (error) =>
  `focus-ring w-full rounded-2xl border bg-white/80 px-4 text-sm text-slate-800 transition
   placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60
   ${error ? "border-rose-400" : "border-slate-200 hover:border-slate-300"}`;
