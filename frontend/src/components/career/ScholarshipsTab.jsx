import { useCallback, useState } from "react";
import { ExternalLink, GraduationCap, IndianRupee } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import * as careerApi from "../../api/career.js";
import { useAsync } from "../../hooks/useAsync.js";
import { daysBetween, formatLong, todayIso } from "../../lib/dates.js";

// Rolling schemes have no deadline; anything past is shown only when expired ones are included.
function deadlineBadge(deadline) {
  if (!deadline) return { tone: "success", text: "Always open" };

  const days = daysBetween(todayIso(), deadline);
  if (days < 0) return { tone: "neutral", text: "Closed" };
  if (days === 0) return { tone: "danger", text: "Closes today" };
  if (days <= 7) return { tone: "danger", text: `${days} ${days === 1 ? "day" : "days"} left` };
  if (days <= 30) return { tone: "warning", text: `${days} days left` };
  return { tone: "info", text: `${days} days left` };
}

export default function ScholarshipsTab() {
  const [includeExpired, setIncludeExpired] = useState(false);

  const load = useCallback(
    () =>
      careerApi.listScholarships({
        limit: 50,
        ...(includeExpired ? { includeExpired: "true" } : {}),
      }),
    [includeExpired]
  );

  const { data, loading, error } = useAsync(load);
  const scholarships = data?.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(event) => setIncludeExpired(event.target.checked)}
            className="accent-career focus-ring size-4"
          />
          Include schemes whose deadline has passed
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Amounts and dates are indicative and change each year. Always confirm on the official
          portal before you apply.
        </p>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            Could not load scholarships. {error.message}
          </p>
        </Card>
      ) : scholarships.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Nothing open right now"
            description="Tick the box above to see schemes whose deadline has already passed."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {scholarships.map((scholarship) => {
            const badge = deadlineBadge(scholarship.deadline);

            return (
              <article key={scholarship.id} className="glass p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">{scholarship.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{scholarship.provider}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {scholarship.domain ? (
                      <Badge tone="neutral">
                        <span className="capitalize">{scholarship.domain.replace("-", " ")}</span>
                      </Badge>
                    ) : null}
                    <Badge tone={badge.tone}>{badge.text}</Badge>
                  </div>
                </div>

                {scholarship.amount ? (
                  <p className="text-career mt-3 flex items-center gap-1.5 text-sm font-semibold">
                    <IndianRupee className="size-4 shrink-0" aria-hidden="true" />
                    {scholarship.amount}
                  </p>
                ) : null}

                {scholarship.eligibility?.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="mb-1.5 text-sm font-semibold text-slate-800">Who can apply</h4>
                    <ul className="space-y-1.5">
                      {scholarship.eligibility.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                          <span
                            className="bg-career mt-1.5 size-1.5 shrink-0 rounded-full"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {scholarship.deadline
                      ? `Deadline ${formatLong(scholarship.deadline)}`
                      : "No closing date, applications stay open"}
                  </p>

                  {scholarship.link ? (
                    <a
                      href={scholarship.link}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring bg-career inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Official page
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
