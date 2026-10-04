import { useCallback, useState } from "react";
import { Mail, Phone } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Badge from "../ui/Badge.jsx";
import Select from "../ui/Select.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/toastContext.js";
import { APPLICATION_STATUS_TONES } from "../../lib/career.js";
import { formatLong } from "../../lib/dates.js";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicationsDrawer({ job, onClose }) {
  const toast = useToast();
  const load = useCallback(() => adminApi.listJobApplications(job.id, { limit: 50 }), [job.id]);
  const { data, loading, error, reload } = useAsync(load);
  const applications = data?.data ?? [];
  const [savingId, setSavingId] = useState(null);

  async function onStatusChange(application, status) {
    setSavingId(application.id);
    try {
      await adminApi.setApplicationStatus(application.id, status);
      toast.success("Status updated.");
      reload();
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Applications"
      description={`${job.title} at ${job.company}`}
      size="lg"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          {error.message}
        </p>
      ) : applications.length === 0 ? (
        <EmptyState icon={Mail} title="No applications yet" description="Nobody has applied to this role." />
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {application.user?.name ?? "Deleted user"}
                  </p>
                  {application.user?.email ? (
                    <a
                      href={`mailto:${application.user.email}`}
                      className="focus-ring flex items-center gap-1 rounded text-xs text-slate-500 hover:underline"
                    >
                      <Mail className="size-3" aria-hidden="true" />
                      {application.user.email}
                    </a>
                  ) : null}
                  {application.user?.phone ? (
                    <a
                      href={`tel:${application.user.phone}`}
                      className="focus-ring font-mono flex items-center gap-1 rounded text-xs text-slate-500 hover:underline"
                    >
                      <Phone className="size-3" aria-hidden="true" />
                      {application.user.phone}
                    </a>
                  ) : null}
                  {application.user?.city ? (
                    <p className="text-xs text-slate-500">{application.user.city}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={APPLICATION_STATUS_TONES[application.status] ?? "neutral"}>
                    {application.status}
                  </Badge>
                </div>
              </div>

              {application.coverNote ? (
                <p className="mt-3 rounded-2xl bg-white p-3.5 text-xs leading-relaxed text-slate-600 italic">
                  “{application.coverNote}”
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">No cover note.</p>
              )}

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs text-slate-500">Applied {formatLong(application.createdAt)}</p>
                <div className="w-44">
                  <Select
                    label="Set status"
                    options={STATUS_OPTIONS}
                    value={application.status}
                    disabled={savingId === application.id}
                    onChange={(event) => onStatusChange(application, event.target.value)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
