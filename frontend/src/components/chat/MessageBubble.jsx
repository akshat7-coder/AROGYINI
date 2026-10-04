import { AlertTriangle, Flag, Timer } from "lucide-react";
import EmergencyCard from "./EmergencyCard.jsx";
import { renderMarkdown } from "../../lib/markdown.jsx";
import { BOT_META, formatLatency } from "../../lib/chat.js";

const timeOf = (value) =>
  new Date(value).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

export default function MessageBubble({ message, onReport }) {
  const mine = message.role === "user";
  const failed = message.status === "failed";
  const bot = BOT_META[message.bot];
  const latency = formatLatency(message.latencyMs);

  if (mine) {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-brand-600 rounded-3xl rounded-br-lg px-4 py-3 text-sm leading-relaxed text-white">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="mt-1 pr-1 text-right text-[11px] text-slate-500">
            {timeOf(message.createdAt)}
          </p>
        </div>
      </li>
    );
  }

  return (
    <li className="flex justify-start">
      <div className="max-w-[90%] sm:max-w-[80%]">
        <div
          className={`rounded-3xl rounded-bl-lg border px-4 py-3 text-sm leading-relaxed
            ${failed ? "border-amber-200 bg-amber-50 text-amber-900" : "border-white/80 bg-white/80 text-slate-700"}`}
        >
          {failed ? (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              This answer did not come through
            </p>
          ) : null}

          <div className="space-y-2.5">{renderMarkdown(message.content)}</div>

          {message.emergency ? <EmergencyCard /> : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 pl-1">
          {bot ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${bot.tone}`}
            >
              <span className={`size-1.5 rounded-full ${bot.dot}`} aria-hidden="true" />
              {bot.label}
            </span>
          ) : null}

          {latency ? (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Timer className="size-3" aria-hidden="true" />
              <span className="tnum">{latency}</span>
            </span>
          ) : null}

          <span className="text-[11px] text-slate-500">{timeOf(message.createdAt)}</span>

          <button
            type="button"
            onClick={() => onReport(message)}
            className="focus-ring ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-600"
          >
            <Flag className="size-3" aria-hidden="true" />
            Report
          </button>
        </div>
      </div>
    </li>
  );
}

export function TypingIndicator() {
  return (
    <li className="flex justify-start" aria-live="polite">
      <div className="rounded-3xl rounded-bl-lg border border-white/80 bg-white/80 px-4 py-3.5">
        <span className="sr-only">The assistant is replying</span>
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-2 rounded-full bg-slate-300 motion-safe:animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </li>
  );
}
