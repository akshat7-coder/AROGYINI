import { Bookmark } from "lucide-react";
import Card from "../ui/Card.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Badge from "../ui/Badge.jsx";
import JobCard from "./JobCard.jsx";

export default function SavedTab({ jobs, loading, savedIds, appliedIds, savingId, onToggleSave, onOpen }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark on any role to keep it here while you think about it."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <div key={job.id} className="relative">
          {job.isActive === false ? (
            <div className="absolute top-4 right-16 z-10">
              <Badge tone="warning">No longer listed</Badge>
            </div>
          ) : null}
          <JobCard
            job={job}
            saved={savedIds.has(job.id)}
            applied={appliedIds.has(job.id)}
            savingId={savingId}
            onToggleSave={onToggleSave}
            onOpen={onOpen}
          />
        </div>
      ))}
    </div>
  );
}
