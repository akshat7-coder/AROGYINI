import { ChevronDown } from "lucide-react";
import FieldShell from "./Field.jsx";
import { fieldClasses, useField } from "./fieldUtils.js";

export default function Select({
  label,
  error,
  hint,
  required,
  options = [],
  placeholder,
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
      <div className="relative">
        <select
          {...controlProps}
          required={required}
          className={`${fieldClasses(error)} h-11 appearance-none pr-10 ${className}`}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const { value, label: text } = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
