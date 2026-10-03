import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Droplets, Lightbulb, Plus } from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import CycleSummaryHero, { CycleSummarySkeleton } from "../components/health/CycleSummaryHero.jsx";
import CycleCalendar from "../components/health/CycleCalendar.jsx";
import CycleHistory from "../components/health/CycleHistory.jsx";
import LogPeriodModal from "../components/health/LogPeriodModal.jsx";
import * as healthApi from "../api/health.js";
import { useAsync } from "../hooks/useAsync.js";

function PhaseTips({ tips, loading }) {
  return (
    <Card as="section">
      <CardHeader title="For this phase" description="Small things that tend to help." icon={Lightbulb} />
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {(tips ?? []).map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="bg-brand-400 mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-slate-500">
        General information, not medical advice. See a doctor about anything that worries you.
      </p>
    </Card>
  );
}

export default function Health() {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(Boolean(location.state?.logPeriod));
  const [editing, setEditing] = useState(null);

  const loadSummary = useCallback(() => healthApi.getSummary(), []);
  const loadLogs = useCallback(() => healthApi.listCycles({ limit: 24 }), []);

  const summaryState = useAsync(loadSummary);
  const logsState = useAsync(loadLogs);

  const summary = summaryState.data;
  const logs = logsState.data?.data ?? [];

  // Clear the navigation state so a refresh does not reopen the modal.
  useEffect(() => {
    if (location.state?.logPeriod) window.history.replaceState({}, "");
  }, [location.state]);

  const refresh = () => {
    summaryState.reload();
    logsState.reload();
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (log) => {
    setEditing(log);
    setModalOpen(true);
  };

  const loading = summaryState.loading || logsState.loading;
  const hasData = summary?.hasData;

  return (
    <div className="space-y-5">
      {summaryState.loading ? (
        <CycleSummarySkeleton />
      ) : hasData ? (
        <CycleSummaryHero summary={summary} />
      ) : (
        <Card>
          <EmptyState
            icon={Droplets}
            title="Log your first period"
            description="Once you add one period, AROGYINI works out your average cycle length, the next date to expect, your fertile window and which phase you are in."
            action={
              <Button size="lg" onClick={openNew}>
                <Plus className="size-4" aria-hidden="true" />
                Log a period
              </Button>
            }
          />
        </Card>
      )}

      {hasData ? (
        <div className="flex justify-end">
          <Button size="lg" onClick={openNew}>
            <Plus className="size-4" aria-hidden="true" />
            Log a period
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <CycleCalendar logs={logs} summary={summary} />
        <PhaseTips tips={summary?.tips} loading={summaryState.loading} />
      </div>

      <CycleHistory logs={logs} loading={logsState.loading} onEdit={openEdit} onChanged={refresh} />

      {modalOpen ? (
        <LogPeriodModal
          key={editing?.id ?? "new"}
          log={editing}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {loading ? "Loading your cycle data" : ""}
      </span>
    </div>
  );
}
