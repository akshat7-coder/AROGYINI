import { Phone, ShieldAlert } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import ContactsManager from "../components/safety/ContactsManager.jsx";
import SirenCard from "../components/safety/SirenCard.jsx";
import FakeCall from "../components/safety/FakeCall.jsx";
import HelplinesGrid from "../components/safety/HelplinesGrid.jsx";
import SosHistory from "../components/safety/SosHistory.jsx";
import { useSos } from "../context/sosContext.js";

export default function Safety() {
  const { openModal, isActive } = useSos();

  return (
    <div className="space-y-5">
      <section className="glass border-rose-200/80 bg-rose-50/70 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="bg-safety grid size-12 shrink-0 place-items-center rounded-2xl text-white">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isActive ? "An SOS is active right now" : "In an emergency"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-700">
                {isActive
                  ? "Your contacts have your location. Open the alert to tell them you are safe."
                  : "Sending an SOS texts your live location to all your emergency contacts and sounds a siren."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:w-48">
            <Button variant="danger" size="lg" onClick={openModal} className="w-full">
              <ShieldAlert className="size-5" aria-hidden="true" />
              {isActive ? "Open alert" : "Send SOS"}
            </Button>
            <a href="tel:112" className="block">
              <Button variant="secondary" size="lg" className="w-full">
                <Phone className="size-4" aria-hidden="true" />
                Call 112
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ContactsManager />
        <div className="space-y-5">
          <SirenCard />
          <FakeCall />
        </div>
      </div>

      <HelplinesGrid />
      <SosHistory />
    </div>
  );
}
