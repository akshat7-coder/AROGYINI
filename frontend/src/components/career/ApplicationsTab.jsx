import { Building2, FileCheck2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { formatLong } from "../../lib/dates.js";
import { APPLICATION_STATUS_TONES as STATUS_TONES } from "../../lib/career.js";

const STATUS_NOTES = {
  submitted: "Sent. The employer has not looked at it yet.",
  reviewed: "The employer has opened your application.",
  accepted: "You have been accepted. Expect to hear from them.",
  rejected: "Not this time. Keep going.",
};

export default function ApplicationsTab({ applications, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileCheck2}
          title="No applications yet"
          description="When you apply to a role, it appears here with its status."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => {
        const job = application.job;

        return (
          <article key={application.id} className="glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  {job?.title ?? "This role is no longer listed"}
                </h3>
                {job?.company ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Building2 className="size-3.5" aria-hidden="true" />
                    {job.company}
                  </p>
                ) : null}
              </div>
              <Badge tone={STATUS_TONES[application.status] ?? "neutral"}>{application.status}</Badge>
            </div>

            <p className="mt-2.5 text-sm text-slate-600">{STATUS_NOTES[application.status]}</p>

            {application.coverNote ? (
              <p className="mt-3 line-clamp-3 rounded-2xl bg-white/70 p-3.5 text-xs leading-relaxed text-slate-600 italic">
                “{application.coverNote}”
              </p>
            ) : null}

            <p className="mt-3 text-xs text-slate-500">
              Applied on {formatLong(application.createdAt)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
