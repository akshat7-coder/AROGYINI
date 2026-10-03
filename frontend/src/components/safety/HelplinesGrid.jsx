import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import * as safetyApi from "../../api/safety.js";

const CATEGORY_TONES = {
  emergency: "bg-rose-50 text-rose-700",
  women: "bg-brand-50 text-brand-700",
  cyber: "bg-indigo-50 text-indigo-700",
  legal: "bg-violet-50 text-violet-700",
  medical: "bg-teal-50 text-teal-700",
  "mental-health": "bg-amber-50 text-amber-800",
};

export default function HelplinesGrid() {
  const [helplines, setHelplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    safetyApi
      .getHelplines()
      .then(({ helplines: list }) => active && setHelplines(list))
      .catch((apiError) => active && setError(apiError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card as="section">
      <CardHeader title="Helplines" description="Free, and open around the clock." icon={Phone} />

      {loading ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          Could not load the list. The main numbers are 112 for emergencies and 181 for the women's
          helpline.
        </p>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {helplines.map(({ name, number, description, category }) => (
            <li key={number}>
              <a
                href={`tel:${number}`}
                className="focus-ring hover-lift block h-full rounded-2xl bg-white/70 p-4 transition hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono tnum text-lg font-bold text-slate-900">{number}</span>
                  {category ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        CATEGORY_TONES[category] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {category.replace("-", " ")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{name}</p>
                {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
