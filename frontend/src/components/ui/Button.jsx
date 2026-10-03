import Spinner from "./Spinner.jsx";

const VARIANTS = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary: "border border-slate-200 bg-white/80 text-slate-700 hover:bg-white",
  ghost: "text-slate-600 hover:bg-slate-900/5",
  danger: "bg-safety text-white shadow-sm hover:brightness-110",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-sm",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`focus-ring inline-flex items-center justify-center rounded-full font-semibold transition
        disabled:pointer-events-none disabled:opacity-50
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner label="Working" /> : null}
      {children}
    </button>
  );
}
