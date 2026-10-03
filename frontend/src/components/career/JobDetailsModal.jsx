import {
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  MapPin,
} from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import { JOB_TYPE_TONES } from "../../lib/career.js";

function Bullets({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
            <span className="bg-career mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDetailsModal({ job, saved, applied, onClose, onToggleSave, onApply }) {
  return (
    <Modal open onClose={onClose} title={job.title} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={JOB_TYPE_TONES[job.type] ?? "neutral"}>{job.type}</Badge>
          {job.category ? <Badge tone="neutral">{job.category.replace("-", " ")}</Badge> : null}
          {job.careerBreakFriendly ? <Badge tone="success">Career break friendly</Badge> : null}
          {applied ? <Badge tone="info">Applied</Badge> : null}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/70 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="size-3.5" aria-hidden="true" />
              Company
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.company}</dd>
          </div>

          {job.location ? (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="size-3.5" aria-hidden="true" />
                Location
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.location}</dd>
            </div>
          ) : null}

          {job.salaryRange ? (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <IndianRupee className="size-3.5" aria-hidden="true" />
                Pay
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.salaryRange}</dd>
            </div>
          ) : null}

          {job.experienceLevel ? (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <GraduationCap className="size-3.5" aria-hidden="true" />
                Experience
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.experienceLevel}</dd>
            </div>
          ) : null}
        </dl>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-800">About the role</h4>
          <p className="text-sm leading-relaxed text-slate-700">{job.description}</p>
        </div>

        <Bullets title="What they are looking for" items={job.requirements} />
        <Bullets title="What they offer" items={job.benefits} />

        <div className="flex flex-col gap-2.5 sm:flex-row">
          {applied ? (
            <Button variant="secondary" size="lg" disabled className="flex-1">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Already applied
            </Button>
          ) : (
            <Button size="lg" onClick={() => onApply(job)} className="flex-1">
              Apply through AROGYINI
            </Button>
          )}

          <Button variant="secondary" size="lg" onClick={() => onToggleSave(job)}>
            {saved ? (
              <>
                <BookmarkCheck className="text-career size-4" aria-hidden="true" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="size-4" aria-hidden="true" />
                Save
              </>
            )}
          </Button>
        </div>

        {job.applyUrl ? (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring text-career inline-flex items-center gap-1.5 rounded text-sm font-semibold hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open the employer's own listing
          </a>
        ) : null}
      </div>
    </Modal>
  );
}
