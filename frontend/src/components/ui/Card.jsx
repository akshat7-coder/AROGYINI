export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={`glass p-6 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, icon: Icon, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="bg-brand-50 text-brand-600 grid size-10 shrink-0 place-items-center rounded-2xl">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
