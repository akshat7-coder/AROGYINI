import { Sparkles } from "lucide-react";
import { BOT_META } from "../../lib/chat.js";

// "Auto" lets the backend route on intent; the rest force one bot.
export default function BotPicker({ bots, value, onChange, loading }) {
  const options = [{ key: "auto", label: "Auto" }, ...bots.map((bot) => ({ key: bot.key, label: BOT_META[bot.key]?.label ?? bot.name }))];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Ask
      </span>

      <div className="flex gap-1 rounded-full bg-white/70 p-1" role="group" aria-label="Choose which assistant answers">
        {loading ? (
          <span className="px-3 py-1.5 text-xs text-slate-500">Loading assistants…</span>
        ) : (
          options.map(({ key, label }) => {
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(key)}
                className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold transition
                  ${selected ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-900/5"}`}
              >
                {label}
              </button>
            );
          })
        )}
      </div>

      {value === "auto" ? (
        <span className="text-[11px] text-slate-500">Routed by what you ask</span>
      ) : null}
    </div>
  );
}
