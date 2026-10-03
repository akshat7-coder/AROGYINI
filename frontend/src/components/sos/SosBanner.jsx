import { ShieldAlert } from "lucide-react";
import { useSos } from "../../context/sosContext.js";

// Pulsing strip in the top bar while an alert is live.
export default function SosBanner() {
  const { isActive, openModal } = useSos();
  if (!isActive) return null;

  return (
    <button
      type="button"
      onClick={openModal}
      className="focus-ring bg-safety flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
      aria-live="polite"
    >
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-white/70 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2.5 rounded-full bg-white" />
      </span>
      <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
      SOS is active — tap for details
    </button>
  );
}
