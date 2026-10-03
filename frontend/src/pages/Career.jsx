import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Bookmark, Briefcase, FileCheck2, GraduationCap } from "lucide-react";
import Tabs, { TabPanel } from "../components/ui/Tabs.jsx";
import JobsTab from "../components/career/JobsTab.jsx";
import ScholarshipsTab from "../components/career/ScholarshipsTab.jsx";
import SavedTab from "../components/career/SavedTab.jsx";
import ApplicationsTab from "../components/career/ApplicationsTab.jsx";
import JobDetailsModal from "../components/career/JobDetailsModal.jsx";
import ApplyModal from "../components/career/ApplyModal.jsx";
import * as careerApi from "../api/career.js";
import { useAsync } from "../hooks/useAsync.js";
import { useToast } from "../context/toastContext.js";

const TAB_IDS = ["jobs", "scholarships", "saved", "applications"];

export default function Career() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const active = TAB_IDS.includes(params.get("tab")) ? params.get("tab") : "jobs";

  const loadSaved = useCallback(() => careerApi.getSavedJobs(), []);
  const loadApplications = useCallback(() => careerApi.listApplications({ limit: 50 }), []);

  const savedState = useAsync(loadSaved);
  const applicationsState = useAsync(loadApplications);

  // Memoised so the derived id sets below do not rebuild on every render.
  const savedJobs = useMemo(() => savedState.data?.jobs ?? [], [savedState.data]);
  const applications = useMemo(() => applicationsState.data?.data ?? [], [applicationsState.data]);

  // Saving and applying are optimistic in these sets, so every tab updates at once.
  const [savedOverrides, setSavedOverrides] = useState({});
  const [extraApplied, setExtraApplied] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const savedIds = useMemo(() => {
    const ids = new Set(savedJobs.map((job) => job.id));
    for (const [id, saved] of Object.entries(savedOverrides)) {
      if (saved) ids.add(id);
      else ids.delete(id);
    }
    return ids;
  }, [savedJobs, savedOverrides]);

  const appliedIds = useMemo(
    () => new Set([...applications.map((application) => application.job?.id).filter(Boolean), ...extraApplied]),
    [applications, extraApplied]
  );

  const [detailsJob, setDetailsJob] = useState(null);
  const [applyJob, setApplyJob] = useState(null);

  async function onToggleSave(job) {
    setSavingId(job.id);
    try {
      const { saved } = await careerApi.toggleSaveJob(job.id);
      setSavedOverrides((current) => ({ ...current, [job.id]: saved }));
      toast.success(saved ? "Saved." : "Removed from saved.");
      savedState.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingId(null);
    }
  }

  function onApplied(jobId) {
    setExtraApplied((current) => [...current, jobId]);
    applicationsState.reload();
  }

  const tabs = [
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "scholarships", label: "Scholarships", icon: GraduationCap },
    { id: "saved", label: "Saved", icon: Bookmark, count: savedIds.size },
    { id: "applications", label: "Applications", icon: FileCheck2, count: appliedIds.size },
  ];

  const shared = {
    savedIds,
    appliedIds,
    savingId,
    onToggleSave,
    onOpen: setDetailsJob,
  };

  return (
    <div className="space-y-5">
      <Tabs
        tabs={tabs}
        active={active}
        label="Career sections"
        onChange={(id) => setParams({ tab: id }, { replace: true })}
      />

      <TabPanel id="jobs" active={active}>
        <JobsTab {...shared} />
      </TabPanel>

      <TabPanel id="scholarships" active={active}>
        <ScholarshipsTab />
      </TabPanel>

      <TabPanel id="saved" active={active}>
        <SavedTab
          {...shared}
          jobs={savedJobs.filter((job) => savedIds.has(job.id))}
          loading={savedState.loading}
        />
      </TabPanel>

      <TabPanel id="applications" active={active}>
        <ApplicationsTab applications={applications} loading={applicationsState.loading} />
      </TabPanel>

      {detailsJob ? (
        <JobDetailsModal
          job={detailsJob}
          saved={savedIds.has(detailsJob.id)}
          applied={appliedIds.has(detailsJob.id)}
          onClose={() => setDetailsJob(null)}
          onToggleSave={onToggleSave}
          onApply={(job) => {
            setDetailsJob(null);
            setApplyJob(job);
          }}
        />
      ) : null}

      {applyJob ? (
        <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={onApplied} />
      ) : null}
    </div>
  );
}
