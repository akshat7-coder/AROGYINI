import { useMemo, useState } from "react";
import { FileText, Scale, Sparkles } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import DraftPreview from "./DraftPreview.jsx";
import * as legalApi from "../../api/legal.js";
import { useToast } from "../../context/toastContext.js";
import {
  DRAFT_TYPES,
  draftSpec,
  initialDraftValues,
  toDraftPayload,
  validateDraft,
} from "../../lib/legalDrafts.js";

function CheckboxGroup({ field, value, onChange, error }) {
  const selected = value ?? [];

  const toggle = (option) =>
    onChange(
      selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]
    );

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">{field.label}</legend>
      <div className="space-y-2">
        {field.options.map(({ value: option, label }) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-white/70 px-3.5 py-2.5 text-sm text-slate-700 transition hover:bg-white"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="accent-legal focus-ring size-4"
            />
            {label}
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function DraftField({ field, value, onChange, error }) {
  if (field.type === "checkboxes") {
    return <CheckboxGroup field={field} value={value} onChange={onChange} error={error} />;
  }

  if (field.type === "textarea" || field.type === "list") {
    return (
      <Textarea
        label={field.label}
        rows={field.rows ?? (field.type === "list" ? 3 : 4)}
        required={field.required}
        placeholder={field.placeholder}
        hint={field.hint}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
      />
    );
  }

  return (
    <Input
      label={field.label}
      type={field.type ?? "text"}
      required={field.required}
      placeholder={field.placeholder}
      hint={field.hint}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      className={field.type === "number" ? "font-mono" : undefined}
    />
  );
}

export default function ComplaintDrafter() {
  const toast = useToast();
  const [type, setType] = useState(DRAFT_TYPES[0].type);
  const spec = useMemo(() => draftSpec(type), [type]);
  const [valuesByType, setValuesByType] = useState({});
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);

  const values = valuesByType[type] ?? initialDraftValues(spec);

  const setValue = (name, value) => {
    setValuesByType((current) => ({ ...current, [type]: { ...values, [name]: value } }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function switchType(nextType) {
    setType(nextType);
    setErrors({});
    setDraft(null);
  }

  async function onGenerate(event) {
    event.preventDefault();

    const found = validateDraft(spec, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Fill in the required fields first.");
      return;
    }

    setGenerating(true);
    try {
      const result = await legalApi.createDraft(toDraftPayload(spec, values));
      setDraft(result);
      toast.success("Draft ready. Read it through before you file it.");
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
      else toast.error("Some fields need fixing.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader
        title="Complaint drafter"
        description="Answer the questions and get a formatted complaint you can take with you."
        icon={FileText}
      />

      <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
        {DRAFT_TYPES.map((entry) => {
          const selected = entry.type === type;
          return (
            <button
              key={entry.type}
              type="button"
              aria-pressed={selected}
              onClick={() => switchType(entry.type)}
              className={`focus-ring rounded-2xl border p-4 text-left transition
                ${
                  selected
                    ? "border-legal bg-legal/5 ring-legal/30 ring-2"
                    : "border-slate-200 bg-white/70 hover:border-slate-300"
                }`}
            >
              <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
              <p className="text-legal mt-0.5 text-xs font-medium">{entry.act}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{entry.blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onGenerate} noValidate className="space-y-4">
          {spec.fields.map((field) => (
            <DraftField
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(value) => setValue(field.name, value)}
              error={errors[field.name]}
            />
          ))}

          <Button type="submit" size="lg" loading={generating} className="w-full">
            <Sparkles className="size-4" aria-hidden="true" />
            Generate the draft
          </Button>
        </form>

        <div>
          <DraftPreview draft={draft} loading={generating} />

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <Scale className="text-legal mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">Free legal aid</p>
              <p className="mt-0.5 text-sm text-indigo-800">
                A lawyer should check this before you file it. Free legal aid is available to every
                woman in India through NALSA, whatever your income.
              </p>
              <a
                href="tel:15100"
                className="focus-ring font-mono mt-2 inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-bold text-indigo-900 transition hover:bg-indigo-100"
              >
                Call 15100
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
