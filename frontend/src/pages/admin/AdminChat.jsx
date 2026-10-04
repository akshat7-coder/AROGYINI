import { useCallback, useState } from "react";
import { Bot, MessageSquareWarning } from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Pagination from "../../components/admin/Pagination.jsx";
import BotsPanel from "../../components/admin/BotsPanel.jsx";
import IssueDrawer from "../../components/admin/IssueDrawer.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { formatShort } from "../../lib/dates.js";

const LIMIT = 20;
const STATUSES = ["", "open", "in_progress", "resolved"];
const TYPES = ["", "provider_error", "timeout", "user_report"];

const STATUS_TONES = { open: "warning", in_progress: "info", resolved: "success" };
const TYPE_TONES = { provider_error: "danger", timeout: "warning", user_report: "info" };
const pretty = (value) => (value === "" ? "All" : value.replace("_", " "));

function FilterRow({ label, values, active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex gap-1 rounded-full bg-white/70 p-1" role="group" aria-label={label}>
        {values.map((value) => (
          <button
            key={value || "all"}
            type="button"
            aria-pressed={value === active}
            onClick={() => onChange(value)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition
              ${value === active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-900/5"}`}
          >
            {pretty(value)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminChat() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(
    () =>
      adminApi.listIssues({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      }),
    [page, status, type]
  );

  const { data, loading, error, reload } = useAsync(load);
  const issues = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-5">
      <BotsPanel />

      <Card as="section">
        <CardHeader
          title="Chat issues"
          description="Failed answers, timeouts and anything a user reported."
          icon={MessageSquareWarning}
        />

        <div className="mb-4 flex flex-col gap-2.5">
          <FilterRow
            label="Status"
            values={STATUSES}
            active={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <FilterRow
            label="Type"
            values={TYPES}
            active={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            {error.message}
          </p>
        ) : issues.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No issues"
            description={
              status || type
                ? "Nothing matches those filters."
                : "No failed answers and nothing reported. That is the good outcome."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 border-collapse text-left">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th scope="col" className="px-3 pb-2 font-medium">
                      Type
                    </th>
                    <th scope="col" className="px-3 pb-2 font-medium">
                      User
                    </th>
                    <th scope="col" className="px-3 pb-2 font-medium">
                      Reason
                    </th>
                    <th scope="col" className="px-3 pb-2 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-3 pb-2 font-medium">
                      When
                    </th>
                    <th scope="col" className="px-3 pb-2 text-right font-medium">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="border-t border-white/80">
                      <td className="px-3 py-3">
                        <Badge tone={TYPE_TONES[issue.type] ?? "neutral"}>
                          {issue.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <p className="truncate text-sm text-slate-800">
                          {issue.user?.name ?? "Deleted user"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{issue.user?.email}</p>
                      </td>
                      <td className="max-w-70 px-3 py-3">
                        <p className="truncate text-xs text-slate-600">{issue.reason}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={STATUS_TONES[issue.status] ?? "neutral"}>
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-3 text-xs text-slate-500">
                        {formatShort(issue.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setOpen(issue)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
          </>
        )}
      </Card>

      {open ? (
        <IssueDrawer
          key={open.id}
          issue={open}
          onClose={() => setOpen(null)}
          onChanged={reload}
        />
      ) : null}
    </div>
  );
}
