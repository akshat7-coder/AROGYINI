import { useCallback, useState } from "react";
import {
  Briefcase,
  FolderCog,
  GraduationCap,
  Pencil,
  Plus,
  Scale,
  Trash2,
  Users,
} from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import Pagination from "../../components/admin/Pagination.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import ResourceForm from "../../components/admin/ResourceForm.jsx";
import ApplicationsDrawer from "../../components/admin/ApplicationsDrawer.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/toastContext.js";
import { RESOURCES } from "../../lib/adminResources.js";
import { JOB_TYPE_TONES } from "../../lib/career.js";
import { formatShort } from "../../lib/dates.js";

const LIMIT = 20;

// Each resource binds its own list loader, API calls and row renderer.
function useResourcePanel({ resource, loader, api, page }) {
  const toast = useToast();
  const load = useCallback(() => loader({ page, limit: LIMIT }), [loader, page]);
  const state = useAsync(load);

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await api.remove(pendingDelete.id);
      toast.success(`${resource.singular} deleted.`);
      setPendingDelete(null);
      state.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  const form =
    creating || editing ? (
      <ResourceForm
        key={editing?.id ?? "new"}
        resource={resource}
        doc={editing}
        onCreate={api.create}
        onUpdate={api.update}
        onSaved={state.reload}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    ) : null;

  const confirm = (
    <ConfirmModal
      open={Boolean(pendingDelete)}
      loading={deleting}
      confirmLabel="Delete"
      title={`Delete this ${resource.singular}?`}
      description="This cannot be undone. Deleting a job also deletes its applications."
      onClose={() => setPendingDelete(null)}
      onConfirm={onDelete}
    />
  );

  return { state, form, confirm, setCreating, setEditing, setPendingDelete };
}

function RowActions({ onEdit, onDelete, extra, label }) {
  return (
    <div className="flex justify-end gap-1.5">
      {extra}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="focus-ring grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        className="focus-ring grid size-10 place-items-center rounded-full text-rose-500 transition hover:bg-rose-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function PanelShell({ title, description, icon, onNew, newLabel, state, empty, children }) {
  return (
    <Card as="section">
      <CardHeader
        title={title}
        description={description}
        icon={icon}
        action={
          <Button size="sm" onClick={onNew}>
            <Plus className="size-4" aria-hidden="true" />
            {newLabel}
          </Button>
        }
      />

      {state.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : state.error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          {state.error.message}
        </p>
      ) : (
        (empty ?? children)
      )}
    </Card>
  );
}

function LegalPanel() {
  const [page, setPage] = useState(1);
  const [publishedOnly, setPublishedOnly] = useState("");
  // The admin listing includes unpublished rights, unlike the public one.
  const loader = useCallback(
    (params) =>
      adminApi.listRights({ ...params, ...(publishedOnly ? { isPublished: publishedOnly } : {}) }),
    [publishedOnly]
  );

  const panel = useResourcePanel({
    resource: RESOURCES.legal,
    loader,
    page,
    api: {
      create: adminApi.createRight,
      update: adminApi.updateRight,
      remove: adminApi.deleteRight,
    },
  });

  const rights = panel.state.data?.data ?? [];
  const total = panel.state.data?.meta?.total ?? 0;

  return (
    <>
      <PanelShell
        title="Legal rights"
        description="Guides shown in the Legal section. Unpublished entries are hidden from users."
        icon={Scale}
        newLabel="New right"
        onNew={() => panel.setCreating(true)}
        state={panel.state}
        empty={
          rights.length === 0 ? (
            <EmptyState icon={Scale} title="No rights yet" description="Add the first guide." />
          ) : null
        }
      >
        <>
          <div className="mb-4 flex gap-1 rounded-full bg-white/70 p-1" role="group" aria-label="Filter by published state">
            {[
              { value: "", label: "All" },
              { value: "true", label: "Published" },
              { value: "false", label: "Unpublished" },
            ].map(({ value, label }) => (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={value === publishedOnly}
                onClick={() => {
                  setPublishedOnly(value);
                  setPage(1);
                }}
                className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold transition
                  ${value === publishedOnly ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-900/5"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-150 border-collapse text-left">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th scope="col" className="px-3 pb-2 font-medium">Title</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Category</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Year</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Published</th>
                  <th scope="col" className="px-3 pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rights.map((right) => (
                  <tr key={right.id} className="border-t border-white/80">
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">{right.title}</p>
                      <p className="font-mono truncate text-xs text-slate-500">{right.slug}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="info">{right.category}</Badge>
                    </td>
                    <td className="tnum px-3 py-3 text-xs text-slate-500">{right.year ?? "—"}</td>
                    <td className="px-3 py-3">
                      <Badge tone={right.isPublished ? "success" : "neutral"}>
                        {right.isPublished ? "yes" : "no"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <RowActions
                        label={right.title}
                        onEdit={() => panel.setEditing(right)}
                        onDelete={() => panel.setPendingDelete(right)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
        </>
      </PanelShell>

      {panel.form}
      {panel.confirm}
    </>
  );
}

function JobsPanel() {
  const [page, setPage] = useState(1);
  const [applicationsFor, setApplicationsFor] = useState(null);
  const loader = useCallback((params) => adminApi.listJobs(params), []);

  const panel = useResourcePanel({
    resource: RESOURCES.jobs,
    loader,
    page,
    api: { create: adminApi.createJob, update: adminApi.updateJob, remove: adminApi.deleteJob },
  });

  const jobs = panel.state.data?.data ?? [];
  const total = panel.state.data?.meta?.total ?? 0;

  return (
    <>
      <PanelShell
        title="Jobs"
        description="Includes unlisted roles. Deleting a job also deletes its applications."
        icon={Briefcase}
        newLabel="New job"
        onNew={() => panel.setCreating(true)}
        state={panel.state}
        empty={
          jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs yet" description="Add the first role." />
          ) : null
        }
      >
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse text-left">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th scope="col" className="px-3 pb-2 font-medium">Role</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Type</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Listed</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Posted</th>
                  <th scope="col" className="px-3 pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-white/80">
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                      <p className="truncate text-xs text-slate-500">{job.company}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={JOB_TYPE_TONES[job.type] ?? "neutral"}>{job.type}</Badge>
                        {job.careerBreakFriendly ? <Badge tone="success">break ok</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={job.isActive ? "success" : "neutral"}>
                        {job.isActive ? "yes" : "no"}
                      </Badge>
                    </td>
                    <td className="tnum px-3 py-3 text-xs text-slate-500">
                      {formatShort(job.postedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <RowActions
                        label={job.title}
                        onEdit={() => panel.setEditing(job)}
                        onDelete={() => panel.setPendingDelete(job)}
                        extra={
                          <button
                            type="button"
                            onClick={() => setApplicationsFor(job)}
                            aria-label={`Applications for ${job.title}`}
                            className="focus-ring grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
                          >
                            <Users className="size-4" aria-hidden="true" />
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
        </>
      </PanelShell>

      {panel.form}
      {panel.confirm}
      {applicationsFor ? (
        <ApplicationsDrawer job={applicationsFor} onClose={() => setApplicationsFor(null)} />
      ) : null}
    </>
  );
}

function ScholarshipsPanel() {
  const [page, setPage] = useState(1);
  const loader = useCallback((params) => adminApi.listScholarships(params), []);

  const panel = useResourcePanel({
    resource: RESOURCES.scholarships,
    loader,
    page,
    api: {
      create: adminApi.createScholarship,
      update: adminApi.updateScholarship,
      remove: adminApi.deleteScholarship,
    },
  });

  const scholarships = panel.state.data?.data ?? [];
  const total = panel.state.data?.meta?.total ?? 0;

  return (
    <>
      <PanelShell
        title="Scholarships"
        description="Schemes shown in the Career section. An empty deadline means a rolling scheme."
        icon={GraduationCap}
        newLabel="New scholarship"
        onNew={() => panel.setCreating(true)}
        state={panel.state}
        empty={
          scholarships.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No scholarships yet"
              description="Add the first scheme."
            />
          ) : null
        }
      >
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 border-collapse text-left">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th scope="col" className="px-3 pb-2 font-medium">Scheme</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Deadline</th>
                  <th scope="col" className="px-3 pb-2 font-medium">Listed</th>
                  <th scope="col" className="px-3 pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scholarships.map((scholarship) => (
                  <tr key={scholarship.id} className="border-t border-white/80">
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">{scholarship.title}</p>
                      <p className="truncate text-xs text-slate-500">{scholarship.provider}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {scholarship.deadline ? (
                        <span className="tnum">{formatShort(scholarship.deadline)}</span>
                      ) : (
                        <Badge tone="success">rolling</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={scholarship.isActive ? "success" : "neutral"}>
                        {scholarship.isActive ? "yes" : "no"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <RowActions
                        label={scholarship.title}
                        onEdit={() => panel.setEditing(scholarship)}
                        onDelete={() => panel.setPendingDelete(scholarship)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
        </>
      </PanelShell>

      {panel.form}
      {panel.confirm}
    </>
  );
}

const TABS = [
  { id: "legal", label: "Legal rights", icon: Scale },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "scholarships", label: "Scholarships", icon: GraduationCap },
];

export default function AdminContent() {
  const [active, setActive] = useState("legal");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Content"
          description="Everything users read in the Legal and Career sections."
          icon={FolderCog}
        />
        <Tabs tabs={TABS} active={active} onChange={setActive} label="Content types" />
      </Card>

      <TabPanel id="legal" active={active}>
        <LegalPanel />
      </TabPanel>
      <TabPanel id="jobs" active={active}>
        <JobsPanel />
      </TabPanel>
      <TabPanel id="scholarships" active={active}>
        <ScholarshipsPanel />
      </TabPanel>
    </div>
  );
}
