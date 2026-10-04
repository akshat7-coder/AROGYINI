import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import Select from "../ui/Select.jsx";
import { useToast } from "../../context/toastContext.js";
import { toApiPayload, toFormValues, validateResource } from "../../lib/adminResources.js";

function Field({ field, value, onChange, error }) {
  if (field.type === "checkbox") {
    const warn = field.warnWhenOff && !value;
    return (
      <div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-white/70 px-3.5 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="accent-brand-600 focus-ring size-4"
          />
          {field.label}
        </label>
        {warn ? (
          <p className="mt-2 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {field.warnWhenOff}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Select
        label={field.label}
        required={field.required}
        hint={field.hint}
        placeholder="Select"
        options={field.options}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
      />
    );
  }

  if (field.type === "textarea" || field.type === "list" || field.type === "pairs") {
    return (
      <Textarea
        label={field.label}
        rows={field.rows ?? 3}
        required={field.required}
        hint={field.hint}
        placeholder={field.placeholder}
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
      hint={field.hint}
      placeholder={field.placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
    />
  );
}

// Mounted fresh per open (keyed by the caller), so initial values come from the document.
export default function ResourceForm({ resource, doc, onClose, onSaved, onCreate, onUpdate }) {
  const toast = useToast();
  const isCreate = !doc;
  const [values, setValues] = useState(() => toFormValues(resource, doc));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fields = resource.fields.filter((field) => !field.createOnly || isCreate);

  const set = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = validateResource(resource, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = toApiPayload(resource, values, { isCreate });
      if (isCreate) await onCreate(payload);
      else await onUpdate(doc.id, payload);

      toast.success(isCreate ? `${resource.singular} created.` : `${resource.singular} updated.`);
      onSaved();
      onClose();
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      if (error.code === "DUPLICATE_KEY") {
        setErrors({ slug: "That slug is already taken" });
      } else {
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isCreate ? `New ${resource.singular}` : `Edit ${resource.singular}`}
      size="lg"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => set(field.name, value)}
            error={errors[field.name]}
          />
        ))}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isCreate ? "Create" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
