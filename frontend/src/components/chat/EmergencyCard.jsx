import { Phone, ShieldAlert } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useSos } from "../../context/sosContext.js";

const HELPLINES = [
  { number: "112", label: "Emergency" },
  { number: "181", label: "Women Helpline" },
  { number: "1091", label: "Women Police" },
];

export default function EmergencyCard() {
  const { openModal } = useSos();

  return (
    <div className="mt-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-safety mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-900">If you are in danger right now</p>
          <p className="mt-0.5 text-sm text-rose-800">
            Call 112 first. SOS will text your live location to your emergency contacts and sound a
            siren.
          </p>

          <Button variant="danger" size="sm" onClick={openModal} className="mt-3">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Send SOS now
          </Button>

          <ul className="mt-3 flex flex-wrap gap-2">
            {HELPLINES.map(({ number, label }) => (
              <li key={number}>
                <a
                  href={`tel:${number}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-900 transition hover:bg-rose-100"
                >
                  <Phone className="size-3" aria-hidden="true" />
                  <span className="font-mono tnum">{number}</span>
                  <span className="text-rose-700">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
