import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import {
  BLOOD_GROUPS,
  runValidators,
  validateCity,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "../lib/validation.js";

const EMPTY = { name: "", email: "", password: "", phone: "", city: "", bloodGroup: "" };

export default function SignUp() {
  const { signup, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = runValidators(values, {
      name: validateName,
      email: validateEmail,
      password: validatePassword,
      phone: validatePhone,
      city: validateCity,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      // Only send optional fields that were filled in; the backend rejects empty strings.
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.city.trim() ? { city: values.city.trim() } : {}),
        ...(values.bloodGroup ? { bloodGroup: values.bloodGroup } : {}),
      };
      const user = await signup(payload);
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}.`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, and your data stays yours."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="text-brand-700 focus-ring rounded font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{formError}</p>
          </div>
        ) : null}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Asha Rao"
          value={values.name}
          onChange={update("name")}
          error={errors.name}
          required
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="At least 8 characters, with one letter and one number."
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          required
        />

        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          hint="Optional. Used for your profile, not for alerts."
          value={values.phone}
          onChange={update("phone")}
          error={errors.phone}
          className="font-mono"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            autoComplete="address-level2"
            placeholder="Pune"
            value={values.city}
            onChange={update("city")}
            error={errors.city}
          />

          <Select
            label="Blood group"
            placeholder="Select"
            options={BLOOD_GROUPS}
            value={values.bloodGroup}
            onChange={update("bloodGroup")}
            error={errors.bloodGroup}
          />
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>

        <p className="text-center text-xs text-slate-500">
          AROGYINI gives information and support, not medical or legal advice.
        </p>
      </form>
    </AuthLayout>
  );
}
