import { useCallback, useState } from "react";
import { CheckCircle2, MapPin, Phone, ShieldAlert, XCircle } from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Pagination from "../../components/admin/Pagination.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/toastContext.js";

const LIMIT = 20;
const STATUSES = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];
const STATUS_TONES = { active: "danger", resolved: "success", cancelled: "neutral" };

const whenOf = (value) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

function EventRow({ event, onResolve }) {
  const sent = event.notifications?.filter((n) => n.status === "sent").length ?? 0;
  const total = event.notifications?.length ?? 0;
  const live = event.status === "active";

  return (
    <article
      className={`rounded-2xl border p-4 ${live ? "border-rose-300 bg-rose-50/70" : "border-white/80 bg-white/70"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[event.status]}>{event.status}</Badge>
            {live ? (
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="bg-safety absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping" />
                <span className="bg-safety relative inline-flex size-2.5 rounded-full" />
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {event.user?.name ?? "Deleted user"}
          </p>
          {event.user?.phone ? (
            <a
              href={`tel:${event.user.phone}`}
              className="focus-ring font-mono inline-flex items-center gap-1 rounded text-xs text-slate-500 hover:underline"
            >
              <Phone className="size-3" aria-hidden="true" />
              {event.user.phone}
            </a>
          ) : null}
          <p className="tnum mt-0.5 text-xs text-slate-500">{whenOf(event.createdAt)}</p>
          {event.message ? (
            <p className="mt-1.5 text-xs text-slate-600 italic">“{event.message}”</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="tnum text-xs text-slate-500">
            {sent} of {total} delivered
          </p>
          <div className="flex gap-2">
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
            {live ? (
              <Button size="sm" onClick={() => onResolve(event)}>
                Resolve
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {total > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {event.notifications.map((notification, index) => (
            <li
              key={`${notification.phone}-${index}`}
              title={notification.error}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs
                ${notification.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            >
              {notification.status === "sent" ? (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ) : (
                <XCircle className="size-3.5" aria-hidden="true" />
              )}
              <span className="font-medium">{notification.name}</span>
              <span className="font-mono opacity-70">{notification.phone}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export default function AdminSos() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(
    () => adminApi.listSosEvents({ page, limit: LIMIT, ...(status ? { status } : {}) }),
    [page, status]
  );

  const { data, loading, error, reload } = useAsync(load);
  const events = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const activeCount = events.filter((event) => event.status === "active").length;

  async function onConfirm() {
    setWorking(true);
    try {
      await adminApi.resolveSosEvent(pending.id);
      toast.success("Event resolved.");
      setPending(null);
      reload();
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader
        title="SOS monitor"
        description="Every alert, newest first. Active ones are highlighted."
        icon={ShieldAlert}
        action={
          activeCount > 0 ? (
            <Badge tone="danger">
              {activeCount} live on this page
            </Badge>
          ) : null
        }
      />

      <div className="mb-4 flex gap-1 rounded-full bg-white/70 p-1" role="group" aria-label="Filter by status">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value || "all"}
            type="button"
            aria-pressed={value === status}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold transition
              ${value === status ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-900/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          {error.message}
        </p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No SOS events"
          description={status ? "Nothing with that status." : "Nobody has triggered an SOS yet."}
        />
      ) : (
        <>
          <div className="space-y-3">
            {events.map((event) => (
              <EventRow key={event.id} event={event} onResolve={setPending} />
            ))}
          </div>
          <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={Boolean(pending)}
        loading={working}
        variant="primary"
        confirmLabel="Resolve"
        title="Resolve this SOS?"
        description="Mark it closed. The user is not texted by this, so check she is safe first."
        onClose={() => setPending(null)}
        onConfirm={onConfirm}
      />
    </Card>
  );
}
