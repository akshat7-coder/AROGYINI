import { useId, useState } from "react";
import { ChevronDown, FileText, ListChecks, Phone, ShieldAlert } from "lucide-react";
import Badge from "../ui/Badge.jsx";

const CATEGORY_TONES = {
  workplace: "info",
  domestic: "danger",
  marriage: "brand",
  cyber: "info",
  criminal: "warning",
  media: "neutral",
};

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Icon className="text-legal size-4" aria-hidden="true" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function OrderedList({ items }) {
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span className="bg-legal/10 text-legal tnum mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold">
            {index + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

export default function RightCard({ right }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className="glass overflow-hidden p-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-ring flex w-full items-start gap-4 p-5 text-left transition hover:bg-white/40"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={CATEGORY_TONES[right.category] ?? "neutral"}>{right.category}</Badge>
              {right.year ? <span className="tnum text-xs text-slate-500">{right.year}</span> : null}
            </div>
            <p className="text-base font-semibold text-slate-900">{right.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{right.actName}</p>
            {open ? null : (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{right.summary}</p>
            )}
          </div>

          <ChevronDown
            className={`mt-1 size-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open ? (
        <div id={panelId} className="space-y-6 border-t border-white/80 px-5 pt-5 pb-6">
          <p className="text-sm leading-relaxed text-slate-700">{right.summary}</p>

          {right.keyProtections?.length > 0 ? (
            <Section icon={ListChecks} title="What the law gives you">
              <ul className="space-y-2">
                {right.keyProtections.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span className="bg-legal mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {right.howToFile?.length > 0 ? (
            <Section icon={FileText} title="How to file">
              <OrderedList items={right.howToFile} />
            </Section>
          ) : null}

          {right.penalties ? (
            <Section icon={ShieldAlert} title="Penalties">
              <p className="rounded-2xl bg-white/70 p-3.5 text-sm leading-relaxed text-slate-700">
                {right.penalties}
              </p>
            </Section>
          ) : null}

          {right.helplines?.length > 0 ? (
            <Section icon={Phone} title="Helplines">
              <ul className="flex flex-wrap gap-2">
                {right.helplines.map((helpline) => {
                  const number = helpline.match(/[\d-]{3,}/)?.[0];
                  return (
                    <li key={helpline}>
                      {number ? (
                        <a
                          href={`tel:${number}`}
                          className="focus-ring inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                        >
                          {helpline}
                        </a>
                      ) : (
                        <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs text-slate-600">
                          {helpline}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}

          {right.faqs?.length > 0 ? (
            <Section icon={ListChecks} title="Common questions">
              <dl className="space-y-3">
                {right.faqs.map(({ q, a }) => (
                  <div key={q} className="rounded-2xl bg-white/70 p-3.5">
                    <dt className="text-sm font-semibold text-slate-800">{q}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-600">{a}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
