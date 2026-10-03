export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-4 grid size-14 place-items-center rounded-3xl bg-slate-100 text-slate-400">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
