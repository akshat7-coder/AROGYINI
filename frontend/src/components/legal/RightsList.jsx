import { useCallback, useState } from "react";
import { BookOpen, Scale, Search, X } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Button from "../ui/Button.jsx";
import RightCard from "./RightCard.jsx";
import * as legalApi from "../../api/legal.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounced } from "../../hooks/useDebounced.js";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "workplace", label: "Workplace" },
  { value: "domestic", label: "Domestic" },
  { value: "marriage", label: "Marriage" },
  { value: "cyber", label: "Cyber" },
  { value: "criminal", label: "Criminal" },
  { value: "media", label: "Media" },
];

export default function RightsList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const debouncedSearch = useDebounced(search);

  const load = useCallback(
    () =>
      legalApi.listRights({
        limit: 50,
        ...(category ? { category } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      }),
    [category, debouncedSearch]
  );

  const { data, loading, error } = useAsync(load);
  const rights = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const filtered = Boolean(category || debouncedSearch.trim());

  return (
    <Card as="section">
      <CardHeader
        title="Know your rights"
        description="Plain-language guides to the laws that protect you."
        icon={Scale}
      />

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search POSH, dowry, maternity, cyber…"
            aria-label="Search legal rights"
            className="focus-ring h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pr-10 pl-10 text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300"
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

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map(({ value, label }) => {
            const selected = value === category;
            return (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(value)}
                className={`focus-ring rounded-full border px-3.5 py-1.5 text-sm font-medium transition
                  ${
                    selected
                      ? "bg-legal border-legal text-white"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          Could not load the guides. {error.message}
        </p>
      ) : rights.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing matches that"
          description="Try a different word, or clear the filters to see all the guides."
          action={
            filtered ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                }}
              >
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-500" aria-live="polite">
            {total} {total === 1 ? "guide" : "guides"}
            {filtered ? " matching your filters" : ""}
          </p>
          <div className="space-y-3">
            {rights.map((right) => (
              <RightCard key={right.id} right={right} />
            ))}
          </div>
        </>
      )}

      <p className="mt-5 text-xs text-slate-500">
        This is general information, not legal advice. For advice on your situation, speak to a
        lawyer.
      </p>
    </Card>
  );
}
