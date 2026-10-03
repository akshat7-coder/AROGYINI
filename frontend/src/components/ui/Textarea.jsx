import FieldShell from "./Field.jsx";
import { fieldClasses, useField } from "./fieldUtils.js";

export default function Textarea({
  label,
  error,
  hint,
  required,
  rows = 4,
  className = "",
  id,
  ...props
}) {
  const { fieldId, errorId, hintId, controlProps } = useField({ id, error, hint });

  return (
    <FieldShell
      label={label}
      required={required}
      fieldId={fieldId}
      error={error}
      errorId={errorId}
      hint={hint}
      hintId={hintId}
    >
      <textarea
        {...controlProps}
        rows={rows}
        required={required}
        className={`${fieldClasses(error)} resize-y py-3 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
