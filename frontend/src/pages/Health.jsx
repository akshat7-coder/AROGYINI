import { HeartPulse } from "lucide-react";
import Placeholder from "./Placeholder.jsx";

export default function Health() {
  return (
    <Placeholder
      icon={HeartPulse}
      title="Period and cycle tracker"
      description="Log a period and see your average cycle length, next expected date, fertile window and current phase. The backend for this is already built."
      phase="the next phase"
    />
  );
}
