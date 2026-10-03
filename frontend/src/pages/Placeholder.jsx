import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";

// Every pillar page lands here until its own phase builds it out.
export default function Placeholder({ icon, title, description, phase }) {
  return (
    <Card>
      <div className="mb-2 flex justify-center">
        <Badge tone="warning">{phase ? `Coming in ${phase}` : "Coming soon"}</Badge>
      </div>
      <EmptyState icon={icon} title={title} description={description} />
    </Card>
  );
}
