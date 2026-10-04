import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, limit, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="tnum text-xs text-slate-500">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="focus-ring grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="tnum px-2 text-xs font-medium text-slate-600">
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="focus-ring grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5 disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
