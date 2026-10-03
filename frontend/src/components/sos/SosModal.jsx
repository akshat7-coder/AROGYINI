import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
  Volume2,
  XCircle,
} from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Spinner.jsx";
import { useSos } from "../../context/sosContext.js";
import { useToast } from "../../context/toastContext.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";

const COUNTDOWN_SECONDS = 3;

function Countdown({ seconds, onCancel }) {
  return (
    <div className="text-center">
      <div
        className="bg-safety mx-auto grid size-28 place-items-center rounded-full text-white shadow-lg motion-safe:animate-pulse"
        role="timer"
        aria-live="assertive"
        aria-atomic="true"
      >
        <span className="font-mono tnum text-5xl font-bold">{seconds}</span>
      </div>

      <p className="mt-5 text-base font-semibold text-slate-800">
        Alerting your emergency contacts
      </p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-600">
        They will get your live location by SMS. Tap cancel if you did not mean to do this.
      </p>

      <Button variant="secondary" size="lg" onClick={onCancel} className="mt-6 w-full">
        Cancel
      </Button>
    </div>
  );
}

function Sending({ label }) {
  return (
    <div className="py-8 text-center">
      <Spinner className="text-safety mx-auto size-8" label={label} />
      <p className="mt-4 text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}

function NoContacts({ onClose }) {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-3xl bg-amber-50 text-amber-600">
        <UserPlus className="size-7" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-slate-800">No emergency contacts yet</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-600">
        SOS sends an SMS to the people you trust. Add at least one contact so there is someone to
        alert.
      </p>

      <div className="mt-6 space-y-2.5">
        <Link to="/safety" onClick={onClose} className="block">
          <Button size="lg" className="w-full">
            <UserPlus className="size-4" aria-hidden="true" />
            Add a contact
          </Button>
        </Link>
        <a href="tel:112" className="block">
          <Button variant="danger" size="lg" className="w-full">
            <Phone className="size-4" aria-hidden="true" />
            Call 112 now
          </Button>
        </a>
      </div>
    </div>
  );
}

function Failed({ message, onRetry, onClose }) {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-3xl bg-rose-50 text-rose-600">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-slate-800">Could not send the alert</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">{message}</p>

      <div className="mt-6 space-y-2.5">
        <a href="tel:112" className="block">
          <Button variant="danger" size="lg" className="w-full">
            <Phone className="size-4" aria-hidden="true" />
            Call 112 now
          </Button>
        </a>
        <div className="flex gap-2.5">
          <Button variant="secondary" size="lg" onClick={onRetry} className="flex-1">
            Try again
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Delivered({ event, siren, onSafe, onClose, resolving }) {
  const sent = event.notifications?.filter((n) => n.status === "sent") ?? [];
  const failed = event.notifications?.filter((n) => n.status === "failed") ?? [];

  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            {sent.length > 0
              ? `Alert sent to ${sent.length} ${sent.length === 1 ? "contact" : "contacts"}`
              : "Alert recorded"}
          </p>
          <p className="mt-0.5 text-sm text-emerald-800">
            Your live location went out by SMS. Stay on the line with someone if you can.
          </p>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-slate-700">Delivery</h3>
      <ul className="mb-5 space-y-2">
        {(event.notifications ?? []).map((notification, index) => (
          <li
            key={`${notification.phone}-${index}`}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{notification.name}</p>
              <p className="font-mono truncate text-xs text-slate-500">{notification.phone}</p>
            </div>
            {notification.status === "sent" ? (
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Sent
              </span>
            ) : (
              <span
                className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-rose-700"
                title={notification.error}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Failed
              </span>
            )}
          </li>
        ))}
      </ul>

      {failed.length > 0 ? (
        <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          {failed.length} {failed.length === 1 ? "message" : "messages"} could not be delivered.
          Call that person directly if you can.
        </p>
      ) : null}

      <div className="space-y-2.5">
        <a href="tel:112" className="block">
          <Button variant="danger" size="lg" className="w-full">
            <Phone className="size-4" aria-hidden="true" />
            Call 112
          </Button>
        </a>

        {event.mapsUrl ? (
          <a href={event.mapsUrl} target="_blank" rel="noreferrer" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              <MapPin className="size-4" aria-hidden="true" />
              View the location sent
            </Button>
          </a>
        ) : null}

        <Button variant="secondary" size="lg" onClick={siren.toggle} className="w-full">
          {siren.playing ? (
            <>
              <BellOff className="size-4" aria-hidden="true" />
              Stop siren
            </>
          ) : (
            <>
              <Volume2 className="size-4" aria-hidden="true" />
              Start siren
            </>
          )}
        </Button>

        <Button size="lg" loading={resolving} onClick={onSafe} className="w-full">
          <ShieldCheck className="size-4" aria-hidden="true" />
          I am safe now
        </Button>

        <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
          Keep the alert open and close this
        </Button>
      </div>
    </div>
  );
}

// Mounted only while the modal is open, so every open starts from a clean slate and the
// opening stage is decided by the useState initialisers rather than a reset effect.
function SosFlow() {
  const { closeModal, siren, trigger, close, activeEvent, contactCount } = useSos();
  const geolocation = useGeolocation();
  const toast = useToast();

  const resuming = activeEvent?.status === "active";

  // countdown -> locating -> sending -> delivered | no-contacts | failed
  const [stage, setStage] = useState(() => {
    if (resuming) return "delivered";
    return contactCount === 0 ? "no-contacts" : "countdown";
  });
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [event, setEvent] = useState(() => (resuming ? activeEvent : null));
  const [failure, setFailure] = useState(null);
  const [resolving, setResolving] = useState(false);
  const firedRef = useRef(false);

  const send = useCallback(async () => {
    firedRef.current = true;
    setFailure(null);

    try {
      setStage("locating");
      const coords = await geolocation.request();

      setStage("sending");
      const { event: created, alreadyActive } = await trigger(coords);
      setEvent(created);
      setStage("delivered");

      // Siren needs a user gesture; the button tap that opened the modal counts.
      siren.start();
      if (alreadyActive) toast.info("You already had an active SOS, so this reuses it.");
    } catch (error) {
      if (error.code === "NO_CONTACTS") {
        setStage("no-contacts");
        return;
      }
      setFailure(error.message);
      setStage("failed");
    }
  }, [geolocation, trigger, siren, toast]);

  // Tick the countdown, then fire. setState only happens inside the interval callback.
  useEffect(() => {
    if (stage !== "countdown") return;

    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          if (!firedRef.current) send();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // `send` is intentionally omitted: including it would restart the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function onSafe() {
    setResolving(true);
    try {
      await close(event.id, { notify: true });
      toast.success("Your contacts have been told you are safe.");
      closeModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResolving(false);
    }
  }

  const titles = {
    countdown: "Sending SOS",
    locating: "Sending SOS",
    sending: "Sending SOS",
    delivered: "SOS is active",
    "no-contacts": "SOS needs a contact",
    failed: "SOS failed",
  };

  return (
    <Modal
      open
      onClose={closeModal}
      title={titles[stage]}
      description={stage === "delivered" ? "Your contacts have your location." : undefined}
      size="md"
    >
      {stage === "countdown" ? <Countdown seconds={seconds} onCancel={closeModal} /> : null}
      {stage === "locating" ? <Sending label="Finding your location…" /> : null}
      {stage === "sending" ? <Sending label="Alerting your contacts…" /> : null}
      {stage === "no-contacts" ? <NoContacts onClose={closeModal} /> : null}
      {stage === "failed" ? <Failed message={failure} onRetry={send} onClose={closeModal} /> : null}
      {stage === "delivered" && event ? (
        <Delivered
          event={event}
          siren={siren}
          resolving={resolving}
          onSafe={onSafe}
          onClose={closeModal}
        />
      ) : null}
    </Modal>
  );
}

export default function SosModal() {
  const { modalOpen } = useSos();
  if (!modalOpen) return null;
  return <SosFlow />;
}
