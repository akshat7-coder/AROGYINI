import { useNavigate, useSearchParams } from "react-router";
import { BookOpen, FileText, MessageCircleHeart } from "lucide-react";
import Tabs, { TabPanel } from "../components/ui/Tabs.jsx";
import Button from "../components/ui/Button.jsx";
import RightsList from "../components/legal/RightsList.jsx";
import ComplaintDrafter from "../components/legal/ComplaintDrafter.jsx";

const TABS = [
  { id: "rights", label: "Your rights", icon: BookOpen },
  { id: "draft", label: "Draft a complaint", icon: FileText },
];

export default function Legal() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const active = TABS.some((tab) => tab.id === params.get("tab")) ? params.get("tab") : "rights";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={TABS}
          active={active}
          label="Legal sections"
          onChange={(id) => setParams({ tab: id }, { replace: true })}
        />

        <Button
          variant="secondary"
          onClick={() => navigate("/chat", { state: { bot: "legal" } })}
        >
          <MessageCircleHeart className="size-4" aria-hidden="true" />
          Ask the legal assistant
        </Button>
      </div>

      <TabPanel id="rights" active={active}>
        <RightsList />
      </TabPanel>

      <TabPanel id="draft" active={active}>
        <ComplaintDrafter />
      </TabPanel>
    </div>
  );
}
