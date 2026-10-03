import { useState } from "react";
import { KeyRound, UserCog } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Badge from "../components/ui/Badge.jsx";
import * as authApi from "../api/auth.js";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import {
  BLOOD_GROUPS,
  runValidators,
  validateCity,
  validateName,
  validatePassword,
  validatePhone,
} from "../lib/validation.js";

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    bloodGroup: user?.bloodGroup ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = runValidators(values, {
      name: validateName,
      phone: validatePhone,
      city: validateCity,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      // PATCH only accepts name, phone, bloodGroup and city, and rejects empty strings.
      const payload = {
        name: values.name.trim(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.city.trim() ? { city: values.city.trim() } : {}),
        ...(values.bloodGroup ? { bloodGroup: values.bloodGroup } : {}),
      };
      const { user: updated } = await authApi.updateMe(payload);
      setUser(updated);
      setValues({
        name: updated.name ?? "",
        phone: updated.phone ?? "",
        city: updated.city ?? "",
        bloodGroup: updated.bloodGroup ?? "",
      });
      toast.success("Profile updated.");
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader
        title="Your details"
        description="Your email cannot be changed here."
        icon={UserCog}
        action={user?.role === "admin" ? <Badge tone="brand">Admin</Badge> : null}
      />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Full name" value={values.name} onChange={update("name")} error={errors.name} required />

        <Input label="Email" type="email" value={user?.email ?? ""} disabled readOnly />

        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          hint="Stored in international format, for example +919876543210."
          value={values.phone}
          onChange={update("phone")}
          error={errors.phone}
          className="font-mono"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" value={values.city} onChange={update("city")} error={errors.city} />
          <Select
            label="Blood group"
            placeholder="Select"
            options={BLOOD_GROUPS}
            value={values.bloodGroup}
            onChange={update("bloodGroup")}
            error={errors.bloodGroup}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordForm() {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = runValidators(values, {
      currentPassword: (value) => (value ? null : "Enter your current password"),
      newPassword: validatePassword,
      confirmPassword: (value) => (value === values.newPassword ? null : "Passwords do not match"),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues(EMPTY_PASSWORDS);
      toast.success("Password updated.");
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      // A wrong current password comes back as 401 with no field detail.
      if (error.code === "INVALID_CREDENTIALS") {
        setErrors({ currentPassword: "That is not your current password" });
      } else {
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader
        title="Change password"
        description="You will stay signed in on this device."
        icon={KeyRound}
      />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={update("currentPassword")}
          error={errors.currentPassword}
          required
        />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with one letter and one number."
          value={values.newPassword}
          onChange={update("newPassword")}
          error={errors.newPassword}
          required
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          required
        />

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function Profile() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
