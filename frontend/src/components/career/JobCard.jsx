import { Bookmark, BookmarkCheck, Building2, CheckCircle2, IndianRupee, MapPin } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { formatShort } from "../../lib/dates.js";
import { JOB_TYPE_TONES } from "../../lib/career.js";

export default function JobCard({ job, saved, applied, onToggleSave, onOpen, savingId }) {
  return (
    <article className="glass hover-lift p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={JOB_TYPE_TONES[job.type] ?? "neutral"}>{job.type}</Badge>
            {job.careerBreakFriendly ? <Badge tone="success">Career break friendly</Badge> : null}
            {applied ? (
              <Badge tone="info">
                <CheckCircle2 className="mr-1 inline size-3" aria-hidden="true" />
                Applied
              </Badge>
            ) : null}
          </div>

          <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" aria-hidden="true" />
              {job.company}
            </span>
            {job.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {job.location}
              </span>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleSave(job)}
          disabled={savingId === job.id}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
          className={`focus-ring grid size-11 shrink-0 place-items-center rounded-full transition
            ${saved ? "text-career bg-teal-50" : "text-slate-400 hover:bg-slate-900/5"}
            disabled:opacity-50`}
        >
          {saved ? (
            <BookmarkCheck className="size-5" aria-hidden="true" />
          ) : (
            <Bookmark className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{job.description}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-slate-500">
          {job.salaryRange ? (
            <span className="flex items-center gap-1">
              <IndianRupee className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{job.salaryRange}</span>
            </span>
          ) : null}
          {job.postedAt ? (
            <span className="mt-0.5 block">Posted {formatShort(job.postedAt)}</span>
          ) : null}
        </div>

        <Button variant="secondary" size="sm" onClick={() => onOpen(job)}>
          View details
        </Button>
      </div>
    </article>
  );
}
