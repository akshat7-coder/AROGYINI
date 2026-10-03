import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import { runValidators, validateEmail } from "../lib/validation.js";

export default function SignIn() {
  const { login, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? "/dashboard"} replace />;
  }

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  async function onSubmit(event) {
    event.preventDefault();

    const found = runValidators(values, {
      email: validateEmail,
      password: (value) => (value ? null : "Password is required"),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const user = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (error) {
      // Field errors inline; anything else (bad credentials, inactive, rate limit) at the top.
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="text-brand-700 focus-ring rounded font-semibold hover:underline">
            Create an account
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
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          required
        />

        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
