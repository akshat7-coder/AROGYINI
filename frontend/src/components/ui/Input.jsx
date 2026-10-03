import FieldShell from "./Field.jsx";
import { fieldClasses, useField } from "./fieldUtils.js";

export default function Input({ label, error, hint, required, className = "", id, ...props }) {
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
      <input
        {...controlProps}
        required={required}
        className={`${fieldClasses(error)} h-11 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
