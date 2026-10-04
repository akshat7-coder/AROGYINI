import { useState } from "react";
import { RefreshCw, User } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";
import * as adminApi from "../../api/admin.js";
import { useToast } from "../../context/toastContext.js";
import { BOT_META } from "../../lib/chat.js";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const TYPE_TONES = { provider_error: "danger", timeout: "warning", user_report: "info" };

export default function IssueDrawer({ issue, onClose, onChanged }) {
  const toast = useToast();
  const [status, setStatus] = useState(issue.status);
  const [adminNote, setAdminNote] = useState(issue.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState(issue.message);

  const retryable = message?.role === "assistant";

  async function onSave() {
    setSaving(true);
    try {
      await adminApi.updateIssue(issue.id, { status, adminNote: adminNote.trim() });
      toast.success("Issue updated.");
      onChanged();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function onRetry() {
    setRetrying(true);
    try {
      const result = await adminApi.retryIssue(issue.id);
      setMessage(result.message);
      setStatus(result.issue.status);
      toast.success("The provider answered. The message has been replaced.");
      onChanged();
    } catch (error) {
      // 502 RETRY_FAILED means the provider is still down; the issue stays open.
      toast.error(error.message);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Chat issue"
      description={issue.conversation?.title ? `From “${issue.conversation.title}”` : undefined}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONES[issue.type] ?? "neutral"}>{issue.type.replace("_", " ")}</Badge>
          <Badge tone={issue.status === "resolved" ? "success" : issue.status === "open" ? "warning" : "info"}>
            {issue.status.replace("_", " ")}
          </Badge>
          {message?.bot ? (
            <Badge tone="neutral">{BOT_META[message.bot]?.label ?? message.bot}</Badge>
          ) : null}
          {message?.status === "failed" ? <Badge tone="danger">failed answer</Badge> : null}
        </div>

        {issue.user ? (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <User className="size-3.5" aria-hidden="true" />
            {issue.user.name} · {issue.user.email}
          </p>
        ) : null}

        {issue.reason ? (
          <div>
            <h4 className="mb-1.5 text-sm font-semibold text-slate-800">Why it was flagged</h4>
            <p className="rounded-2xl bg-white/70 p-3.5 text-sm text-slate-700">{issue.reason}</p>
          </div>
        ) : null}

        <div>
          <h4 className="mb-1.5 text-sm font-semibold text-slate-800">The answer given</h4>
          <p className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3.5 text-sm whitespace-pre-wrap text-slate-700">
            {message?.content ?? "The message no longer exists."}
          </p>
          {message?.intent ? (
            <p className="mt-1.5 text-xs text-slate-500">
              Detected intent: {message.intent}
              {message.latencyMs === undefined ? null : ` · ${message.latencyMs} ms`}
            </p>
          ) : null}
        </div>

        {retryable ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">Retry the provider</p>
            <p className="mt-0.5 text-sm text-indigo-800">
              Re-asks the original question and replaces this answer in place. The user sees the new
              one in her conversation.
            </p>
            <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry} className="mt-3">
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry now
            </Button>
          </div>
        ) : null}

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />

        <Textarea
          label="Admin note"
          rows={3}
          maxLength={1000}
          placeholder="What you found, or what you did about it."
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
        />

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button loading={saving} onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
