import { useCallback, useEffect, useState } from "react";
import { History, MapPin } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import * as safetyApi from "../../api/safety.js";
import { useSos } from "../../context/sosContext.js";
import { useToast } from "../../context/toastContext.js";

const STATUS_TONES = { active: "danger", resolved: "success", cancelled: "neutral" };

const formatWhen = (value) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function SosHistory() {
  const { activeEvent, close } = useSos();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);

  const reload = useCallback(
    () =>
      safetyApi
        .listSosEvents({ limit: 20 })
        .then(({ data }) => setEvents(data))
        .catch((error) => toast.error(error.message))
        .finally(() => setLoading(false)),
    [toast]
  );

  // Re-fetch when an alert opens or closes, so a status is never shown stale.
  useEffect(() => {
    let active = true;
    safetyApi
      .listSosEvents({ limit: 20 })
      .then(({ data }) => active && setEvents(data))
      .catch((error) => active && toast.error(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [activeEvent?.id, activeEvent?.status, toast]);

  async function onClose(event, cancel) {
    setClosingId(event.id);
    try {
      await close(event.id, cancel ? { cancel: true } : { notify: true });
      toast.success(cancel ? "Alert cancelled." : "Contacts told you are safe.");
      await reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setClosingId(null);
    }
  }

  return (
    <Card as="section">
      <CardHeader title="Your SOS history" description="Every alert you have sent." icon={History} />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={History}
          title="No alerts sent"
          description="If you ever need to, the red SOS button is on every screen."
        />
      ) : (
        <ul className="space-y-2.5">
          {events.map((event) => {
            const sent = event.notifications?.filter((n) => n.status === "sent").length ?? 0;
            const total = event.notifications?.length ?? 0;

            return (
              <li key={event.id} className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">{formatWhen(event.createdAt)}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {sent} of {total} {total === 1 ? "contact" : "contacts"} reached
                    </p>
                    {event.message ? (
                      <p className="mt-1 truncate text-xs text-slate-500 italic">“{event.message}”</p>
                    ) : null}
                  </div>
                  <Badge tone={STATUS_TONES[event.status]}>{event.status}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {event.mapsUrl ? (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-900/10"
                    >
                      <MapPin className="size-3.5" aria-hidden="true" />
                      Location
                    </a>
                  ) : null}

                  {event.status === "active" ? (
                    <>
                      <Button
                        size="sm"
                        loading={closingId === event.id}
                        onClick={() => onClose(event, false)}
                      >
                        I am safe
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={closingId === event.id}
                        onClick={() => onClose(event, true)}
                      >
                        Cancel alert
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
