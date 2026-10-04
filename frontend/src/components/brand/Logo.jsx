// The mark: a blossom over a stem, drawn inline so it inherits currentColor and never 404s.
export function LogoMark({ className = "size-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M20 36V20" />
        <path d="M20 27c-4 0-7-2.4-7-6 3.8 0 7 2.4 7 6Z" fill="currentColor" fillOpacity=".18" />
        <path d="M20 23c4 0 7-2.4 7-6-3.8 0-7 2.4-7 6Z" fill="currentColor" fillOpacity=".18" />
      </g>
      <g fill="currentColor">
        <ellipse cx="20" cy="8" rx="3.4" ry="5" opacity=".85" />
        <ellipse cx="20" cy="8" rx="3.4" ry="5" opacity=".85" transform="rotate(72 20 11)" />
        <ellipse cx="20" cy="8" rx="3.4" ry="5" opacity=".85" transform="rotate(144 20 11)" />
        <ellipse cx="20" cy="8" rx="3.4" ry="5" opacity=".85" transform="rotate(216 20 11)" />
        <ellipse cx="20" cy="8" rx="3.4" ry="5" opacity=".85" transform="rotate(288 20 11)" />
        <circle cx="20" cy="11" r="2.2" fill="#fff" fillOpacity=".75" />
      </g>
    </svg>
  );
}

export default function Logo({ tagline = true, className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="text-brand-500 size-9 shrink-0" />
      <span className="min-w-0">
        <span className="font-display text-ink block truncate text-xl leading-none font-bold tracking-wide">
          AROGYINI
        </span>
        {tagline ? (
          <span className="text-brand-600/80 mt-1 block truncate text-[9px] font-semibold tracking-[0.22em] uppercase">
            Health · Safety · Awareness
          </span>
        ) : null}
      </span>
    </span>
  );
}
