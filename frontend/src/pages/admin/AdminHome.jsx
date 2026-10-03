import { Settings } from "lucide-react";
import Placeholder from "../Placeholder.jsx";

export default function AdminHome() {
  return (
    <Placeholder
      icon={Settings}
      title="Admin console"
      description="Users, SOS events, legal content, jobs, scholarships and chatbot issues. Every endpoint behind this is already built and tested."
      phase="a later phase"
    />
  );
}
