import { useState } from "react";
import { Droplets, History, Pencil, Trash2 } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import Modal from "../ui/Modal.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import * as healthApi from "../../api/health.js";
import { useToast } from "../../context/toastContext.js";
import { daysBetween, formatLong, formatShort } from "../../lib/dates.js";
import { FLOW_TONES } from "../../lib/cycle.js";

export default function CycleHistory({ logs, loading, onEdit, onChanged }) {
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await healthApi.deleteCycle(pendingDelete.id);
      toast.success("Period removed.");
      setPendingDelete(null);
      onChanged();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader title="Your log" description="Everything you have recorded." icon={History} />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Droplets}
          title="Nothing logged yet"
          description="Log your first period and predictions start from there."
        />
      ) : (
        <ul className="space-y-2.5">
          {logs.map((log) => {
            const length = log.endDate ? daysBetween(log.startDate, log.endDate) + 1 : null;

            return (
              <li key={log.id} className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatLong(log.startDate)}
                      {log.endDate ? ` – ${formatShort(log.endDate)}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {length ? `${length} ${length === 1 ? "day" : "days"}` : "Still going"}
                      {log.mood ? ` · feeling ${log.mood}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Badge tone={FLOW_TONES[log.flow] ?? "neutral"}>{log.flow}</Badge>
                    <button
                      type="button"
                      aria-label={`Edit the period starting ${formatLong(log.startDate)}`}
                      onClick={() => onEdit(log)}
                      className="focus-ring grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete the period starting ${formatLong(log.startDate)}`}
                      onClick={() => setPendingDelete(log)}
                      className="focus-ring grid size-10 place-items-center rounded-full text-rose-500 transition hover:bg-rose-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {log.symptoms?.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {log.symptoms.map((symptom) => (
                      <li
                        key={symptom}
                        className="rounded-full bg-slate-900/5 px-2.5 py-1 text-xs text-slate-600 capitalize"
                      >
                        {symptom}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {log.notes ? (
                  <p className="mt-2.5 text-xs text-slate-500 italic">“{log.notes}”</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this period?"
        description="Your averages and predictions will be recalculated without it."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep
            </Button>
            <Button variant="danger" loading={deleting} onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      />
    </Card>
  );
}
