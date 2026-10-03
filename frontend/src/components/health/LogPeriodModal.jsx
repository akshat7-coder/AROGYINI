import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import * as healthApi from "../../api/health.js";
import { useToast } from "../../context/toastContext.js";
import { isoDay, todayIso } from "../../lib/dates.js";
import { FLOWS, MOODS, SYMPTOMS } from "../../lib/cycle.js";

function Chip({ active, onClick, children, tone = "brand" }) {
  const tones = {
    brand: active ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600",
    health: active ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`focus-ring rounded-full border px-3.5 py-2 text-sm font-medium capitalize transition
        ${tones[tone]} ${active ? "" : "bg-white/70 hover:border-slate-300"}`}
    >
      {children}
    </button>
  );
}

function ChipGroup({ label, children }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const initialValues = (log) => ({
  startDate: isoDay(log?.startDate) ?? todayIso(),
  endDate: isoDay(log?.endDate) ?? "",
  flow: log?.flow ?? "medium",
  symptoms: log?.symptoms ?? [],
  mood: log?.mood ?? "",
  notes: log?.notes ?? "",
});

// Mounted fresh per open (keyed by the caller), so state starts from the log being edited.
export default function LogPeriodModal({ log, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(() => initialValues(log));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const toggleSymptom = (symptom) =>
    set(
      "symptoms",
      values.symptoms.includes(symptom)
        ? values.symptoms.filter((item) => item !== symptom)
        : [...values.symptoms, symptom]
    );

  function validate() {
    const found = {};
    if (!values.startDate) found.startDate = "Pick the day your period started";
    else if (values.startDate > todayIso()) found.startDate = "That is in the future";
    if (values.endDate && values.endDate < values.startDate) {
      found.endDate = "The end cannot be before the start";
    }
    return found;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        startDate: values.startDate,
        flow: values.flow,
        symptoms: values.symptoms,
        ...(values.endDate ? { endDate: values.endDate } : {}),
        ...(values.mood ? { mood: values.mood } : {}),
        ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
      };

      if (log) await healthApi.updateCycle(log.id, payload);
      else await healthApi.createCycle(payload);

      toast.success(log ? "Period updated." : "Period logged.");
      onSaved();
      onClose();
    } catch (error) {
      // The backend owns the overlap and date rules; show them on the right field.
      const byCode = {
        CYCLE_OVERLAP: { startDate: "This overlaps a period you already logged" },
        FUTURE_START_DATE: { startDate: "That is in the future" },
        INVALID_DATE_RANGE: { endDate: "The end cannot be before the start" },
      };
      const mapped = byCode[error.code] ?? error.fieldErrors ?? {};
      setErrors(mapped);
      if (Object.keys(mapped).length === 0) toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={log ? "Edit this period" : "Log a period"}
      description="Only the start date is required. Everything else helps the predictions."
      size="lg"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Started on"
            type="date"
            max={todayIso()}
            value={values.startDate}
            onChange={(event) => set("startDate", event.target.value)}
            error={errors.startDate}
            required
          />
          <Input
            label="Ended on"
            type="date"
            min={values.startDate || undefined}
            value={values.endDate}
            onChange={(event) => set("endDate", event.target.value)}
            error={errors.endDate}
            hint="Leave empty if it is still going."
          />
        </div>

        <ChipGroup label="Flow">
          {FLOWS.map(({ value, label }) => (
            <Chip
              key={value}
              tone="health"
              active={values.flow === value}
              onClick={() => set("flow", value)}
            >
              {label}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Symptoms">
          {SYMPTOMS.map((symptom) => (
            <Chip
              key={symptom}
              active={values.symptoms.includes(symptom)}
              onClick={() => toggleSymptom(symptom)}
            >
              {symptom}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Mood">
          {MOODS.map((mood) => (
            <Chip
              key={mood}
              active={values.mood === mood}
              onClick={() => set("mood", values.mood === mood ? "" : mood)}
            >
              {mood}
            </Chip>
          ))}
        </ChipGroup>

        <Textarea
          label="Notes"
          rows={3}
          maxLength={500}
          placeholder="Anything you want to remember about this cycle."
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          error={errors.notes}
          hint={`${values.notes.length} / 500`}
        />

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {log ? "Save changes" : "Log period"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
