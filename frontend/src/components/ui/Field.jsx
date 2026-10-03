export default function FieldShell({
  label,
  required,
  fieldId,
  error,
  errorId,
  hint,
  hintId,
  children,
}) {
  return (
    <div>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required ? (
            <span className="text-brand-600 ml-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
