import { MessageCircleHeart } from "lucide-react";
import Placeholder from "./Placeholder.jsx";

export default function Chat() {
  return (
    <Placeholder
      icon={MessageCircleHeart}
      title="AI assistant"
      description="Ask about health, your rights, work or safety. Questions route to the right assistant automatically, and anything urgent surfaces an SOS button."
      phase="the next phase"
    />
  );
}
