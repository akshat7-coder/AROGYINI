import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Modal from "../ui/Modal.jsx";
import Badge from "../ui/Badge.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import * as safetyApi from "../../api/safety.js";
import { useToast } from "../../context/toastContext.js";
import { useSos } from "../../context/sosContext.js";
import { runValidators, validateName } from "../../lib/validation.js";

const MAX_CONTACTS = 5;
const EMPTY = { name: "", phone: "", relation: "", priority: "" };

// Phone is required here, unlike on the profile, so it gets its own validator.
const validateRequiredPhone = (value) => {
  const phone = (value ?? "").trim();
  if (!phone) return "Phone number is required";
  const cleaned = phone.replace(/[^\d+]/g, "");
  const normalised = cleaned.startsWith("+")
    ? cleaned
    : cleaned.startsWith("00")
      ? `+${cleaned.slice(2)}`
      : `+91${cleaned.replace(/^0/, "")}`;
  return /^\+[1-9]\d{7,14}$/.test(normalised)
    ? null
    : "Enter a valid number, e.g. 98765 43210";
};

// Mounted fresh on each open (keyed by the caller), so initial state comes from props.
function ContactForm({ contact, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(() =>
    contact
      ? {
          name: contact.name ?? "",
          phone: contact.phone ?? "",
          relation: contact.relation ?? "",
          priority: String(contact.priority ?? ""),
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = runValidators(values, { name: validateName, phone: validateRequiredPhone });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        ...(values.relation.trim() ? { relation: values.relation.trim() } : {}),
        ...(values.priority ? { priority: Number(values.priority) } : {}),
      };
      const result = contact
        ? await safetyApi.updateContact(contact.id, payload)
        : await safetyApi.createContact(payload);

      toast.success(contact ? "Contact updated." : "Contact added.");
      onSaved(result.contact);
      onClose();
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (error.code === "DUPLICATE_KEY") {
        setErrors({ phone: "That number is already one of your contacts" });
      } else if (Object.keys(fieldErrors).length === 0) {
        toast.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={contact ? "Edit contact" : "Add an emergency contact"}
      description="They will get an SMS with your live location when you send an SOS."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Name"
          placeholder="Maa"
          value={values.name}
          onChange={update("name")}
          error={errors.name}
          required
        />

        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          hint="Indian numbers need no country code. Saved as +91…"
          value={values.phone}
          onChange={update("phone")}
          error={errors.phone}
          className="font-mono"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Relation"
            placeholder="Mother"
            value={values.relation}
            onChange={update("relation")}
            error={errors.relation}
          />
          <Input
            label="Priority"
            type="number"
            min="1"
            max="5"
            placeholder="1"
            hint="1 is contacted first."
            value={values.priority}
            onChange={update("priority")}
            error={errors.priority}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {contact ? "Save changes" : "Add contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ContactsManager() {
  const toast = useToast();
  const { refreshContactCount } = useSos();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const apply = useCallback(
    (list) => {
      setContacts(list);
      refreshContactCount(list.length);
    },
    [refreshContactCount]
  );

  const reload = useCallback(
    () =>
      safetyApi
        .listContacts()
        .then(({ contacts: list }) => apply(list))
        .catch((error) => toast.error(error.message))
        .finally(() => setLoading(false)),
    [apply, toast]
  );

  useEffect(() => {
    let active = true;
    safetyApi
      .listContacts()
      .then(({ contacts: list }) => active && apply(list))
      .catch((error) => active && toast.error(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [apply, toast]);

  async function onDelete() {
    setDeleting(true);
    try {
      await safetyApi.deleteContact(pendingDelete.id);
      toast.success(`${pendingDelete.name} removed.`);
      setPendingDelete(null);
      await reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  const full = contacts.length >= MAX_CONTACTS;

  return (
    <Card as="section">
      <CardHeader
        title="Emergency contacts"
        description="Up to five people who get your location when you send an SOS."
        icon={Users}
        action={
          <Badge tone={full ? "warning" : "neutral"}>
            {contacts.length} / {MAX_CONTACTS}
          </Badge>
        }
      />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No contacts yet"
          description="Add at least one person so SOS has somewhere to send your location."
          action={
            <Button
              size="lg"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Add a contact
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-brand-100 text-brand-700 grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                  {contact.priority}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{contact.name}</p>
                  <p className="font-mono truncate text-xs text-slate-500">{contact.phone}</p>
                  {contact.relation ? (
                    <p className="truncate text-xs text-slate-500 capitalize">{contact.relation}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`Call ${contact.name}`}
                  className="focus-ring grid size-11 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
                >
                  <span className="font-mono text-xs font-bold">Call</span>
                </a>
                <button
                  type="button"
                  aria-label={`Edit ${contact.name}`}
                  onClick={() => {
                    setEditing(contact);
                    setFormOpen(true);
                  }}
                  className="focus-ring grid size-11 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${contact.name}`}
                  onClick={() => setPendingDelete(contact)}
                  className="focus-ring grid size-11 place-items-center rounded-full text-rose-500 transition hover:bg-rose-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && contacts.length > 0 ? (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="lg"
            disabled={full}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="w-full"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            {full ? "Five contacts is the maximum" : "Add another contact"}
          </Button>
        </div>
      ) : null}

      {formOpen ? (
        <ContactForm
          key={editing?.id ?? "new"}
          contact={editing}
          onClose={() => setFormOpen(false)}
          onSaved={reload}
        />
      ) : null}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Remove this contact?"
        description={`${pendingDelete?.name ?? ""} will no longer be alerted when you send an SOS.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep
            </Button>
            <Button variant="danger" loading={deleting} onClick={onDelete}>
              Remove
            </Button>
          </>
        }
      />
    </Card>
  );
}
