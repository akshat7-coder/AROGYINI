import { ShieldAlert } from "lucide-react";
import { useSos } from "../../context/sosContext.js";

// Floating, bottom-right, on every authenticated page. Sits above the mobile tab bar.
export default function SosButton() {
  const { openModal, isActive } = useSos();

  return (
    <button
      type="button"
      onClick={openModal}
      aria-label={isActive ? "SOS is active, open details" : "Send an emergency SOS"}
      className={`focus-ring bg-safety fixed right-4 bottom-24 z-40 grid size-16 place-items-center rounded-full
        text-white shadow-lg transition hover:scale-105 hover:brightness-110 lg:bottom-6
        ${isActive ? "motion-safe:animate-pulse ring-4 ring-rose-300" : ""}`}
    >
      <ShieldAlert className="size-7" aria-hidden="true" />
      <span className="sr-only">SOS</span>
    </button>
  );
}
