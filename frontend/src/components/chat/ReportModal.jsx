import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Textarea from "../ui/Textarea.jsx";
import * as chatApi from "../../api/chat.js";
import { useToast } from "../../context/toastContext.js";

const REASONS = [
  "The information looks wrong",
  "It did not answer my question",
  "It felt dismissive or judgemental",
  "It could be harmful advice",
];

export default function ReportModal({ message, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Tell us briefly what was wrong");
      return;
    }

    setSending(true);
    try {
      await chatApi.reportMessage(message.id, { reason: reason.trim() });
      toast.success("Thank you. An admin will look at this answer.");
      onClose();
    } catch (apiError) {
      setError(apiError.fieldErrors?.reason ?? apiError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Report this answer"
      description="An admin reviews reported answers and can retry or correct them."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setReason(preset);
                setError(null);
              }}
              className={`focus-ring rounded-full border px-3.5 py-2 text-sm transition
                ${
                  reason === preset
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <Textarea
          label="What was wrong?"
          rows={4}
          maxLength={1000}
          placeholder="Add any detail that would help an admin understand."
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
          error={error}
          required
        />

        <p className="rounded-2xl bg-white/70 p-3.5 text-xs text-slate-600">
          The answer you are reporting is sent along with this, so an admin can see it in context.
        </p>

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={sending}>
            Send report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
