import { useCallback } from "react";
import { Link } from "react-router";
import {
  Bot,
  Briefcase,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";

function StatCard({ icon: Icon, label, value, note, tone, to, alert }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {alert ? (
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="bg-safety absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping" />
            <span className="bg-safety relative inline-flex size-2.5 rounded-full" />
          </span>
        ) : null}
      </div>
      <p className="font-mono tnum mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{label}</p>
      {note ? <p className="mt-0.5 text-xs text-slate-500">{note}</p> : null}
    </>
  );

  return to ? (
    <Link to={to} className="focus-ring glass hover-lift block rounded-3xl p-5">
      {body}
    </Link>
  ) : (
    <div className="glass p-5">{body}</div>
  );
}

export default function AdminOverview() {
  const load = useCallback(() => adminApi.getStats(), []);
  const { data: stats, loading, error } = useAsync(load);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          Could not load the stats. {error.message}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Registered users"
          value={stats.users}
          note={`${stats.activeUsers} active`}
          tone="bg-brand-50 text-brand-600"
          to="/admin/users"
        />
        <StatCard
          icon={ShieldAlert}
          label="Active SOS events"
          value={stats.activeSos}
          note={stats.activeSos > 0 ? "Needs attention now" : "Nothing live"}
          tone="bg-rose-50 text-safety"
          to="/admin/sos"
          alert={stats.activeSos > 0}
        />
        <StatCard
          icon={Bot}
          label="Open chat issues"
          value={stats.openIssues}
          note={stats.openIssues > 0 ? "Reported or failed answers" : "All clear"}
          tone="bg-indigo-50 text-legal"
          to="/admin/chatbot"
          alert={stats.openIssues > 0}
        />
        <StatCard
          icon={Briefcase}
          label="Jobs"
          value={stats.jobs}
          note={`${stats.activeJobs} listed publicly`}
          tone="bg-teal-50 text-career"
          to="/admin/content"
        />
        <StatCard
          icon={FileCheck2}
          label="Applications"
          value={stats.applications}
          note="Across all jobs"
          tone="bg-teal-50 text-career"
          to="/admin/content"
        />
        <StatCard
          icon={GraduationCap}
          label="Scholarships"
          value={stats.scholarships}
          note="Schemes on the site"
          tone="bg-amber-50 text-amber-700"
          to="/admin/content"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <UserCog className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono tnum text-xl font-bold text-slate-900">{stats.admins}</p>
              <p className="text-sm text-slate-600">
                {stats.admins === 1 ? "administrator" : "administrators"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              Users cannot see anything here. Admin routes are checked on the server on every
              request, not just hidden in the interface.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
