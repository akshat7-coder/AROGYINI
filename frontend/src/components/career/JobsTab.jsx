import { useCallback, useMemo, useState } from "react";
import { Briefcase, Search, X } from "lucide-react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import JobCard from "./JobCard.jsx";
import * as careerApi from "../../api/career.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounced } from "../../hooks/useDebounced.js";

const TYPES = [
  { value: "", label: "All types" },
  { value: "full-time", label: "Full time" },
  { value: "part-time", label: "Part time" },
  { value: "remote", label: "Remote" },
  { value: "returnship", label: "Returnship" },
  { value: "internship", label: "Internship" },
];

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`focus-ring rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition
        ${
          selected
            ? "bg-career border-career text-white"
            : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
        }`}
    >
      {children}
    </button>
  );
}

export default function JobsTab({ savedIds, appliedIds, savingId, onToggleSave, onOpen }) {
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [breakFriendly, setBreakFriendly] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);

  const load = useCallback(
    () =>
      careerApi.listJobs({
        limit: 50,
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(breakFriendly ? { careerBreakFriendly: "true" } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      }),
    [type, category, breakFriendly, debouncedSearch]
  );

  // Separate unfiltered fetch, so the category chips list every category and not
  // just the ones left after filtering.
  const loadAll = useCallback(() => careerApi.listJobs({ limit: 100 }), []);

  const { data, loading, error } = useAsync(load);
  const { data: allData } = useAsync(loadAll);

  const jobs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const categories = useMemo(
    () => [...new Set((allData?.data ?? []).map((job) => job.category).filter(Boolean))].sort(),
    [allData]
  );
  const filtered = Boolean(type || category || breakFriendly || debouncedSearch.trim());

  const clear = () => {
    setType("");
    setCategory("");
    setBreakFriendly(false);
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roles, companies, skills…"
              aria-label="Search jobs"
              className="focus-ring h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pr-10 pl-10 text-sm text-slate-800 placeholder:text-slate-400 hover:border-slate-300"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="focus-ring absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-900/5"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by job type">
            {TYPES.map(({ value, label }) => (
              <Chip key={value || "all"} selected={value === type} onClick={() => setType(value)}>
                {label}
              </Chip>
            ))}
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              <Chip selected={category === ""} onClick={() => setCategory("")}>
                All areas
              </Chip>
              {categories.map((value) => (
                <Chip
                  key={value}
                  selected={value === category}
                  onClick={() => setCategory(value === category ? "" : value)}
                >
                  <span className="capitalize">{value.replace("-", " ")}</span>
                </Chip>
              ))}
            </div>
          ) : null}

          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={breakFriendly}
              onChange={(event) => setBreakFriendly(event.target.checked)}
              className="accent-career focus-ring size-4"
            />
            Only roles open to a career break
          </label>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            Could not load jobs. {error.message}
          </p>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No roles match that"
            description="Try a broader search, or clear the filters to see everything on offer."
            action={
              filtered ? (
                <Button variant="secondary" onClick={clear}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-xs text-slate-500" aria-live="polite">
            {total} {total === 1 ? "role" : "roles"}
            {filtered ? " matching your filters" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedIds.has(job.id)}
                applied={appliedIds.has(job.id)}
                savingId={savingId}
                onToggleSave={onToggleSave}
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
