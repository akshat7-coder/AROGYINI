export default function Tabs({ tabs, active, onChange, label = "Sections" }) {
  // Left/Right move between tabs, as expected of a tablist.
  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === active);
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    onChange(tabs[(index + delta + tabs.length) % tabs.length].id);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="glass flex gap-1 overflow-x-auto p-1.5"
    >
      {tabs.map(({ id, label: text, icon: Icon, count }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={`focus-ring flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition
              ${selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}
          >
            {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
            {text}
            {count === undefined ? null : (
              <span
                className={`tnum rounded-full px-1.5 py-0.5 text-[11px] ${
                  selected ? "bg-slate-900/10 text-slate-700" : "bg-slate-900/5 text-slate-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, active, children }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} className="focus-ring">
      {children}
    </div>
  );
}
