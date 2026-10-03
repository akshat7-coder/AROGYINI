import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import Skeleton from "../ui/Skeleton.jsx";

export default function PillarCard({
  to,
  icon: Icon,
  title,
  tint,
  loading,
  headline,
  detail,
  badge,
}) {
  return (
    <Link to={to} className="focus-ring glass hover-lift block rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tint}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {badge}
      </div>

      <h3 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-slate-800">
        {title}
        <ArrowRight className="size-3.5 text-slate-300" aria-hidden="true" />
      </h3>

      {loading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      ) : (
        <>
          <p className="mt-1.5 text-lg font-semibold text-slate-900">{headline}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{detail}</p>
        </>
      )}
    </Link>
  );
}
