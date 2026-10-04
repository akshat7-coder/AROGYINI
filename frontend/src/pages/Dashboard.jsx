import { useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  Briefcase,
  Droplets,
  FileText,
  HeartPulse,
  MessageCircleHeart,
  Phone,
  Plus,
  Scale,
  ShieldAlert,
} from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PillarCard from "../components/dashboard/PillarCard.jsx";
import * as healthApi from "../api/health.js";
import * as safetyApi from "../api/safety.js";
import * as careerApi from "../api/career.js";
import * as legalApi from "../api/legal.js";
import * as chatApi from "../api/chat.js";
import { useAuth } from "../context/authContext.js";
import { useSos } from "../context/sosContext.js";
import { useAsync } from "../hooks/useAsync.js";
import { PHASE_LABELS } from "../lib/cycle.js";
import { formatShort, relativeDays } from "../lib/dates.js";

const QUICK_NUMBERS = [
  { number: "112", label: "Emergency" },
  { number: "181", label: "Women Helpline" },
  { number: "1091", label: "Women Police" },
  { number: "1930", label: "Cyber Crime" },
];

function QuickAction({ icon: Icon, label, onClick, to, tone = "text-brand-600" }) {
  const content = (
    <>
      <span className="grid size-10 place-items-center rounded-2xl bg-white/80 shadow-sm">
        <Icon className={`size-4.5 ${tone}`} aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </>
  );

  const className =
    "focus-ring hover-lift flex items-center gap-3 rounded-2xl bg-white/60 p-3 text-left transition hover:bg-white";

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function RecentChats({ conversations, loading }) {
  return (
    <Card as="section">
      <CardHeader
        title="Recent conversations"
        description="Pick up where you left off."
        icon={MessageCircleHeart}
        action={
          <Link
            to="/chat"
            className="text-brand-700 focus-ring rounded text-sm font-semibold hover:underline"
          >
            Open chat
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircleHeart}
          title="No conversations yet"
          description="Ask the assistant about your health, your rights, work or safety."
        />
      ) : (
        <ul className="space-y-2.5">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                to="/chat"
                className="focus-ring block rounded-2xl bg-white/70 p-3.5 transition hover:bg-white"
              >
                <p className="truncate text-sm font-medium text-slate-800">{conversation.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatShort(conversation.lastMessageAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { openModal } = useSos();
  const navigate = useNavigate();
  const firstName = user?.name?.trim()?.split(" ")[0] ?? "there";

  const loadSummary = useCallback(() => healthApi.getSummary(), []);
  const loadContacts = useCallback(() => safetyApi.listContacts(), []);
  const loadSaved = useCallback(() => careerApi.getSavedJobs(), []);
  const loadRights = useCallback(() => legalApi.listRights({ limit: 1, category: "workplace" }), []);
  const loadRightCount = useCallback(() => legalApi.listRights({ limit: 1 }), []);
  const loadChats = useCallback(() => chatApi.listConversations({ limit: 3 }), []);

  const summaryState = useAsync(loadSummary);
  const contactsState = useAsync(loadContacts);
  const savedState = useAsync(loadSaved);
  const rightsState = useAsync(loadRights);
  const rightCountState = useAsync(loadRightCount);
  const chatsState = useAsync(loadChats);

  const summary = summaryState.data;
  const contacts = contactsState.data?.contacts ?? [];
  const savedJobs = savedState.data?.jobs ?? [];
  const featuredRight = rightsState.data?.data?.[0];
  const rightCount = rightCountState.data?.meta?.total ?? 0;
  const conversations = chatsState.data?.data ?? [];

  const sosReady = contacts.length > 0;

  // Any failed loader would otherwise leave a tile reading "Not tracking yet", which looks
  // like real data. One banner is enough: the tiles below already degrade to their defaults.
  const loadFailed = [summaryState, contactsState, savedState, rightsState, rightCountState, chatsState].some(
    (state) => state.error
  );

  const reloadAll = () => {
    for (const state of [summaryState, contactsState, savedState, rightsState, rightCountState, chatsState]) {
      if (state.error) state.reload();
    }
  };

  return (
    <div className="space-y-5">
      {loadFailed ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
          role="status"
        >
          <span className="min-w-0 flex-1">
            Some of your dashboard could not be loaded, so parts of this page may look empty.
          </span>
          <Button variant="secondary" size="md" onClick={reloadAll}>
            Try again
          </Button>
        </div>
      ) : null}
      <Card>
        <p className="text-brand-700 text-xs font-semibold tracking-wide uppercase">Welcome back</p>
        <h2 className="font-display mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Hello, {firstName}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Everything is in one place. Start wherever you need to, and the assistant can point you in
          the right direction if you are not sure.
        </p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Plus}
            tone="text-health"
            label="Log period"
            onClick={() => navigate("/health", { state: { logPeriod: true } })}
          />
          <QuickAction icon={MessageCircleHeart} label="Ask assistant" to="/chat" />
          <QuickAction icon={FileText} tone="text-legal" label="Draft complaint" to="/legal" />
          <QuickAction
            icon={ShieldAlert}
            tone="text-safety"
            label="Trigger SOS"
            onClick={openModal}
          />
        </div>
      </Card>

      <section aria-labelledby="pillars" className="grid gap-4 sm:grid-cols-2">
        <h2 id="pillars" className="sr-only">
          The four pillars
        </h2>

        <PillarCard
          to="/health"
          icon={HeartPulse}
          title="Health"
          tint="bg-rose-50 text-health"
          loading={summaryState.loading}
          headline={
            summary?.hasData ? `${PHASE_LABELS[summary.phase] ?? "Cycle"} phase` : "Not tracking yet"
          }
          detail={
            summary?.hasData
              ? `Day ${summary.currentCycleDay} of ${summary.averageCycleLength}. Next period ${relativeDays(summary.daysUntilNextPeriod)}.`
              : "Log a period to get predictions for your next cycle."
          }
          badge={
            summary?.hasData && summary.irregular ? <Badge tone="warning">Irregular</Badge> : null
          }
        />

        <PillarCard
          to="/safety"
          icon={ShieldAlert}
          title="Safety"
          tint="bg-rose-50 text-safety"
          loading={contactsState.loading}
          headline={
            contacts.length === 0
              ? "Not ready"
              : `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`
          }
          detail={
            sosReady
              ? "SOS will text your live location to each of them."
              : "Add an emergency contact so SOS has someone to alert."
          }
          badge={
            <Badge tone={sosReady ? "success" : "warning"}>
              {sosReady ? "SOS ready" : "Add a contact"}
            </Badge>
          }
        />

        <PillarCard
          to="/career"
          icon={Briefcase}
          title="Career"
          tint="bg-teal-50 text-career"
          loading={savedState.loading}
          headline={
            savedJobs.length === 0
              ? "Nothing saved"
              : `${savedJobs.length} saved ${savedJobs.length === 1 ? "job" : "jobs"}`
          }
          detail={
            savedJobs.length > 0
              ? savedJobs[0].title
              : "Browse jobs, returnships and scholarships worth applying to."
          }
        />

        <PillarCard
          to="/legal"
          icon={Scale}
          title="Legal"
          tint="bg-indigo-50 text-legal"
          loading={rightsState.loading || rightCountState.loading}
          headline={rightCount ? `${rightCount} guides` : "Know your rights"}
          detail={
            featuredRight
              ? `Including ${featuredRight.title} under the ${featuredRight.actName}.`
              : "Plain-language guides and ready complaint drafts."
          }
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecentChats conversations={conversations} loading={chatsState.loading} />

        <Card as="section" aria-labelledby="numbers">
          <CardHeader
            title="Numbers worth saving"
            description="Free, and open around the clock."
            icon={Phone}
          />

          <ul className="grid grid-cols-2 gap-3">
            {QUICK_NUMBERS.map(({ number, label }) => (
              <li key={number} className="rounded-2xl bg-white/70 px-3 py-3 text-center">
                <a
                  href={`tel:${number}`}
                  className="focus-ring font-mono tnum block text-base font-semibold text-slate-900 hover:underline"
                >
                  {number}
                </a>
                <span className="mt-0.5 block text-xs text-slate-500">{label}</span>
              </li>
            ))}
          </ul>

          {summary?.hasData ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Droplets className="text-health size-3.5" aria-hidden="true" />
              Next period expected {formatShort(summary.nextPeriodDate)}.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
