import { MessageSquare, Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { formatShort } from "../../lib/dates.js";

export default function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  onNew,
  onDelete,
  creating,
}) {
  return (
    <div className="flex h-full flex-col">
      <Button size="md" loading={creating} onClick={onNew} className="w-full">
        <Plus className="size-4" aria-hidden="true" />
        New conversation
      </Button>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500">
            No conversations yet. Start one above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {conversations.map((conversation) => {
              const selected = conversation.id === activeId;
              return (
                <li key={conversation.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={selected ? "true" : undefined}
                    className={`focus-ring w-full rounded-2xl p-3 pr-11 text-left transition
                      ${selected ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
                  >
                    <span className="flex items-start gap-2.5">
                      <MessageSquare
                        className={`mt-0.5 size-4 shrink-0 ${selected ? "text-brand-600" : "text-slate-400"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {conversation.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {formatShort(conversation.lastMessageAt)}
                        </span>
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(conversation)}
                    aria-label={`Delete ${conversation.title}`}
                    className="focus-ring absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:text-rose-500"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
