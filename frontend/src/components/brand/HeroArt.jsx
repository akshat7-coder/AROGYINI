// Flat illustration in the brand palette, inline so it scales and themes with the page.
export default function HeroArt({ className = "", ...props }) {
  return (
    <svg viewBox="0 0 400 420" className={className} role="img" aria-label="Illustration of a woman surrounded by flowers" {...props}>
      <defs>
        <linearGradient id="ha-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6b2a59" />
          <stop offset="100%" stopColor="#3d1733" />
        </linearGradient>
        <linearGradient id="ha-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc9dd" />
          <stop offset="100%" stopColor="#f871a4" />
        </linearGradient>
      </defs>

      <circle cx="210" cy="200" r="175" fill="#ffe3ee" opacity=".65" />

      {/* Shield with a heart: the safety pillar, kept behind the figure. */}
      <g opacity=".55" transform="translate(-26 52)">
        <path
          d="M96 96c22 0 40-9 52-18 12 9 30 18 52 18v62c0 38-28 62-52 74-24-12-52-36-52-74V96Z"
          fill="#ffd9e6"
          stroke="#f871a4"
          strokeWidth="3"
        />
        <path
          d="M148 170c-14-11-22-17-22-26a11 11 0 0 1 22-5 11 11 0 0 1 22 5c0 9-8 15-22 26Z"
          fill="#ea4886"
        />
      </g>

      {/* Hair, then face in profile facing left. */}
      <path
        d="M196 92c44 0 74 32 74 76 0 30-10 48-6 78 4 30-6 56-30 70 14-34 4-52-6-66-12-17-16-30-14-48 2-20-8-30-24-30-22 0-34-16-34-40 0-24 18-40 40-40Z"
        fill="url(#ha-hair)"
      />
      <path
        d="M196 104c26 0 42 20 42 46 0 14-4 22-12 26l4 16c1 5-2 8-7 8h-9l1 16c1 8-4 13-12 13-14 0-24-8-28-20-6-18-12-28-12-46 0-26 10-59 33-59Z"
        fill="#fcd9d0"
      />
      <path
        d="M168 148c-6 8-12 18-14 24-1 4 1 6 5 7l8 2"
        fill="none"
        stroke="#e8a89a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M160 196c6 3 12 3 17 0" fill="none" stroke="#d4766a" strokeWidth="3" strokeLinecap="round" />
      <path d="M176 142c6-3 12-2 16 2" fill="none" stroke="#6b2a59" strokeWidth="3.5" strokeLinecap="round" />

      {/* Blossoms tucked into the hair and along the stem below. */}
      <g>
        {[
          [252, 150, 1.15],
          [276, 206, 0.8],
          [112, 300, 1.5],
          [182, 330, 1],
          [300, 300, 0.9],
        ].map(([x, y, s]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-13" rx="8" ry="13" fill="url(#ha-petal)" transform={`rotate(${a})`} />
            ))}
            <circle r="5" fill="#fff3f8" />
          </g>
        ))}
      </g>

      <g fill="none" stroke="#2f9e8f" strokeWidth="3" strokeLinecap="round" opacity=".7">
        <path d="M112 330v56" />
        <path d="M112 356c-16 0-26-9-26-22 14 0 26 9 26 22Z" fill="#2f9e8f" fillOpacity=".2" />
        <path d="M112 346c16 0 26-9 26-22-14 0-26 9-26 22Z" fill="#2f9e8f" fillOpacity=".2" />
        <path d="M300 326v44" />
        <path d="M300 348c14 0 22-8 22-19-12 0-22 8-22 19Z" fill="#2f9e8f" fillOpacity=".2" />
      </g>
    </svg>
  );
}

// Small divider used beside section headings, matching the hero's floral language.
export function Sprig({ className = "size-5", flip = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 21C9 19 15 14 19 5" />
        <path d="M11 13c-3-1-4-4-3-7 3 1 4 4 3 7Z" fill="currentColor" fillOpacity=".25" />
        <path d="M14 10c3 1 6 0 8-3-3-1-6 0-8 3Z" fill="currentColor" fillOpacity=".25" />
      </g>
    </svg>
  );
}
