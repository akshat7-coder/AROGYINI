import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Textarea from "../ui/Textarea.jsx";
import * as careerApi from "../../api/career.js";
import { useToast } from "../../context/toastContext.js";

const MAX = 1000;

export default function ApplyModal({ job, onClose, onApplied }) {
  const toast = useToast();
  const [coverNote, setCoverNote] = useState("");
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setApplying(true);
    setError(null);

    try {
      await careerApi.applyToJob(job.id, coverNote.trim() ? { coverNote: coverNote.trim() } : {});
      toast.success("Application sent.");
      onApplied(job.id);
      onClose();
    } catch (apiError) {
      if (apiError.code === "ALREADY_APPLIED") {
        toast.info("You had already applied to this one.");
        onApplied(job.id);
        onClose();
        return;
      }
      setError(apiError.fieldErrors?.coverNote ?? apiError.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Apply: ${job.title}`}
      description={`At ${job.company}. Your name, email and profile details go with the application.`}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Textarea
          label="Cover note"
          rows={6}
          maxLength={MAX}
          placeholder="Why this role suits you, and anything about a career break you want to explain up front."
          value={coverNote}
          onChange={(event) => setCoverNote(event.target.value)}
          error={error}
          hint={`Optional. ${coverNote.length} / ${MAX}`}
        />

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={applying}>
            Send application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
